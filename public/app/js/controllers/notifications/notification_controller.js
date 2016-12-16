angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('notificationCtrl', function ($scope, $http, $filter, notificationService, $window, $element, $interval)
    {
        $scope.numNotifications = 0;
        $scope.notifsUris = [];
        $scope.awaitingResponse = false;

        /*
        function load_notifications() {
            if(!$scope.awaitingResponse)
            {
                $scope.awaitingResponse = true;

            }
        }*/

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


    });
