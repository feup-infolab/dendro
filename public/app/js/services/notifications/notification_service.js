'use strict';

angular.module('dendroApp.services')
    .service('notificationService', ['$http', function ($http) {

        this.getUserUnreadNotifications = function ()
        {
            var requestUri = "/notifications/all";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.get_notification_info = function (notificationUri) {
            var requestUri = "/notifications/notification";
            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {"Accept": "application/json"},
                params: {notificationUri: notificationUri}
            });
        };

        this.delete_notification = function (notificationUri) {
            var requestUri = "/notifications/notification";
            return $http({
                method: 'DELETE',
                url: requestUri,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"},
                params: {notificationUri: notificationUri}
            });

        };

    }]);
