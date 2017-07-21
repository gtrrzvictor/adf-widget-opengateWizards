'use strict';

var _wizard = angular.module('adf.widget.opengateWizards');

_wizard.factory('entityService', ['$api', '$rootScope', 'codeErrorsFilter', function($api, $rootScope, codeErrorsFilter) {
    var entity = { type: 'GATEWAY' };
    var _entity = {};
    var entityBuilder = {};
    var relations = [];

    function PromiseManager() {
        if (this.constructor.name !== 'PromiseManager') {
            throw new Error('PromiseManager must be a object. Must be create a new instance like "new PromiseManager()"');
        }
        var error;
        var pending = [];
        var finished = [];
        var stateManager = false;
        var successfulResponses = [];
        var _this = this;
        this.startCreateProcess = function(_then, _catch) {
            if (stateManager) {
                console.warn('PromiseManager is already started.');
                return;
            }
            if (pending.length === 0) {
                throw new Error('Must append at least one promise.');
            }
            this._then = _then;
            this._catch = _catch;
            stateManager = !stateManager;
            _start();
        };
        this.add = function(builder) {
            if (stateManager) {
                console.warn('PromiseManager is already started. Cannot add more promises.');
                return;
            }
            pending.push(builder);
        };

        function _start() {
            if (pending.length === 0) {
                console.log('All created successfully.');
                _this._then(successfulResponses);
                return;
            }
            console.log('Start to execute next promise.');
            var pInProgress = pending.shift();
            pInProgress.create().then(function(response) {
                console.log('Entity created.');
                console.log(response);
                finished.push(pInProgress);
                successfulResponses.push(response[0]);
                _start();
            }).catch(function(err) {
                console.error('Error creating entity.');
                console.error(err);
                console.log('Start to remove entities created.');
                error = err;
                _delete();
            });
        }

        function _delete() {
            if (finished.length === 0) {
                console.log('All removed.');
                _this._catch(error);
                return;
            }
            console.log('Remove next entity.');
            finished.pop().delete().then(function(message) {
                console.log('Entity removed.');
                console.log(message);
                _delete();
            }).catch(function(err) {
                console.error('Error removing entity.');
                console.error(err);
            });
        }
    }

    function RelationFactory(promiseManager) {
        if (this.constructor.name !== 'RelationFactory') {
            throw new Error('RelationFactory must be a object. Must be create a new instance like "new RelationFactory()"');
        }
        if (promiseManager.constructor.name !== 'PromiseManager') {
            throw new Error('Parameter promiseManager must be instance of PromiseManager');
        }
        var builderHelperFactory = {
            'SUBSCRIBER': function(entity) {
                var methods = {
                    'entityKey': function(builder, value) {
                        builder.withEntityKey(value);
                    },
                    'administrativeState': function(builder, value) {
                        builder.withAdministrativeState(value);
                    },
                    'ICC': function(builder, value) {
                        builder.withIcc(value);
                    }
                };
                return this.createBuilder(entity, methods, $api().subscribersBuilder());
            },
            'SUBSCRIPTION': function(entity) {
                var methods = {
                    'entityKey': function(builder, value) {
                        builder.withEntityKey(value);
                    },
                    'administrativeState': function(builder, value) {
                        builder.withAdministrativeState(value);
                    },
                    'IMSI': function(builder, value) {
                        builder.withImsi(value);
                    },
                    'ADDRESS': function(builder, value) {
                        builder.withIpAddress(value);
                    },
                    'HOME_OPERATOR': function(builder, value) {
                        builder.withHomeOperator(value);
                    },
                    'REGISTER_OPERATOR': function(builder, value) {
                        builder.withRegisteredOperator(value);
                    },
                    'MSISDN': function(builder, value) {
                        builder.withMsisdn(value);
                    },
                    'LOCATION': function(builder, value) {
                        throw new Error('subscriptionBuilder setter location, not implemented.'); //builder.withLocation(value); 
                    }
                };
                return this.createBuilder(entity, methods, $api().subscriptionsBuilder());
            },
            'COMMUNICATIONS_MODULE': function(entity) {
                var methods = {
                    'entityKey': function(builder, value) {
                        builder.withEntityKey(value);
                    },
                    'administrativeState': function(builder, value) {
                        builder.withAdministrativeState(value);
                    },
                    'IMEI': function(builder, value) {
                        builder.withImei(value);
                    },
                    'MAC': function(builder, value) {
                        builder.withMac(value);
                    },
                    'HARDWARE': function(builder, value) {
                        builder.withHardware(value.id);
                    },
                    'SOFTWARE': function(builder, value) {
                        builder.withSoftware(value.id);
                    }
                };
                return this.createBuilder(entity, methods, $api().communicationsModulesBuilder());
            },
            createBuilder: function(entity, methods, builder) {
                entity.forEach(function(item) {
                    if (typeof item.value !== 'undefined' && item.value !== null) {
                        methods[item.parameter](builder, item.value);
                    }
                });
                return builder;
            }
        };
        var relationHelper = {
            'SUBSCRIBER': 'withSubscriber',
            'SUBSCRIPTION': 'withSubscription',
            'COMMUNICATIONS_MODULE': 'withCommunicationsModule'
        };

        this.createRelations = function(deviceBuilder, relations) {
            relations.forEach(function(relation) {
                var relationBuilder = $api().relationsBuilder()
                    .withOrganization(deviceBuilder._organization)
                    .withDevice(deviceBuilder._entityKey);
                for (var specificType in relation) {
                    for (var entityType in relation[specificType]) {
                        var entity = relation[specificType][entityType];
                        var builder = builderHelperFactory[entityType](entity);
                        builder.withSpecificType(specificType)
                            .withOrganization(deviceBuilder._organization)
                            .withChannel(deviceBuilder._channel)
                            //.withAdministrativeState('ACTIVE')
                            .withEntityKey(builder._entityKey || (deviceBuilder._entityKey + '_' + Math.trunc(Math.random() * 1e4) + '_' + entityType));
                        relationBuilder[relationHelper[entityType]](builder._entityKey);
                        promiseManager.add(builder);
                    }

                    if (specificType.toUpperCase() === 'sigfox') {
                        relationBuilder.withTemplate('sigfox');
                    }
                }
                promiseManager.add(relationBuilder);
            });
        };

        this.removeRelation = function(deviceBuilder, relation) {
            var relationBuilder = $api().relationsBuilder()
                .withOrganization(deviceBuilder._organization)
                .withDevice(deviceBuilder._entityKey);
            for (var specificType in relation) {
                for (var entityType in relation[specificType]) {
                    for (var entityParam in relation[specificType][entityType]) {
                        if (relation[specificType][entityType][entityParam].parameter === 'entityKey') {
                            relationBuilder[relationHelper[entityType]](relation[specificType][entityType][entityParam].value);
                        }
                    }
                }
            }

            return relationBuilder.delete();
        };
    }

    var resetEntityBuilder = function() {
        entityBuilder = {};
        _entity = {};
        relations = [];
    };

    var newEntityBuilder = function() {
        return (entityBuilder = $api().devicesBuilder().withType(entity.type.toLowerCase())); //.withAdministrativeState('ACTIVE'));
    };

    var getEntityBuilder = function() {
        return entityBuilder;
    };

    var updateEntityBuilder = function(_entity) {
        entityBuilder = _entity;
    };

    var execute = function() {
        var promiseManager = new PromiseManager();
        var relationFactory = new RelationFactory(promiseManager);
        try {
            promiseManager.add(entityBuilder);
            relationFactory.createRelations(entityBuilder, relations);
            promiseManager.startCreateProcess(function(response) {
                var json = JSON.stringify(response[0]);
                //$rootScope.$broadcast('finishCreateEntityWithoutError', json);
                //$rootScope.$broadcast('finishCreateEntity', json);
                $rootScope.$broadcast('entityManagementFinished', { isOk: true, data: json });
                resetEntityBuilder();
            }, function(response) {
                var errors;
                if (typeof response.message === 'string') {
                    errors = response;
                } else {
                    errors = response.errors || response.data.errors;
                }
                var filterErrors = [];
                errors = errors.errors || errors;
                errors = errors.message || errors;
                if (angular.isArray(errors)) {
                    angular.forEach(errors, function(value, key) {
                        filterErrors.push(codeErrorsFilter(value));
                    });
                } else {
                    filterErrors.push(errors);
                }
                $rootScope.$broadcast('entityManagementFinished', { isOk: false, data: JSON.stringify(filterErrors) });
            });
        } catch (err) {
            console.error(err);
            $rootScope.$broadcast('entityManagementFinished', { isOk: false, data: JSON.stringify(err) });
            return false;
        }
    };

    var update = function() {
        try {
            entityBuilder.update().then(function(response) {
                var json = JSON.stringify(response[0]);
                $rootScope.$broadcast('entityManagementFinished', { isOk: true, data: json });
            }, function(response) {
                var errors;
                if (typeof response.message === 'string') {
                    errors = response;
                } else {
                    errors = response.errors || response.data.errors;
                }
                var filterErrors = [];
                errors = errors.errors || errors;
                errors = errors.message || errors;
                if (angular.isArray(errors)) {
                    angular.forEach(errors, function(value, key) {
                        filterErrors.push(codeErrorsFilter(value));
                    });
                } else {
                    filterErrors.push(errors);
                }
                $rootScope.$broadcast('entityManagementFinished', { isOk: false, data: JSON.stringify(filterErrors) });
            });
        } catch (err) {
            console.error(err);
            $rootScope.$broadcast('entityManagementFinished', { isOk: false, data: JSON.stringify(err) });
            return false;
        }
    };

    var updateEntity = function(object) {
        angular.forEach(object, function(value, key) {
            if (value)
                _entity[key] = value;
            else if (_entity[key]) {
                delete _entity[key];
            }
        });
    };

    var addRelations = function(_relations) {
        relations = _relations;
    };

    var addRelation = function(_relation, _then, _catch) {
        relations = [_relation];
        var promiseManager = new PromiseManager();
        var relationFactory = new RelationFactory(promiseManager);
        try {
            //promiseManager.add(entityBuilder);
            relationFactory.createRelations(entityBuilder, relations);
            promiseManager.startCreateProcess(_then, function(response) {
                var errors;
                if (typeof response.message === 'string') {
                    errors = response;
                } else if (response.errors) {
                    errors = response.errors;
                } else if (response.data && response.data.errors) {
                    errors = response.data.errors;
                } else {
                    errors = response.statusCode;
                }
                var filterErrors = [];
                errors = errors.errors || errors;
                errors = errors.message || errors;
                if (angular.isArray(errors)) {
                    angular.forEach(errors, function(value, key) {
                        filterErrors.push(codeErrorsFilter(value));
                    });
                } else {
                    filterErrors.push(errors);
                }

                _catch(JSON.stringify(filterErrors));
            });
        } catch (err) {
            console.error(err);
            _catch(err);
        }
    };

    var removeRelation = function(_relation, _then, _catch) {
        var relationFactory = new RelationFactory(new PromiseManager());
        try {
            //promiseManager.add(entityBuilder);
            relationFactory.removeRelation(entityBuilder, _relation).then(_then)
                .catch(function(response) {
                    var errors;
                    if (typeof response.message === 'string') {
                        errors = response;
                    } else {
                        errors = response.errors || response.data.errors;
                    }
                    var filterErrors = [];
                    errors = errors.errors || errors;
                    errors = errors.message || errors;
                    if (angular.isArray(errors)) {
                        angular.forEach(errors, function(value, key) {
                            filterErrors.push(codeErrorsFilter(value));
                        });
                    } else {
                        filterErrors.push(errors);
                    }

                    _catch(JSON.stringify(filterErrors));
                });
        } catch (err) {
            console.error(err);
            _catch(err);
        }
    };

    var createAndValidateBuilder = function() {
        var builder = newEntityBuilder();
        angular.forEach(_entity, function(value, key) {
            if (value !== undefined) {
                var method = builder['with' + key];
                if (method.length > 1) {
                    builder['with' + key].apply(builder, value);
                } else {
                    builder['with' + key](value);
                }
            }
        });
        updateEntityBuilder(builder);
    };


    var loadCollection = function(builder, obj, collection, id) {
        builder.limit(1000).build().execute().then(
            function(data) {
                if (data.statusCode === 200) {
                    obj.selected = null;
                    var datas = data.data[id];
                    if (angular.isArray(datas)) {
                        angular.forEach(datas, function(data, key) {
                            collection.push(data);
                        });
                    } else {
                        angular.copy(datas, collection);
                    }
                    return;
                }
                obj.selected = { name: 'Loading error' };
            }
        );
    };

    return {
        newEntityBuilder: newEntityBuilder,
        resetEntityBuilder: resetEntityBuilder,
        getEntityBuilder: getEntityBuilder,
        updateEntityBuilder: updateEntityBuilder,
        updateEntity: updateEntity,
        createAndValidateBuilder: createAndValidateBuilder,
        execute: execute,
        update: update,
        loadCollection: loadCollection,
        addRelations: addRelations,
        addRelation: addRelation,
        removeRelation: removeRelation,
        entity: entity
    };
}]);