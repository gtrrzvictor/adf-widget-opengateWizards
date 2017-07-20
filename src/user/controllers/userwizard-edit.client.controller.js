'use strict';

var _wizard = angular.module('wizard');

_wizard.controller('UserWizardEditController', ['$rootScope', '$scope', '$controller', 'toastr', '$api', '$http', 'Authentication', 'WizardHandler', 'userService',
    function($rootScope, $scope, $controller, toastr, $api, $http, Authentication, WizardHandler, userService) {
        // instantiate base controller
        $controller('UserWizardController', { $rootScope, $scope, $controller, toastr, $api, $http, Authentication, WizardHandler, userService });
        $scope.$watch('user', function(newVal, oldVal) {
            $scope.config.user = newVal;
        }, true);
        $scope.isEditMode = function() { return true; }
    }
]);