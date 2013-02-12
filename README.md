# angri - Grid Directive for AngularJS

angri is modular grid directive for AngularJS, based on the components of Twitter Bootstrap. It is filterable, pagable,
sizeable and sortable. The following lines will describe the features in detail.

### Usage
Using angri is as easy as possible. Just add the following markup to your page, providing the list of data through your 
controller. The only tag you need is ``ng-grid`` in your table directive. 

    <table class="table table-bordered table-striped" ng-grid>    	
      <legend>Network List</legend>
        <tr ng-repeat="todo in todos">
     	  <td title="Name" name="name">{{todo.name}}</td>
	      <td title="Estimate" name="estimate">{{todo.estimate}}</td>
          <td title="Created At" name="created at">{{todo.created_at}}</td>
      	  <td title="Updated At" name="upated at">{{todo.updated_at}}</td>
        </tr>		  
    </table>

#### Customize table headers and sorting
As you can see in the markup, the ``<td></td>`` contains two elements. The first is ``title="titleName"``, which allows
you to specify the contents of the ``<th></th>`` tag of a specific column. The second is
``name="sortName"``, enabling the sorting feature for a column. We split that up, as it might often be the case that
the actual title will differ significantly from the property name in your JSON array. In the ``name="sortName"`` you
are allowed to have whitespace, as they will be replaced automatically by an underscore for parsing.

#### Filter in your ng-repeat
You may apply any filter you like to your ``ng-repeat`` directive you like. It will be automatically wired through
into angri and applied to your list.

### Pagesize
angri provides a dropdown, which enables you to choose the number of items displayed in the table. The default list
settings are: 10, 15, 30 and 60. If you would like to change the number of items displayed, you may change the line 
24ff in the source. In a future release, we will support a way to modify the items list. 

If you like to contribute a patch or enhancement, feel free!

### Filter

### Pagination

### Sortable

## License
 
Copyright 2012 Johannes Hiemer, Tobias Kopelke

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
  
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
