'use strict';

var _wizard = angular.module('wizard');


_wizard.controller('StepDeviceEntityController', ['$scope', 'WizardHandler', 'entityService', '$api', 'humanizeFilter',
    function($scope, WizardHandler, entityService, $api, humanizeFilter) {
        var context = {
            ASSETS: { list: [] },
            GATEWAYS: { list: [] }
        };

        if (!$scope.entity.entities)
            $scope.entity.entities = {
                name: 'entities',
                model: 'GATEWAY',
                options: {
                    'GATEWAY': {
                        title: 'M2M device',
                        elements: [{
                            element: 'select_simple',
                            id: 'gatewaySpecificType',
                            placeholder: 'Choose a specific type (optional)',
                            value: 'Loading...',
                            list: context.GATEWAYS.list
                        }]
                    },
                    'ASSET': {
                        title: 'Machine or sensor',
                        elements: [{
                            element: 'select_simple',
                            id: 'assetSpecificType',
                            placeholder: 'Choose a specific type (optional)',
                            value: 'Loading...',
                            list: context.ASSETS.list
                        }]
                    }
                }
            };


        function setSpecificTypeSearchBuilder(collection, selected, entity) {
            $api().specificTypeSearchBuilder().withEntityType(entity).build().execute().then(
                function(data) {
                    if (data.statusCode === 200) {
                        var specificType = data.data.specificType;
                        angular.forEach(specificType, function(_specificType, key) {
                            var specificTypeH = humanizeFilter(_specificType.id);
                            collection.list.push(specificTypeH);
                            collection[specificTypeH] = _specificType.id;
                        });
                        return;
                    }
                    selected.value = 'Loading error';
                }
            );
        }

        setSpecificTypeSearchBuilder(context.ASSETS, $scope.entity.entities.options.ASSET.elements[0], 'ASSET');
        setSpecificTypeSearchBuilder(context.GATEWAYS, $scope.entity.entities.options.GATEWAY.elements[0], 'GATEWAY');

        $scope.next = function() {
            var entityType = $scope.entity.entities.model;
            var specificType = $scope.entity.entities.options[entityType].elements[0].value;
            entityService.entity.type = entityType;
            $scope.step.entity.disabled = true;
            entityService.updateEntity({ 'SpecificType': context[entityType + 'S'][specificType] });
        };

    }
]);

