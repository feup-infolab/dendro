'use strict';

angular.module('dendroApp.services')
    .service('usersService',
        ['$http',
            function ($http) {

                this.get_logged_user = function()
                {
                    var requestUri = "/users/loggedUser";

                    return $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: "application/json",
                        headers: {'Accept': "application/json"}
                    });
                };
            }]);
