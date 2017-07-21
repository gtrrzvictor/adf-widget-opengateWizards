'use strict';

angular.module('adf.widget.opengateWizards', ['adf.provider']);

require('./wizard.footer.client.view.html');
require('./wizard.log.client.view.html');

require('./user/userWizard');
require('./entity/entityWizard');