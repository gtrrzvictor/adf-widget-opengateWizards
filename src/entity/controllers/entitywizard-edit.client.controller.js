'use strict';

var _wizard = angular.module('wizard');

_wizard.controller('EntityWizardEditController', ['$rootScope', '$scope', 'catalogs', 'WizardHandler', '$controller', 'entityService', 'toastr', '$api',
    function($rootScope, $scope, catalogs, WizardHandler, $controller, entityService, toastr, $api) {
        $controller('EntityWizardController', { $rootScope, $scope, catalogs, WizardHandler, $controller, entityService, toastr, $api });
        $scope.$watch('entity', function(newVal, oldVal) {
            $scope.config.entity = newVal;
        }, true);
        $scope.isEditMode = function() { return true; }
    }
]);