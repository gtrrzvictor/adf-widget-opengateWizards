'use strict';

var _wizard = angular.module('wizard');

_wizard.controller('WizardController', ['$rootScope', '$scope', 'catalogs', 'toastr', 'WizardHandler',
    function($rootScope, $scope, catalogs, toastr, WizardHandler) {
        $scope.$resolve = {};
        //darle valor a estas variables a traves de funciones propias de este controlador
        $scope.wizard = {
            title: 'Wizard',
            disable: false,
            close: false,
            hide: false
        };

        $scope.show_reset = true;
        $scope.show_cancel = true;
        $scope.show_previous = false;
        $scope.show_next = true;
        $scope.show_execute = false;
        $scope.show_update = false;


        $scope.cancel = function() {
            //$uibModalInstance.dismiss('cancel');
        };

        $scope.confirm = function() {
            //$uibModalInstance.close({});
        };

        $scope.isInvalid = function() {
            return false;
        };

        $scope.finishedWizard = function() {
            WizardHandler.wizard().currentStep().completed = true;
            return $scope.wizard.close;
        };

        $scope.currentStep = function() {
            return WizardHandler.wizard().currentStepTitle();
        };

        $scope.exitValidation = function() {
            return !$scope.wizard.disable;
        };

        $scope.enterValidation = function() {
            return !$scope.wizard.disable;
        };

        $scope.configureWizard = function(_config) {
            $scope.wizard = angular.copy(_config);
            if (_config.type === "configure") {
                $scope.edit_mode = true;
            }
        };

        $scope.disableWizard = function(_value) {
            $scope.wizard.disable = _value;
        };

        $scope.completeWizard = function() {
            $scope.wizard.disable = false;
            $scope.wizard.hide = $scope.wizard.close = true;
        };

        $scope.isCloseWizard = function() {
            return !!$scope.wizard.close;
        };

        $scope.isDisableWizard = function() {
            return !!$scope.wizard.disable;
        };

        $scope.isEditMode = function() {
            return false;
        };
    }
]);