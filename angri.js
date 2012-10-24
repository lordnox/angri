/*
 *  Copyright 2011 Johannes Hiermer, Tobias Kopelke
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

 (function(angular) {
  'use strict';

  var angriModule = angular.module('angri', []),
      Filters = {
    FILTER_GT:  { sign: '>', code:'gt',  fn: function(item, filter) { return parseInt(item, 10) > parseInt(filter, 10); }},
    FILTER_LT:  { sign: '<', code:'lt',  fn: function(item, filter) { return parseInt(item, 10) < parseInt(filter, 10); }},
    FILTER_IN:  { sign: ':', code:'in',  fn: function(item, filter) { return typeof item === 'string' ? item.indexOf(filter) !== -1 : filter == item; }},
    FILTER_NIN: { sign: '!', code:'nin', fn: function(item, filter) { return typeof item === 'string' ? item.indexOf(filter) === -1 : filter != item; }},
    FILTER_EQ:  { sign: '=', code:'eq',  fn: function(item, filter) { return filter == item; }},
    FILTER_NEQ: { sign: '~', code:'neq', fn: function(item, filter) { return filter != item; }}
  },
    FILTER_REGEX  = new RegExp("^\\s*([a-zA-Z]+)\\s*([" + Object.keys(Filters).map(function(filter) { return "\\" + Filters[filter].sign; }).join('') + "])\\s*(.+)$"),
    FILTER_ANY    = Filters.FILTER_IN,
  Templates = {
    header:   '<thead>' +
                '<th ng-repeat="head in angri.header">' +
                  '<a class="btn span3" ng-class="{disabled: !head.name}"  ng-click="sort(head.index)">' +
                    '<i ng-class="{ \'icon-arrow-up\'  : !!head.name && (angri.predicate==head.name) && angri.reverse' +
                                  ',\'icon-arrow-down\': head.name && (angri.predicate==head.name) && !angri.reverse}" ></i>' +
                    '{{head.title}} ' +
                  '</a>' +
                '</th>' +
              '</thead>',
    controls: '<div class="row">' +
                '<div class="span4">' +
                  '<select ng-options="option for option in angri.limits" ng-model="angri.limit"></select>' +
                '</div>' +
                '<div class="control-group span8" ng-class="{error: angri.filterError}">' +
                  '<input type="text" style="float:right;" class="input-medium" ng-model="angri.filter" placeholder="{{i18n.filter}}" name="filter" />' +
                '</div>' +
              '</div>',
    footer:   '<div style="float: left;" class="pageNum">' +
                '<strong>{{i18n.total}}{{angri.filteredList(true).length}} [{{angri.unfilteredList(true).length}}]</strong>' +
              '</div>' +
              '<div class="pagination pagination-right">' +
                '<ul>' +
                  '<li ng-class="{disabled: angri.page == 1}">' +
                    '<a ng-click="prev()">{{i18n.prev}}</a>' +
                  '</li>' +
                  '<li ng-repeat="pageIndex in angri.filteredList() | angri_filter_lastPage:angri.limit | angri_filter_toPages:angri.maxPages:angri.page" ng-class="{active: angri.page==pageIndex, disabled: pageIndex==\'\u2026\'}">' +
                    '<a ng-click="page(pageIndex)">{{pageIndex}}</a></li>' +
                  '</li>' +
                  '<li ng-class="angri.filteredList() | angri_filter_lastPage:angri.limit | angri_filter_equal:angri.page:\'disabled\'">' +
                    '<a ng-click="next()">{{i18n.next}}</a>' +
                  '</li>' +
                '</ul>' +
              '</div>',
    debug:    '<pre>pagination = {{angri | json}}</pre>'
  };

  // the skip filter
  angriModule.filter('angri_filter_skip', function() {
      return function(array, page, limit) {
          return array.slice((page - 1) * limit);
      };
  });

  angriModule.filter('angri_filter_forceLimit', function() {
    return function(list) {
      if(!this.angri.forceLimit) return list;
      var limit = parseInt(this.angri.limit, 10);

      if(list.length < limit) {
        var results = new Array(limit);
        list.map(function(item, key) { results[key] = item; });
        // not possible to have the new Array fields default to something, angular
        // would just find itself in a digest-loop
        return results;
      }
      return list;
    };
  });

  angriModule.filter('angri_filter_lastPage', function() {
    return function(list, limit) {
      return Math.ceil(list.length / limit);
    };
  });

  angriModule.filter('angri_filter_equal', function() {
    return function(a, b, klass) {
      return a === b ? klass : '';
    };
  });

  angriModule.filter('angri_filter_toPages', function() {
    return function(length, count, page) {
      if(!length) return [];
      var results = [], index;
      if(length < count) {
        for (index = 1; index <= length; index++) {
          results.push(index);
        }
        return results;
      }

      var edge = (count-count%2)/2,
          low       = true,
          low_from  = 1,
          low_to    = edge,
          mid_from  = Math.max(1, page-edge),
          mid_to    = Math.min(length, page+edge),
          high      = true,
          high_from = length-edge+1,
          high_to   = length+1;

      if(mid_from - low_to <= 2) {
        low = false;
        mid_from = low_from;
      }

      if(high_from - mid_to <= 2) {
        high = false;
        mid_to = high_to - 1;
      }

      // building first part
      if(low) {
        for (index = low_from; index <= low_to; index++) {
          results.push(index);
        }
        results.push('\u2026');
      }

      // building middle part
      for (index = mid_from; index <= mid_to; index++) {
        results.push(index);
      }

      // building last part
      if(high) {
        results.push('\u2026');
        for (index = high_from; index < high_to; index++) {
          results.push(index);
        }
      }

      return results;
    };
  });

  // the row filter
  angriModule.filter('angri_filter_rowFilter', function() {
    return function(list, row, code, needle) {
      // return list if it is no list or something
      if(!list || !list.length) return list;
      // else filter the list
      return list.filter(function(item) {
        // dont include if the row does not have the item
        if(!(row in item)) return false;
        var element = item[row];
        // run through all Filters
        return Object.keys(Filters).filter(function(filter) {
          return Filters[filter].code==code;
        }).reduce(function(value, filter) {
          return value && Filters[filter].fn(element, needle);
        }, true);
      });
    };
  });

  angriModule.filter('angri_filter_anyRowFilter', function() {
      return function(array, filter) {
        var header = this.angri.header;
        return array.filter(function(item) {
          return header.map(function(head) {
            return FILTER_ANY.fn(item[head.name], filter);
          }).reduce(function(current, value) {
            return current || value;
          }, false);
        });
      };
  });

  // the main directive: ngGrid
  angriModule.directive('ngGrid',  function($compile) {
    return {
      compile: function compile(element) {
        var index             = 0,
            tr                = element.children('tbody').children('tr'),
            sourceExpression  = tr.attr('ng-repeat').match(/^\s*(.+)\s+in\s+(.*)\s*$/),
            baseExpression    = sourceExpression[2],
            itemExpression    = sourceExpression[1];

        tr.attr('ng-repeat', itemExpression + ' in angri.filteredList() | angri_filter_skip:angri.page:angri.limit | orderBy:angri.predicate:angri.reverse | limitTo:angri.limit | angri_filter_forceLimit');

        var header = [],
        filter_hash = {};

        angular.forEach(tr.children('td'), function(elm) {
            var column  = angular.element(elm),
                exp     = column.html().replace(/[{{}}\s]/g, ""),
                name    = column.attr('name'),
                title   = column.attr('title') || name;

            // build up a list of all header elements
            header.push({
              name: name,
              title: title,
              index: index
            });
            if(name) {
              filter_hash[angular.lowercase(name)] = index;
              filter_hash[name] = index;
            }
            filter_hash[angular.lowercase(title)] = index;
            filter_hash[title] = index;

            column.attr('title', null);
            index ++;
        });
        element.prepend(Templates.header);

        return {
          pre: function preLink(scope) {
            var cache               = null,
              lastExpression        = null;

            scope.angri = {
              expression      : baseExpression,
              debug           : element.attr('debug') !== undefined,   // kind of a debugging mode :-D
              forceLimit      : element.attr('forceLimit') !== undefined || element.attr('force-limit') !== undefined,   // force the size of the pages
              limit           : element.attr('limit')       || 10,      // max number of items on page
              limits          : [10, 20, 30, 60],
              page            : element.attr('page')        || 1,       // current page of the list
              maxPages        : element.attr('pagination')  || 5,       // max pages to show in pagination, half.floor() on edges
              filterError     : false,  // computed value, tells if filter is in an error state
              filter          : '',     // filter to be used with this grid
              header          : header, // header that was found for the grid
              filteredList  : function(ignoreCache) {
                if(!ignoreCache && scope.angri.expression == lastExpression)
                  return cache;
                lastExpression  = scope.angri.expression;
                cache           = scope.$eval(scope.angri.expression);
                return cache;
              },
              unfilteredList  : function(ignoreCache) { return scope.$eval(baseExpression); }
            };

            scope.i18n = {
              next: 'Next',
              prev: 'Prev',
              total: 'Total: ',
              filter: 'Field:Item or Item'
            };

            if(scope.angri.debug) {
              element.after($compile(Templates.debug)(scope));
            }
            element.before($compile(Templates.controls)(scope));
            element.after($compile(Templates.footer)(scope));

            scope.$watch('angri.limit', function() {
              var lastPage = Math.ceil(scope.angri.filteredList().length / scope.angri.limit);
              if(scope.angri.page > lastPage)
                scope.angri.page = lastPage;
            });

            scope.$watch('angri.filter', function() {
              var filterExpression = '';
              scope.angri.filterError = false;
              if (scope.angri.filter) {
                var match = angular.lowercase(scope.angri.filter).match(FILTER_REGEX);
                if(match) {
                  var head    = null,
                      row     = match[1].trim().replace(' ', '_'),
                      func    = match[2].trim(),
                      filter  = match[3].trim(),
                      filters = Object.keys(Filters).map(function(filter) {
                        return Filters[filter].sign == func ? Filters[filter].code : false;
                      }).filter(function(func) { return func; });
                  if (filter.length && row in filter_hash) {
                    head = scope.angri.header[filter_hash[row]];
                  }
                  if (filters.length && filter && head) { // we do have a filter, a lookup target and a function to filter by
                      filterExpression = ' | angri_filter_rowFilter:\'' + head.name + '\':\''+filters[0]+'\':\'' + filter + '\'';
                  } else {
                    scope.angri.filterError = true;
                    filterExpression = '';
                  }
                } else {
                  filterExpression = ' | angri_filter_anyRowFilter:\'' + scope.angri.filter + '\'';
                }
              }
              scope.angri.expression = baseExpression + filterExpression;
            });

            scope.sort = function(index) {
              var head = header[index];
              if(!head || !head.name) return;
              // if the grid is already sorted by this head and not in reverse mode:
              scope.angri.reverse = (scope.angri.predicate === head.name) && ! scope.angri.reverse;
              // set sorting to this head
              scope.angri.predicate = head.name;
            };

            scope.prev = function() {
              if(scope.angri.page > 1) {
                scope.page(scope.angri.page - 1);
              }
            };

            scope.next = function() {
              if(scope.angri.page < Math.ceil(scope.angri.filteredList().length / scope.angri.limit)) {
                scope.page(scope.angri.page + 1);
              }
            };

            scope.page = function(index) {
              if(typeof index === 'number')
                scope.angri.page = index;
            };
          }
        };
      }
    };
});
})(window.angular);