_wizard.controller('StepDeviceAdminController', ['$scope', 'WizardHandler', 'entityService', '$api', 'Authentication',
    function($scope, WizardHandler, entityService, $api, Authentication) {
        var entity = entityService.entity.type;
        var error = null;

        $scope.optStatusCollection = [];
        $scope.administrativeStateCollection = [];
        $scope.organizations = [];
        $scope.channels = [];

        $scope.show_execute = true;
        $scope.show_update = false;
        $scope.show_operational_status = (entity === 'GATEWAY' || entity === 'ASSET');

        if (!$scope.entity.operationalStatus)
            $scope.entity.operationalStatus = { selected: 'Loading...' };
        if (!$scope.entity.administrativeState)
            $scope.entity.administrativeState = { selected: 'Loading...' };
        if (!$scope.entity.organization)
            $scope.entity.organization = { selected: { name: 'Loading...' } };
        if (!$scope.entity.channel)
            $scope.entity.channel = { selected: null };


        $scope.changeChannels = function(item) {
            $scope.channels.length = 0;
            $scope.entity.channel.selected = null;
            if (!item) {
                return;
            }
            $api().newChannelFinder().findByDomainAndWorkgroupAndOrganization(Authentication.user.domain, Authentication.user.workgroup, item.name)
                .then(function(response) {
                    $scope.entity.channel.selected = null;
                    var channels = response.data;
                    angular.copy(channels, $scope.channels);
                    $scope.$apply();
                })
                .catch(function(error) {
                    console.error(error);
                    $scope.entity.channel.selected = { name: 'Loading error' };
                    $scope.$apply();
                });
        };

        $scope.removeChannels = function() {
            $scope.entity.channel.selected = null;
            $scope.channels.length = 0;
        };

        $scope.execute = function() {
            build();
            return $scope.executeCreate();
        };

        $scope.update = function() {
            build();
            return $scope.executeUpdate();
        };

        $scope.next = function() {
            build();
            return true;
        };

        $scope.exitValidation = function() {
            if ($scope.isEditMode()) {
                build();
            }
            return true;
        };

        $api().operationalStatusSearchBuilder().withEntityType(entity).build().execute().then(
            function(data) {
                if (data.statusCode === 200) {
                    var optStatus = data.data.operationalStatus;
                    angular.forEach(optStatus, function(_optStatus, key) {
                        $scope.optStatusCollection.push(_optStatus.id);
                    });
                } else {
                    $scope.entity.operationalStatus.selected = 'Loading error';
                }
                $scope.$apply();
            }
        );

        $api().administrativeStateSearchBuilder().withEntityType(entity).build().execute().then(
            function(data) {
                if (data.statusCode === 200) {
                    var admState = data.data.administrativeState;
                    angular.forEach(admState, function(_admState, key) {
                        $scope.administrativeStateCollection.push(_admState);
                    });
                } else {
                    $scope.entity.administrativeState.selected = 'Loading error';
                }
                $scope.$apply();
            }
        );

        $api().newOrganizationFinder().findByDomainAndWorkgroup(Authentication.user.domain, Authentication.user.workgroup)
            .then(function(response) {
                var organizations = response.data;
                $scope.organizations = angular.copy(organizations);
                $scope.$apply();
            })
            .catch(function(error) {
                console.error(error);
                $scope.entity.organization.selected = { name: 'Loading error' };
                $scope.$apply();
            });

        function build() {
            var admin = $scope.entity.admin;
            if ($scope.isEditMode()) {
                entityService.updateEntity({
                    'AdministrativeState': $scope.entity.administrativeState.selected ? $scope.entity.administrativeState.selected.id : undefined,
                    'OperationalStatus': $scope.entity.operationalStatus.selected,
                    'DefaultFeed': admin.defaultFeed
                });
            } else {
                entityService.updateEntity({
                    'EntityKey': admin.id,
                    'Organization': $scope.entity.organization.selected.name,
                    'Channel': $scope.entity.channel.selected.name,
                    'AdministrativeState': $scope.entity.administrativeState.selected ? $scope.entity.administrativeState.selected.id : undefined,
                    'OperationalStatus': $scope.entity.operationalStatus.selected,
                    'DefaultFeed': admin.defaultFeed
                });
            }
        }
    }
]);

_wizard.controller('StepDeviceInventoryController', ['$scope', 'WizardHandler', 'entityService', '$api',
    function($scope, WizardHandler, entityService, $api) {

        var entity = entityService.entity.type;
        var error = null;

        $scope.show_previous = true;
        $scope.show_execute = true;
        $scope.show_serial_number = $scope.show_software = $scope.show_hardware = (entity === 'GATEWAY' || entity === 'ASSET');

        function build() {
            var inventory = $scope.entity.inventory;
            entityService.updateEntity({
                'Name': inventory.name,
                'Description': inventory.description,
                'SerialNumber': inventory.serialNumber
            });
        }

        $scope.execute = function() {
            build();
            return $scope.executeCreate();
        };

        $scope.update = function() {
            build();
            return $scope.executeUpdate();
        };

        $scope.next = function() {
            build();
            return true;
        };

        $scope.exitValidation = function() {
            build();
            return true;
        };
    }
]);

