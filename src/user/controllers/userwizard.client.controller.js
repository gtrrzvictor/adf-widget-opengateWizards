'use strict';

var _wizard = angular.module('wizard');

_wizard.controller('UserWizardController', ['$rootScope', '$scope', '$controller', 'toastr', '$api', '$http', 'Authentication', 'WizardHandler', 'userService',
    function($rootScope, $scope, $controller, toastr, $api, $http, Authentication, WizardHandler, userService) {
        // instantiate base controller
        var wizardConfig = { title: 'User creation wizard', close: false, type: 'create' };
        $controller('WizardController', { $scope: $scope });
        $scope.userProfiles = [];
        $scope.user = angular.copy($scope.config.user || {});

        $scope.user.organization = $scope.user.organization || Authentication.user.domain;
        $scope.user.workgroup = $scope.user.workgroup || Authentication.user.workgroup;

        $scope.reset = function() {
            angular.copy($scope.config.user || {}, $scope.user);
            $scope.userProfile = {
                selected: $scope.userProfiles[$scope.userProfiles.indexOf($scope.user.profile)]
            };
        }

        $scope.wizardSteps = {
            'info': {
                title: 'User data',
                description: 'Enter user data',
                disabled: false,
                body: require('../views/collectstep.client.view.html'),
                orden: 1
            }
        };

        $scope.configureWizard(wizardConfig);
        $scope.show_reset = false;

        // Progress bar configure
        $scope.progressLog = {
            title: 'Create user process log...',
            max: 75,
            value: 0,
            type: 'info',
            show: false,
            actions: []
        };

        $scope.clearProgressLog = function() {
            $scope.progressLog.show = false;
            $scope.progressLog.value = 0;
            $scope.progressLog.type = 'info';
            $scope.progressLog.actions.splice(0, $scope.progressLog.actions.length);
        };

        $scope.changeProgressLog = function(_value, _type, _action) {
            $scope.progressLog.show = true;
            $scope.progressLog.value = _value;
            $scope.progressLog.type = _type;
            $scope.progressLog.actions.push(_action);
        };

        userService.userProfiles('admin_domain').then(function(userProfilesData) {
            angular.copy(userProfilesData.data.userProfile[0].managed, $scope.userProfiles);

            if (!$scope.user || !$scope.user.profile) {
                $scope.userProfile = {
                    selected: $scope.userProfiles[0]
                };
                $scope.user.profile = $scope.userProfile.selected;
            } else {
                if ($scope.user && $scope.user.profile) {
                    $scope.userProfile = {
                        selected: $scope.userProfiles[$scope.userProfiles.indexOf($scope.user.profile)]
                    };
                    $scope.user.profile = $scope.userProfile.selected;
                }
            }
        }).catch(function(error) {
            console.error(error);
            $scope.userProfile.selected = 'Loading error';
        });

    }
]);

function Adapter(userRest) {
    var _userRest = userRest;
    var matcher = {
        'name': 'firstName',
        'surname': 'lastName',
        'organization': 'domain',
        'workgroup': 'workgroup',
        'email': 'email',
        'profile': 'profile',
    };
    this.parse = function() {
        var user = {};
        for (var key in matcher) {
            if (!_userRest[matcher[key]]) {
                console.warn('[UserWizard] Fill user edit info. Field not found: ' + matcher[key]);
            }
            user[key] = _userRest[matcher[key]];
        }
        return user;
    };
}