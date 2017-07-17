'use strict';

angular.module('adf.widget.opengateWizards', ['adf.provider'])
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('opengateWizards', {
        title: 'Opengate wizard collection',
        description: 'This widget will register a collection of wizards which it will be used by any registered user',
        templateUrl: '{widgetsPath}/opengateWizards/src/view.html',
        edit: {
          templateUrl: '{widgetsPath}/opengateWizards/src/edit.html'
        }
      });
  });
