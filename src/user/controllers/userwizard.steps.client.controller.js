'use strict';

var _wizard = angular.module('wizard');

_wizard.controller('UserStepCollectController', ['$scope', 'userService', 'Authentication', '$timeout',
    function($scope, userService, Authentication, $timeout) {
        $scope.execute = function() {
            $scope.clearProgressLog();
            $scope.disableWizard(true);
            $scope.changeProgressLog(25, 'info', { msg: 'Validating data...', type: 'info' });
            userService.validateUser($scope.user).then(
                function(response) {
                    $scope.changeProgressLog(50, 'info', { msg: 'Creating user ...', type: 'info' });
                    userService.createUser(response).then(
                        function(response) {
                            $scope.result = response.data;
                            $scope.changeProgressLog(75, 'info', { msg: 'User created.', type: 'success' });
                            $scope.completeWizard();
                            $scope.$apply();
                        },
                        function(response) {
                            var error = response.error || response.data || response.statusCode || response || '';
                            $scope.changeProgressLog(75, 'error', { msg: 'Error: ' + JSON.stringify(error), type: 'error' });
                            $scope.disableWizard(false);
                            $scope.$apply();
                        }
                    );
                },
                function(response) {
                    var error = response.error || response.data || response.statusCode || response || '';
                    $scope.changeProgressLog(75, 'error', { msg: 'Error: ' + JSON.stringify(error), type: 'error' });
                    $scope.disableWizard(false);
                    $scope.$apply();
                }
            );
        };

        $scope.update = function() {
            $scope.clearProgressLog();
            $scope.disableWizard(true);
            $scope.changeProgressLog(55, 'info', { msg: 'Validating data...', type: 'info' });
            try {
                userService.updateUser($scope.user).then(
                    function(response) {
                        $scope.result = response.data;
                        $scope.changeProgressLog(75, 'info', { msg: 'User updated.', type: 'success' });
                        $scope.completeWizard();
                        $scope.$apply();
                    },
                    function(response) {
                        var error = response.error || response.data || response.statusCode || response || '';
                        $scope.changeProgressLog(75, 'error', { msg: 'Error: ' + JSON.stringify(error), type: 'error' });
                        $scope.disableWizard(false);
                        $scope.$apply();
                    }
                );
            } catch (error) {
                $scope.changeProgressLog(75, 'error', { msg: 'Error: ' + error.message, type: 'error' });
                $scope.disableWizard(false);
            }
        };

        $scope.selectProfile = function(profileData) {
            if (!profileData) {
                $scope.user.profile = undefined;
            } else {
                $scope.user.profile = profileData;
            }
        };
    }
]);