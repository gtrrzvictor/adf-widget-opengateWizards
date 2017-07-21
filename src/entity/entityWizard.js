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
    }).run(function($doActions) {
        $doActions.listener('entityWizard', function(user) {
            user.password_repeat = user.password;
            user.organization = user.domain;
            delete user.domain;
            return { user: user };
        });
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