_wizard.controller('StepDeviceLocationController', ['$scope', 'entityService', 'leafletData', function($scope, entityService, leafletData) {

    $scope.show_previous = true;
    $scope.show_execute = true;
    $scope.mapViewEnabled = false;

    var locationEvents = [];
    var error = null;

    if (!$scope.entity.location || Object.keys($scope.entity.location).length === 0) {
        $scope.entity.location = angular.copy({
            latitude: null,
            longitude: null,
            postal: null,
            map: {
                center: {
                    lat: 40.095,
                    lng: -3.823,
                    zoom: 4
                },
                markers: {},
                events: {
                    markers: {
                        enable: ['dragend', 'click'],
                        logic: 'emit'
                    },
                    map: {
                        enable: ['click'],
                        logic: 'emit'
                    }
                }
            }
        });
    }

    locationEvents.push($scope.$on('leafletDirectiveMarker.map-marker.click', function(event, args) {
        $scope.entity.location.map.markers = {};
        $scope.entity.location.latitude = undefined;
        $scope.entity.location.longitude = undefined;
    }));

    locationEvents.push($scope.$on('leafletDirectiveMap.map-marker.click', function(event, args) {
        var latlng = args.leafletEvent.latlng;
        $scope.entity.location.map.markers = {
            marker: {
                lat: latlng.lat,
                lng: latlng.lng,
                draggable: true,
                focus: true,
                message: 'Drag me to move. Click me to remove'
            }
        };
        $scope.entity.location.latitude = latlng.lat;
        $scope.entity.location.longitude = latlng.lng;
    }));

    locationEvents.push($scope.$on('leafletDirectiveMarker.map-marker.dragend', function(event, args) {
        var point = args.leafletEvent.target._leaflet_events.dragend[0].context._latlng;
        $scope.entity.location.latitude = point.lat;
        $scope.entity.location.longitude = point.lng;
    }));

    $scope.$on('destroy', function() {
        for (var eventToDestroy in locationEvents) {
            eventToDestroy();
        }
    });

    $scope.locationChanged = function() {
        if ($scope.entity.location.map) {
            if ($scope.entity.location.latitude && $scope.entity.location.longitude) {
                $scope.entity.location.map.markers = {
                    marker: {
                        lat: $scope.entity.location.latitude,
                        lng: $scope.entity.location.longitude,
                        draggable: true,
                        focus: true,
                        message: 'Drag me to move. Click me to remove'
                    }
                };

                $scope.entity.location.map.center.lat = $scope.entity.location.latitude;
                $scope.entity.location.map.center.lng = $scope.entity.location.longitude;
            }
        }
    };

    function build() {
        var _date = new Date();
        var time = window.moment(_date).format('HH:mm:ssZ');
        var date = window.moment(_date).format('YYYY-MM-DD');

        entityService.updateEntity({
            'Location': ($scope.entity.location.longitude && $scope.entity.location.latitude) ? [parseFloat($scope.entity.location.longitude).toFixed(5) * 1, parseFloat($scope.entity.location.latitude).toFixed(5) * 1, date + 'T' + time] : null,
            'PostalCode': $scope.entity.location.postal
        });
    }

    $scope.execute = function() {
        build();
        return $scope.executeCreate();
    };

    $scope.update = function() {
        build();
        return $scope.executeUpdate();
    };

    $scope.next = function() {
        build();
        return true;
    };

    $scope.exitValidation = function() {

        var deviceData = $scope.$resolve.updateData || {};
        if ($scope.isEditMode() && deviceData.id) {
            build();
        }

        $scope.mapViewEnabled = false;

        return true;
    };

    $scope.enterValidation = function() {
        return true;
    };

}]);

_wizard.controller('StepDeviceSecurityController', ['$scope', 'WizardHandler', '$api', 'entityService', 'toastr', function($scope, WizardHandler, $api, entityService, toastr) {
    var error = null;

    $scope.show_previous = true;
    $scope.show_execute = true;
    $scope.certificateCollection = [];

    if (!$scope.entity.certificate)
        $scope.entity.certificate = { selected: null };

    var builder = $api().certificatesSearchBuilder().assignable();
    $scope.config_select_certificate = {
        builder: builder,
        filter: function(search) {
            return {
                'or': [
                    { 'like': { 'certificateName': search } },
                    { 'like': { 'certificateVersion': search } },
                    { 'like': { 'certificateId': search } },
                    { 'like': { 'certificateAdministrativeState': search } },
                    { 'like': { 'certificateSerialNumber': search } },
                    { 'like': { 'certificateValidFrom': search } }
                ]
            };
        },
        rootKey: 'certificates',
        collection: $scope.certificateCollection
    };

    $scope.config_mass_autocomplete_certificate = {
        customSelectors: builder
    };


    function build() {
        var security = $scope.entity.security;
        var certificateIds = [];
        angular.forEach($scope.entity.certificate.selected, function(cert) {
            certificateIds.push(cert.id);
        });
        entityService.updateEntity({
            'TrustedBoot': security.trustedBoot,
            'Certificate': $scope.entity.certificate.selected ? certificateIds : null
        });
    }

    $scope.execute = function() {
        build();
        return $scope.executeCreate();
    };

    $scope.update = function() {
        build();
        return $scope.executeUpdate();
    };

    $scope.next = function() {
        build();
        return true;
    };
    $scope.exitValidation = function() {

        var deviceData = $scope.$resolve.updateData || {};
        if ($scope.isEditMode() && deviceData.id) {
            build();
        }
        return true;
    };


}]);


