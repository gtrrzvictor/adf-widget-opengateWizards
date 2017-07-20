'use strict';

angular.module('adf.widget.opengateWizards', ['adf.provider'])
    .config(function(dashboardProvider) {
        dashboardProvider
            .widget('userWizard', {
                title: 'User wizard',
                description: 'This widget will register a collection of wizards which it will be used by any registered user',
                template: require("./views/userwizard.client.view.html"),
                controller: 'UserWizardController',
                category: 'Wizards',
                edit: {
                    template: require("./views/userwizard.client.view.html"),
                    controller: 'UserWizardEditController'
                }
            });
    }).run(function($doActions) {
        $doActions.listener('userWizard', function(user) {
            user.password_repeat = user.password;
            user.organization = user.domain;
            delete user.domain;
            return { user: user };
        });
    });

require('./views/collectstep.client.view.html');
require('../wizard.footer.client.view.html');
require('../wizard.log.client.view.html');

require('../basewizard.client.controller');
require('./controllers/userwizard.client.controller');
require('./controllers/userwizard.steps.client.controller');
require('./controllers/userwizard-edit.client.controller');