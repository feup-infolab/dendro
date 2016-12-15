angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('notificationCtrl', function ($scope, $http, $filter, notificationService, $window, $element)
    {
        $scope.numNotifications = 0;
        $scope.notifsUris = [];
        $scope.get_unread_notifications = function()
        {
            //TODO here put notification polling with time
            notificationService.getUserUnreadNotifications()
                .then(function (response) {
                    $scope.numNotifications = response.data.length;
                    $scope.notifsUris = response.data;
                })
                .catch(function (error) {
                    console.error("Error getting unread notifications" + JSON.stringify(error));
                });
        }
    });