_wizard.controller('StepDeviceCommunicationsModuleController', ['$scope', 'WizardHandler', '$api', 'entityService', '$uibModalInstance', 'communicationsInterfaceFilter', '$wizardScope',

    function($scope, WizardHandler, $api, entityService, $uibModalInstance, communicationsInterfaceFilter, $wizardScope) {

        $scope.wizardScope = $wizardScope;
        $scope.communicationsInterface = {};

        $scope.commsModuleType = { selected: { name: 'Loading...' } };
        $scope.commsModuleTypeCollection = {};
        entityService.loadCollection($api().communicationsModuleTypeSearchBuilder(), $scope.commsModuleType, $scope.commsModuleTypeCollection, 'communicationsModuleType');

        $scope.registerOperatorCollection = [];
        $scope.hardwareCollection = [];
        $scope.softwareCollection = [];

        entityService.loadCollection($api().mobilePhoneProviderSearchBuilder(), {}, $scope.registerOperatorCollection, 'mobilePhoneProvider');

        $scope.administrativeStateCollection = [];

        $api().administrativeStateSearchBuilder().withEntityType('COMMUNICATIONS_MODULE').build().execute().then(
            function(data) {
                if (data.statusCode === 200) {
                    var admState = data.data.administrativeState;
                    angular.forEach(admState, function(_admState, key) {
                        $scope.administrativeStateCollection.push(_admState.id);
                    });
                }
                $scope.$apply();
            }
        );

        $scope.removeCommsModuleType = function() {
            $scope.communicationsInterface = {};
        };

        $scope.add = function() {
            var _comms_interface = {};
            _comms_interface[$scope.commsModuleType.selected.key] = $scope.communicationsInterface;
            var deviceData = $wizardScope.$resolve.updateData || {};
            if (!$wizardScope.isEditMode() || ($wizardScope.isEditMode() && !deviceData.id)) {
                $uibModalInstance.close(_comms_interface);
            } else {
                $wizardScope.executeRelation(_comms_interface, function(ok) {
                    $uibModalInstance.close(_comms_interface);
                });
            }

            // $uibModalInstance.close(_comms_interface);
        };

        $scope.cancel = function() {
            $scope.communicationsInterface = {};
            $uibModalInstance.dismiss('cancel');
        };

        var _Element = function(type, id, placeholder, required, description) {
            this.parameter = id;
            this.id = 'comms_module_' + id.toLowerCase();
            this.placeholder = placeholder;
            this.required = required;
            this.element = type;
            this.description = description;
        };

        var locationEvents = [];
        var _LocationElement = function(id, required) {
            //TODO. refactorizar y crear directiva para mostrar la parte de localizacion
            var _this = this;
            _Element.call(this, 'location', id, null, required, null);
            this.location = {
                latitude: null,
                longitude: null,
                map: {
                    center: {
                        lat: 40.095,
                        lng: -3.823,
                        zoom: 4
                    },
                    events: {
                        markers: {
                            enable: ['dragend', 'click'],
                            logic: 'emit'
                        },
                        map: {
                            enable: ['click'],
                            logic: 'emit'
                        }
                    },
                    markers: {}
                }
            };
            this.map = { id: 'comms_module_map_' + id };
            this.placeholder = {
                latitude: 'Latitude' + (!required ? ' (optional)' : ''),
                longitude: 'Longitude' + (!required ? ' (optional)' : ''),
                postal: 'Postal' + (!required ? ' (optional)' : '')
            };

            locationEvents.push($scope.$on('leafletDirectiveMarker.map-marker.click', function(event, args) {
                $scope.communicationsInterface.location.map.markers = {};
                $scope.communicationsInterface.location.latitude = undefined;
                $scope.communicationsInterface.location.longitude = undefined;
            }));

            locationEvents.push($scope.$on('leafletDirectiveMap.map-marker.click', function(event, args) {
                var latlng = args.leafletEvent.latlng;
                //$scope.location.map.markers = {};
                $scope.communicationsInterface.location.map.markers = {
                    marker: {
                        lat: latlng.lat,
                        lng: latlng.lng,
                        draggable: true,
                        focus: true,
                        message: 'Drag me to move. Click me to remove'
                    }
                };
                $scope.communicationsInterface.location.latitude = latlng.lat;
                $scope.communicationsInterface.location.longitude = latlng.lng;
            }));


            locationEvents.push($scope.$on('leafletDirectiveMarker.map-marker.dragend', function(event, args) {
                var point = args.leafletEvent.target._leaflet_events.dragend[0].context._latlng;
                $scope.communicationsInterface.location.latitude = point.lat;
                $scope.communicationsInterface.location.longitude = point.lng;
            }));
        };

        $scope.$on('destroy', function() {
            for (var eventToDestroy in locationEvents) {
                eventToDestroy();
            }
        });

        var _InputElement = function(id, required, pattern, title, description, defaultValue, readOnly) {
            _Element.call(this, 'input', id, communicationsInterfaceFilter(id) + (!required ? ' (optional)' : ''), required, description);
            if (defaultValue) {
                this.value = defaultValue;
            }
            if (readOnly === true) {
                this.disabled = readOnly;
            }
            this.title = title;
            this.type = 'text';
            this.pattern = pattern;
        };

        var _ComboElement = function(id, required, list, description) {
            _Element.call(this, 'select_simple', id, 'Choose a ' + communicationsInterfaceFilter(id) + (!required ? ' (optional)' : ''), required, description);
            this.value = null;
            this.list = list;
        };

        var _SoftwareComboElement = function(id, required, description) {
            _ComboElement.call(this, id, required, $scope.softwareCollection, description);
            this.element = 'SOFTWARE';
        };

        var _HardwareComboElement = function(id, required, description) {
            _ComboElement.call(this, id, required, $scope.hardwareCollection, description);
            this.element = 'HARDWARE';
        };

        var _AdministrativeStateComboElement = function(id, required, description) {
            _Element.call(this, 'select_simple', id, 'Choose an Administrative State' + (!required ? ' (optional)' : ''), required, description);
            this.value = null;
            this.list = $scope.administrativeStateCollection;
        };


        var _getElement = function(field, required, prefix) {
            switch (field) {
                case 'IMEI':
                case 'IMSI':
                case 'MSISDN':
                case 'ICC':
                    return new _InputElement(field, required, undefined, field);
                case 'entityKey':
                    return new _InputElement('entityKey', required, undefined, 'Unique identifier');
                case 'generatedEntityKey':
                    return new _InputElement('entityKey', required, undefined, 'Unique identifier', 'Unique identifier', prefix + '_' + new Date().getTime() + '_' + Math.trunc(Math.random() * 1e4), true);
                case 'administrativeState':
                    return new _AdministrativeStateComboElement(field, required);
                case 'REGISTER_OPERATOR':
                case 'HOME_OPERATOR':
                    return new _ComboElement(field, required, $scope.registerOperatorCollection);
                case 'HARDWARE':
                    return new _HardwareComboElement(field, required);
                case 'SOFTWARE':
                    return new _SoftwareComboElement(field, required);
                case 'MAC':
                    return new _InputElement(field, required, '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', field, 'Add a valid MAC');
                case 'ADDRESS':
                    return new _InputElement(
                        field,
                        required,
                        '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$',
                        'Add a valid IP'
                    );
                case 'LOCATION':
                    //TODO. refactorizar y crear directiva para mostrar la parte de localizacion - por ahora no se añade (solo para el generico)
                    //return new _LocationElement(field, required);
                    return null;
            }
        };

        var keys = [];
        var _addElement = function(src, collection, mandatory, prefix) {
            angular.forEach(collection, function(value, key) {
                // TODO. resolver problema de la interfaz de comunicaciones MOBILE y los parametros msisdn e imei
                // tiene que ser al menos uno de los dos y no hay solución en la directiva que carga los parametros de forma dinamica
                //if (keys.indexOf(value) === -1) {
                //   keys.push(value);
                var _element = _getElement(value, mandatory, prefix);
                if (_element)
                    src.push(_element);
                //}
            });
        };

        $scope.changeCommsModuleType = function(element) {
            $scope.communicationsInterface = {};
            angular.forEach(element.value, function(value, key) {
                var entity = value;
                $scope.communicationsInterface[key] = [];
                var optional = entity.optional;
                var mandatory = entity.mandatory;
                _addElement($scope.communicationsInterface[key], mandatory, true, key);
                _addElement($scope.communicationsInterface[key], optional, false, key);
            });
            keys.splice(0, keys.length);
        };
    }
]);

