'use strict';

angular.module('dendroApp.services')
    .service('notificationService', ['$http', function ($http) {

        {

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

    }]);
