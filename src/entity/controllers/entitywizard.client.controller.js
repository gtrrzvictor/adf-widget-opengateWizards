'use strict';

var _wizard = angular.module('wizard');

_wizard.controller('EntityWizardController', ['$rootScope', '$scope', 'catalogs', 'WizardHandler', '$controller', 'entityService', 'toastr', '$api',
    function($rootScope, $scope, catalogs, WizardHandler, $controller, entityService, toastr, $api) {

        var _this = this;
        var hardwareSearchBuilder = $api().hardwaresSearchBuilder();
        var softwareSearchBuilder = $api().softwaresSearchBuilder();

        var baseConfig = {
            admin: {},
            organization: {},
            channel: {},
            administrativeState: {},
            operationalStatus: {},
            inventory: {},
            location: {},
            commsModuleType: {},
            security: {},
            certificate: {},
            communicationsInterfaces: []
        };

        $controller('WizardController', { $scope: $scope });
        $scope.entity = {};
        $scope.step = {
            'entity': {
                title: 'entity',
                name: 'Select device type',
                description: 'Here, you can define the device\'s type',
                body: 'src/entity/views/step.entity.client.view.html'
            },
            'admin': {
                title: 'admin',
                name: 'Management data',
                description: 'This step contains the essential data for the registration and identification of the device in the platform.',
                body: 'src/entity/views/step.admin.client.view.html'
            },
            'inventory': {
                title: 'inventory',
                name: 'Inventory information',
                description: 'Here you can define inventory information',
                body: 'src/entity/views/step.inventory.client.view.html'
            },
            'location': {
                title: 'location',
                name: 'Location Information',
                description: 'Here, you can provision the location of the device.',
                body: 'src/entity/views/step.location.client.view.html'
            },
            'security': {
                title: 'security',
                name: 'Safety information',
                description: 'Here, you can create a device with a trusted boot field and associated it to a certificate',
                body: 'src/entity/views/step.security.client.view.html'
            },
            'relation': {
                title: 'interfaces',
                name: 'Communications interface',
                description: 'Here, you can create many differents communications interface type',
                body: 'src/entity/views/step.relation.client.view.html'
            }
        };
        /*
                entityService.resetEntityBuilder();
                if ($scope.isEditMode()) {
                    var deviceData = $scope.$resolve.updateData;
                    if (typeof deviceData.id === 'string') {
                        $scope.configureWizard({ title: 'Device Wizard', disable: false, editMode: true });
                        $scope.show_update = true;
                        $scope.step.entity.disabled = true;
                        entityService.entity.type = deviceData.provision.type;
                        entityService.updateEntity({
                            'EntityKey': deviceData.id,
                            'Organization': deviceData.provision.admin.organization,
                            'Channel': deviceData.provision.admin.channel,
                            'DefaultFeed': deviceData.provision.defaultFeed
                        });
                    } else {
                        entityService.updateEntity({
                            'Organization': deviceData.provision.admin.organization,
                            'Channel': deviceData.provision.admin.channel
                        });
                    }

                    if (deviceData.provision.specificType && deviceData.provision.specificType.length > 0) {
                        entityService.updateEntity({
                            'SpecificType': deviceData.provision.specificType[0]
                        });
                    }
                } else {

                }*/
        $scope.show_update = false;
        $scope.show_reset = false;

        $scope.softwareCollection = [];
        $scope.hardwareCollection = [];


        $scope.progressLog = {
            title: 'Entity process log...',
            max: 75,
            value: 0,
            type: 'info',
            show: false,
            actions: []
        };

        $scope.combo_hardware_config = {
            builder: hardwareSearchBuilder,
            filter: function(search) {
                return {
                    'or': [
                        { 'like': { 'modelName': search } },
                        { 'like': { 'modelVersion': search } },
                        { 'like': { 'manufacturerName': search } }
                    ]
                };
            },
            //rootKey: 'manufacturer',
            collection: $scope.hardwareCollection,
            processingData: function(data, collection) {
                if (typeof data.data.hardware !== 'undefined') {
                    angular.copy(data.data.hardware, collection);
                } else if (typeof data.data.manufacturer !== 'undefined') {
                    data.data.manufacturer.forEach(function(manuf) {
                        var manuf_name = manuf.name;
                        if (manuf.models) {
                            manuf.models.forEach(function(model) {
                                var model_name = model.name;
                                var id = model.id;
                                var model_version = model.version;
                                collection.push({
                                    id: id,
                                    model: {
                                        name: model_name,
                                        version: model_version
                                    },
                                    manufacturer: {
                                        name: manuf_name
                                    }
                                });
                            });
                        }
                    });
                } else {
                    throw new Error('OGAPI->API-WS: Incompatible hardware catalog searching.');
                }
            },
            customSelectors: hardwareSearchBuilder
        };

        $scope.combo_software_config = {
            builder: softwareSearchBuilder,
            prefilter: null,
            filter: function(search) {
                return {
                    'or': [
                        { 'like': { 'softwareName': search } },
                        { 'like': { 'softwareVersion': search } },
                        { 'like': { 'softwareId': search } },
                        { 'like': { 'softwareType': search } }
                    ]
                };
            },
            rootKey: 'softwares',
            collection: $scope.softwareCollection,
            customSelectors: softwareSearchBuilder
        };

        $scope.configureWizard({ title: 'Device Wizard', disable: false });

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

        $scope.reset = function() {
            angular.copy($scope.config.entity || {
                admin: {},
                organization: {},
                channel: {},
                administrativeState: {},
                operationalStatus: {},
                inventory: {},
                location: {},
                commsModuleType: {},
                security: {},
                certificate: {},
                communicationsInterfaces: []
            }, $scope.entity);
        }

        $scope.executeCreate = function() {
            $scope.clearProgressLog();
            $scope.disableWizard(true);
            $scope.changeProgressLog(25, 'info', { msg: 'Validating...', type: 'info' });

            if (validateAndBuild()) {
                $scope.changeProgressLog(50, 'info', { msg: 'Sending...', type: 'info' });
                try {
                    entityService.execute();
                    return true;
                } catch (err) {
                    _this.error = err;
                    console.log('Error validating step ' + $scope.currentStep() + ' - ' + _this.error);
                }
            }
            $scope.changeProgressLog(75, 'warning', { msg: _this.error.message, type: 'warning' });
            $scope.disableWizard(false);
            return false;
        };

        $scope.executeUpdate = function() {
            //$scope.clearProgressLog();
            $scope.disableWizard(true);
            //$scope.changeProgressLog(25, 'info', { msg: 'Validating...', type: 'info' });

            if (validateAndBuild()) {
                //$scope.changeProgressLog(50, 'info', { msg: 'Sending...', type: 'info' });
                try {
                    entityService.update();
                    return true;
                } catch (err) {
                    _this.error = err;
                    console.log('Error validating step ' + $scope.currentStep() + ' - ' + _this.error);
                }
            }
            //$scope.changeProgressLog(75, 'warning', { msg: _this.error.message, type: 'warning' });
            toastr.warning(_this.error.message);
            $scope.disableWizard(false);
            return false;
        };

        $scope.executeRelation = function(_relation, _then) {
            //$scope.clearProgressLog();
            $scope.disableWizard(true);
            //$scope.changeProgressLog(50, 'info', { msg: 'Sending...', type: 'info' });
            if (validateAndBuild()) {
                entityService.addRelation(_relation, function(ok) {
                    //$scope.clearProgressLog();
                    $scope.disableWizard(false);
                    toastr.success('Relation added successfully!!!');
                    _then();
                    $scope.$apply();
                }, function(errors) {
                    //$scope.changeProgressLog(75, 'warning', { msg: errors, type: 'warning' });
                    toastr.warning(errors);
                    $scope.disableWizard(false);
                    $scope.$apply();
                });
            } else {
                //$scope.changeProgressLog(75, 'warning', { msg: "Error validating entity data", type: 'warning' });
                toastr.warning('Error validating entity data');
                $scope.disableWizard(false);
                $scope.$apply();
            }
        };

        $scope.removeRelation = function(_relation, _then) {
            $scope.clearProgressLog();
            $scope.disableWizard(true);
            //$scope.changeProgressLog(50, 'info', { msg: 'Sending...', type: 'info' });
            if (validateAndBuild()) {
                entityService.removeRelation(_relation, function(ok) {
                    $scope.clearProgressLog();
                    $scope.disableWizard(false);
                    toastr.success('Relation deleted successfully!!!');
                    if (_then) _then();
                    $scope.$apply();
                }, function(errors) {
                    //$scope.changeProgressLog(75, 'warning', { msg: errors, type: 'warning' });
                    toastr.warning(errors);
                    $scope.disableWizard(false);
                    $scope.$apply();
                });
            } else {
                //$scope.changeProgressLog(75, 'warning', { msg: "Error validating entity data", type: 'warning' });
                toastr.warning('Error validating entity data');
                $scope.disableWizard(false);
                $scope.$apply();
            }
        };

        $scope.filterForHardware = function($item) {
            $scope.combo_software_config.prefilter = { eq: { manufacturerName: $item.manufacturer.name } };
        };

        $scope.removeFilterForHardware = function() {
            $scope.combo_software_config.prefilter = null;
        };

        $scope.$on('entityManagementFinished', function(event, response) {
            if (response.isOk) {
                var deviceData = $scope.$resolve.updateData || {};
                if ($scope.isEditMode() && deviceData.id) {
                    $scope.clearProgressLog();
                    $scope.disableWizard(false);
                    toastr.success('Entity updated successfully!!!');
                } else {
                    $scope.changeProgressLog(75, 'success', { msg: 'Finish!', type: 'success' });
                    $scope.completeWizard();
                }
                $scope.$apply();
            } else {
                $scope.changeProgressLog(75, 'warning', { msg: 'Error on operation: ' + response.data, type: 'warning' });
                $scope.disableWizard(false);
                $scope.$apply();
            }
        });



        load();

        function validateAndBuild() {
            try {
                entityService.createAndValidateBuilder();
                return true;
            } catch (err) {
                _this.error = err;
                console.log('Error validating step ' + $scope.currentStep() + ' - ' + _this.error);
                return false;
            }
        }

        function reset() {
            angular.copy($scope.config.entity || baseConfig, $scope.entity);
        }

        function load() {
            angular.merge($scope.entity, baseConfig, $scope.config.entity);
        }

    }
]);