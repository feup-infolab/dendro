angular.module('dendroApp.controllers')
/**
 *  Project administration controller
 */
    .controller('notificationCtrl', function ($scope, $http, $filter, usersService, notificationService, $window, $element, $interval, ngAlertsMngr, ngAlertsEvent, $sce)
    {
        $scope.numNotifications = 0;
        $scope.notifsUris = [];
        $scope.notifsData = [];
        $scope.awaitingResponse = false;

        $scope.actionTypeDictionary = {
            Like: 'liked',
            Comment: 'commented',
            Share: 'shared'
        };

        $scope.resourceTypeDictionary = {
            post: 'post',
            share: 'share'
        };

        $scope.parseResourceTarget = function (resourceTargetUri)
        {
            let debug = resourceTargetUri.split('/')[2];
            return $scope.resourceTypeDictionary[resourceTargetUri.split('/')[2]];
            console.log('debug');
        };

        $scope.parseActionType = function (notification)
        {
            var actionType = $scope.actionTypeDictionary[notification.actionType];
            var shareURL = actionType == 'shared' ? '<' + 'a href=' + '"' + notification.shareURI + '"' + '>' + actionType + '</a>' : actionType;
            return shareURL;
        };

        $scope.$on(ngAlertsEvent.event('remove'), function (e, id)
        {
            $scope.delete_notification(id);
        });

        $scope.createAlert = function (notification, notificationUri)
        {
            let type = 'info';
            let shareURL = notification.actionType == 'Share' ? notification.shareURI : null;
            let userInfo;

            usersService.getUserInfo(notification.userWhoActed)
                .then(function (response)
                {
                    userInfo = response.data;
                    var resourceURL = '<' + 'a href=' + '"' + notification.resourceTargetUri + '"' + '>' + $scope.parseResourceTarget(notification.resourceTargetUri) + '</a>';
                    var userWhoActedURL = '<' + 'a href=' + '"' + notification.userWhoActed + '"' + '>' + userInfo.ddr.username + '</a>';
                    // var notificationMsg = notification.userWhoActed.split('/').pop() + " " + $scope.actionTypeDictionary[notification.actionType] + " your " + resourceUrl;
                    var notificationMsg = userWhoActedURL + ' ' + $scope.parseActionType(notification) + ' your ' + resourceURL;

                    $scope.msg = $sce.trustAsHtml(notificationMsg);

                    ngAlertsMngr.add({
                        msg: $scope.msg,
                        type: type,
                        time: new Date(notification.modified),
                        id: notificationUri
                    });
                })
                .catch(function (error)
                {
                    Utils.show_popup('error', "Error getting a user's information", JSON.stringify(error));
                });

            /* var resourceURL = "<" + "a href=" + "\"" + notification.resourceTargetUri + "\"" + ">" + $scope.parseResourceTarget(notification.resourceTargetUri) + "</a>";
            var userWhoActedURL = "<" + "a href=" + "\"" + notification.userWhoActed + "\"" + ">" + notification.userWhoActed.split('/').pop() + "</a>";
            //var notificationMsg = notification.userWhoActed.split('/').pop() + " " + $scope.actionTypeDictionary[notification.actionType] + " your " + resourceUrl;
            var notificationMsg = userWhoActedURL + " " + $scope.parseActionType(notification) + " your " + resourceURL;

            $scope.msg = $sce.trustAsHtml(notificationMsg);

            ngAlertsMngr.add({
                msg: $scope.msg,
                type: type,
                time: new Date(notification.modified),
                id: notificationUri
            }); */
        };

        $scope.getAlerts = function ()
        {
            var data = ngAlertsMngr.get();
        };

        $scope.removeAlert = function (notificationUri)
        {
            ngAlertsMngr.remove(notificationUri);
        };

        $scope.get_unread_notifications = function ()
        {
            ngAlertsMngr.reset();
            if (!$scope.awaitingResponse)
            {
                $scope.awaitingResponse = true;
                notificationService.getUserUnreadNotifications()
                    .then(function (response)
                    {
                        $scope.numNotifications = response.data.length;
                        $scope.notifsUris = response.data;
                        $scope.awaitingResponse = false;
                    })
                    .catch(function (error)
                    {
                        console.error('Error getting unread notifications' + JSON.stringify(error));
                        $scope.awaitingResponse = false;
                    });
            }
        };

        $scope.init = function ()
        {
            $scope.get_unread_notifications();
            // $interval($scope.get_unread_notifications, 60000); //TODO DEACTIVATED FOR DEBUGGING JROCHA
        };

        $scope.get_notification_info = function (notificationUri)
        {
            notificationService.get_notification_info(notificationUri)
                .then(function (response)
                {
                    $scope.notifsData[notificationUri] = response.data;
                    // user {{notifsData[notifUri.uri][0].userWhoActed.split('/').pop()}}  {{notifsData[notifUri.uri][0].actionType}} your {{notifsData[notifUri.uri][0].resourceTargetUri.split('/')[3]}}
                    // var notificationMsg = "user "  + response.data[0].userWhoActed + " " + response.data[0].actionType + " your " + response.data[0].resourceTargetUri;
                    var notification = response.data[0];
                    $scope.createAlert(notification, notificationUri);
                })
                .catch(function (error)
                {
                    console.error('Error getting Notification Info' + JSON.stringify(error));
                });
        };

        $scope.delete_notification = function (notificationUri)
        {
            notificationService.delete_notification(notificationUri)
                .then(function (response)
                {
                    // TODO check response to see if it was actually deleted or not
                })
                .catch(function (error)
                {
                    console.error('Error deleting a notification' + JSON.stringify(error));
                });
        };
    });