_wizard.controller('StepDeviceRelationController', ['$scope', 'WizardHandler', '$api', 'entityService', '$uibModal', 'jsonPath', 'toastr',
    function($scope, WizardHandler, $api, entityService, $uibModal, jsonPath, toastr) {

        $scope.show_previous = true;
        $scope.show_execute = true;
        $scope.show_next = false;

        $scope.addCommunicationsModule = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                templateUrl: 'communications_module_form.html',
                controller: 'StepDeviceCommunicationsModuleController',
                resolve: {
                    $wizardScope: function() {
                        return $scope;
                    }
                }
            });

            modalInstance.result.then(function(communicationsInterface) {
                $scope.entity.communicationsInterfaces.push(communicationsInterface);
            }, function() {
                console.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.removeCommunicationsModule = function(index, relation) {
            if (relation) {
                console.log(relation);
                $scope.removeRelation(relation, function(ok) {
                    $scope.entity.communicationsInterfaces.splice(index, 1);
                });
            } else {
                $scope.entity.communicationsInterfaces.splice(index, 1);
            }
        };

        $scope.execute = function() {
            build();
            return $scope.executeCreate();
        };

        $scope.update = function() {
            build();
            return $scope.executeUpdate();
        };

        $scope.previous = function() {
            build();
            return true;
        };

        $scope.exitValidation = function() {
            build();
            return true;
        };

        $scope.enterValidation = function() {
            var deviceData = {};
            if ($scope.isEditMode() && deviceData.id) {

                if ($scope.$resolve.updateData.provision.$related && $scope.$resolve.updateData.provision.$related.communicationsModules) {
                    $scope.disableWizard(true);
                    $scope.$resolve.updateData.provision.$related.communicationsModules()
                        .then(function(response) {
                            //console.log(JSON.stringify(response));
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

                                            $scope.entity.communicationsInterfaces.push(finalData);
                                        });
                                    } else {
                                        var commData = {};

                                        commData[specificType] = {
                                            'COMMUNICATIONS_MODULE': [{
                                                parameter: 'entityKey',
                                                value: curComm.id
                                            }]
                                        };

                                        $scope.entity.communicationsInterfaces.push(commData);
                                    }


                                });

                                $scope.$apply();
                            }

                            delete $scope.$resolve.updateData.provision.$related;

                            $scope.disableWizard(false);
                            $scope.$apply();

                        }).catch(function(error) {
                            console.error(JSON.stringify(error));
                            toastr.warning(error);

                            $scope.disableWizard(false);
                            $scope.$apply();

                        });

                }
            }

            return true;
        };

        function build() {
            var deviceData = $scope.$resolve.updateData || {};
            if (!$scope.isEditMode() || ($scope.isEditMode() && !deviceData.id)) {
                entityService.addRelations($scope.entity.communicationsInterfaces);
            }
        }
    }
]);