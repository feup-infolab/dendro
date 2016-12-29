angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('notificationCtrl', function ($scope, $http, $filter, notificationService, $window, $element, $interval, ngAlertsMngr, ngAlertsEvent)
    {
        $scope.numNotifications = 0;
        $scope.notifsUris = [];
        $scope.notifsData = [];
        $scope.awaitingResponse = false;

        $scope.actionTypeDictionary = {
            Like : "liked",
            Comment : "commented",
            Share : "shared"
        };

        $scope.resourceTypeDictionary = {
            posts : "post",
            shares: "share",
            fileVersions: "file version"
        };

        $scope.parseResourceTarget = function (resourceTargetUri) {
            return $scope.resourceTypeDictionary[resourceTargetUri.split('/')[3]];
        };

        $scope.$on(ngAlertsEvent.event('remove'), function (e, id) {
            $scope.delete_notification(id);
        });

        $scope.createAlert = function (notification, notificationUri) {
            var type = "info";
            //var resourceUrl = '<a href=' + '\"' +notification.resourceTargetUri + '\">' + 'resource' + '</a>';
            //<a ng-href="http://www.gravatar.com/avatar/{{hash}}">link1</a>
            var resourceUrl = "<" + "a ng-href=" + "\"" +notification.resourceTargetUri + "\"" + ">" + "resource" + "</a>";
            var notificationMsg = notification.userWhoActed.split('/').pop() + " " + $scope.actionTypeDictionary[notification.actionType] + " your " + $scope.parseResourceTarget(notification.resourceTargetUri);
            //var notificationMsg = notification.userWhoActed.split('/').pop() + " " + $scope.actionTypeDictionary[notification.actionType] + " your " + resourceUrl;
            ngAlertsMngr.add({
                msg: notificationMsg,
                type: type,
                time: new Date(notification.modified),
                id: notificationUri,
                resourceUri : notification.resourceTargetUri
            });
            var cenas = "Olá";
            console.log(cenas);
        };

        /*
        ngAlertsMngr.remove(id)
        {
            console.log("at remove");
        };*/

        $scope.getAlerts = function () {
            var data = ngAlertsMngr.get();
            console.log(data);
        };

        $scope.removeAlert = function (notificationUri) {
            ngAlertsMngr.remove(notificationUri);
        };

        $scope.get_unread_notifications = function()
        {
            ngAlertsMngr.reset();
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
                    //user {{notifsData[notifUri.uri][0].userWhoActed.split('/').pop()}}  {{notifsData[notifUri.uri][0].actionType}} your {{notifsData[notifUri.uri][0].resourceTargetUri.split('/')[3]}}
                    //var notificationMsg = "user "  + response.data[0].userWhoActed + " " + response.data[0].actionType + " your " + response.data[0].resourceTargetUri;
                    var notification = response.data[0];
                    $scope.createAlert(notification, notificationUri);
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
