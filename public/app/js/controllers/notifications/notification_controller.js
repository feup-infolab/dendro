angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('notificationCtrl', function ($scope, $http, $filter, notificationService, $window, $element, $interval)
    {
        $scope.numNotifications = 0;
        $scope.notifsUris = [];
        $scope.notifsData = [];
        $scope.awaitingResponse = false;

        $scope.get_unread_notifications = function()
        {
            if(!$scope.awaitingResponse)
            {
                $scope.awaitingResponse = true;
                notificationService.getUserUnreadNotifications()
                    .then(function (response) {
                        $scope.numNotifications = response.data.length;
                        $scope.notifsUris = response.data;
                        $scope.awaitingResponse = false;
                    })
                    .catch(function (error) {
                        console.error("Error getting unread notifications" + JSON.stringify(error));
                        $scope.awaitingResponse = false;
                    });
            }
        };

        $scope.init = function () {
            $scope.get_unread_notifications();
            $interval($scope.get_unread_notifications, 60000);
        };

        $scope.get_notification_info = function (notificationUri) {
            notificationService.get_notification_info(notificationUri)
                .then(function (response) {
                    $scope.notifsData[notificationUri] = response.data;
                })
                .catch(function (error) {
                    console.error("Error getting Notification Info" + JSON.stringify(error));
                });
        };

        $scope.delete_notification = function (notificationUri) {
            notificationService.delete_notification(notificationUri)
                .then(function (response) {
                    //TODO check response to see if it was actually deleted or not
                })
                .catch(function (error) {
                    console.error("Error deleting a notification" + JSON.stringify(error));
                });
        };


    });
