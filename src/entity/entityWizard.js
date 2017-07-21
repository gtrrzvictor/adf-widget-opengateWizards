'use strict';

angular.module('adf.widget.opengateWizards')
    .config(function(dashboardProvider) {
        dashboardProvider
            .widget('entityWizard', {
                title: 'Entity wizard',
                description: 'This widget will register a collection of wizards which it will be used by any registered user',
                template: require("./views/entitywizard.client.view.html"),
                controller: 'EntityWizardController',
                category: 'Wizards',
                edit: {
                    template: require("./views/entitywizard.client.view.html"),
                    controller: 'EntityWizardEditController'
                }
            });
    }).run(function($doActions, $q, $api, jsonPath) {
        $doActions.listener('entityWizard', function(device) {
            return (new ParserConfig(device)).parse();
        });

        function ParserConfig(_data) {
            var deviceData = _data;
            var config = {
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
            }
            this.parse = function() {
                var promises = [];
                // STEP ADMIN
                config.admin = {
                    id: deviceData.id,
                    defaultFeed: deviceData.provision.defaultFeed
                };
                config.organization = { selected: { name: deviceData.provision.admin.organization } };
                config.channel = { selected: { name: deviceData.provision.admin.channel } };

                if (deviceData.provision.operationalStatus && deviceData.provision.operationalStatus.length > 0) {
                    config.operationalStatus = { selected: deviceData.provision.operationalStatus[0] };
                } else {
                    config.operationalStatus.selected = '';
                }

                if (deviceData.provision.admin.administrativeState) {
                    config.administrativeState = { selected: { id: deviceData.provision.admin.administrativeState } };
                } else {
                    config.administrativeState.selected = '';
                }
                // -------------------------
                // STEP INVENTORY
                if (deviceData.provision.name && deviceData.provision.name.length > 0) {
                    config.inventory.name = deviceData.provision.name[0];
                }

                if (deviceData.provision.description && deviceData.provision.description.length > 0) {
                    config.inventory.description = deviceData.provision.description[0];
                }

                if (deviceData.provision.serialNumber && deviceData.provision.serialNumber.length > 0) {
                    config.inventory.serialNumber = deviceData.provision.serialNumber[0];
                }
                // -------------------------
                // STEP LOCATION
                if (deviceData.provision.location && deviceData.provision.location.length > 0) {
                    if (deviceData.provision.location[0].coordinates) {
                        if (deviceData.provision.location[0].coordinates.latitude) {
                            config.location.latitude = deviceData.provision.location[0].coordinates.latitude;
                        }
                        if (deviceData.provision.location[0].coordinates.longitude) {
                            config.location.longitude = deviceData.provision.location[0].coordinates.longitude;
                        }

                        if (config.location.latitude && config.location.longitude) {
                            config.location.map = {
                                markers: {
                                    marker: {
                                        lat: config.location.latitude,
                                        lng: config.location.longitude,
                                        draggable: true,
                                        focus: true,
                                        message: 'Drag me to move. Click me to remove'
                                    }
                                }
                            };
                        }
                        if (deviceData.provision.location[0].postal) {
                            config.location.postal = deviceData.provision.location[0].postal;
                        }
                    }
                }

                // -------------------------
                // STEP SECURITY
                if (deviceData.provision && deviceData.provision.certificates && deviceData.provision.certificates.length > 0) {
                    promises.push($api().certificatesSearchBuilder().assignable().filter({ and: [{ in: { certificateId: deviceData.provision.certificates } }] })
                        .build().execute().then(function(response) {
                            if (response.statusCode === 200) {
                                config.certificate.selected = response.data.certificates;
                            }
                            return config;
                        }));
                }
                // -------------------------
                // STEP RELATED
                if (deviceData.provision.$related && deviceData.provision.$related.communicationsModules) {
                    promises.push(deviceData.provision.$related.communicationsModules()
                        .then(function(response) {
                            if (response.statusCode === 200) {
                                var commsData = response.data.communicationsModules;
                                angular.forEach(commsData, function(curComm) {
                                    var specificType = jsonPath(curComm, 'provision.specificType[0]');
                                    if (specificType && specificType.length > 0) {
                                        specificType = specificType[0];
                                    } else {
                                        specificType = 'GENERIC';
                                    }

                                    if (curComm.provision.relations && curComm.provision.relations.length > 0) {
                                        angular.forEach(curComm.provision.relations, function(curRelation) {
                                            var finalData = {};

                                            finalData[specificType] = {
                                                'COMMUNICATIONS_MODULE': [{
                                                    parameter: 'entityKey',
                                                    value: curComm.id
                                                }]
                                            };

                                            angular.forEach(curRelation.relation, function(curRelationData) {
                                                if (curRelationData.entityType !== 'DEVICE') {
                                                    finalData[specificType][curRelationData.entityType] = [{
                                                        parameter: 'entityKey',
                                                        value: curRelationData.id
                                                    }];
                                                }
                                            });

                                            config.communicationsInterfaces.push(finalData);
                                        });
                                    } else {
                                        var commData = {};
                                        commData[specificType] = {
                                            'COMMUNICATIONS_MODULE': [{
                                                parameter: 'entityKey',
                                                value: curComm.id
                                            }]
                                        };
                                        config.communicationsInterfaces.push(commData);
                                    }
                                });
                            }
                            return config;
                        }));
                }

                if (promises.length === 0)
                    return { entity: config };

                return $q.all(promises)
                    .then(function(config) {
                        return { entity: config[0] };
                    });
            }
        }
    });

require('./service/entitywizard.service');

require('./views/step.entity.client.view.html');
require('./views/step.location.client.view.html');
require('./views/step.security.client.view.html');
require('./views/step.admin.client.view.html');
require('./views/step.inventory.client.view.html');
require('./views/step.relation.client.view.html');

require('../basewizard.client.controller');
require('./controllers/entitywizard.client.controller');
require('./controllers/entitywizard.steps.client.controller');
require('./controllers/entitywizard-edit.client.controller');