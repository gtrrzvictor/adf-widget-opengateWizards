'use strict';

var _wizard = angular.module('adf.widget.opengateWizards');

_wizard.factory('userService', ['$api', '$rootScope', 'toastr', '$q', function($api, $rootScope, toastr, $q) {

    var validateUser = function(userdata) {
        var defered = $q.defer();
        var promise = defered.promise;

        var email = userdata.email;
        var organization = userdata.organization;

        $api().newDomainFinder().findByName(organization).then(function() {
            $api().newUserFinder().findByEmail(email).then(function() {
                defered.reject('User exists');
            }).catch(function(res) {
                if (res.statusCode !== 404 && res.statusCode !== 204) {
                    defered.reject(res);
                } else {
                    defered.resolve(userdata);
                }
            });
        }).catch(function(res) {
            defered.reject(res);
        });
        return promise;
    };

    var createUser = function(validatedata) {
        var user = validatedata;
        var userApi = $api().usersBuilder().
        withCountryCode('ES').
        withDescription('Description of ' + user.name + ' ' + user.surname).
        withDomain(user.organization).
        withEmail(user.email).
        withLangCode('es').
        withPassword(user.password).
        withProfile(user.profile).
        withWorkgroup(user.workgroup || user.organization);
        //comprobación de parámetro no obligatorios
        if (user.name && user.name.length > 0) {
            userApi.withName(user.name);
        }
        if (user.surname && user.surname.length > 0) {
            userApi.withSurname(user.surname);
        }
        return userApi.create();
    };

    var updateUser = function(validatedata) {
        var user = validatedata;
        var userApi = $api().usersBuilder().
        withCountryCode('ES').
        withDescription(user.description).
        withDomain(user.organization).
        withEmail(user.email).
        withLangCode('es').
        withPassword(user.password).
        withProfile(user.profile).
        withWorkgroup(user.workgroup || user.organization);
        //comprobación de parámetro no obligatorios
        if (user.name && user.name.length > 0) {
            userApi.withName(user.name);
        }
        if (user.surname && user.surname.length > 0) {
            userApi.withSurname(user.surname);
        }
        return userApi.update();
    };

    var userProfiles = function(profileId) {
        var upsb = $api().userProfilesSearchBuilder();
        if (profileId) {
            upsb = upsb.withId(profileId);
        }
        return upsb.build().execute();
    };

    return {
        validateUser: validateUser,
        createUser: createUser,
        userProfiles: userProfiles,
        updateUser: updateUser
    };
}]);