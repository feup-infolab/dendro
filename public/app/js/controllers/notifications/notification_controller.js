angular.module("dendroApp.controllers")
/**
 *  Project administration controller
 */
    .controller("notificationCtrl", function ($scope, $http, $filter, usersService, notificationService, $window, $element, $interval, ngAlertsMngr, ngAlertsEvent, $sce)
    {
        $scope.notifsUris = [];
        $scope.notifsData = [];
        $scope.awaitingResponse = false;

        $scope.actionTypeDictionary = {
            Like: "liked",
            Comment: "commented",
            Share: "shared",
            SystemMessage: "system message"
        };

        $scope.resourceTypeDictionary = {
            post: "post",
            share: "share",
            project: "project"
        };

        $scope.socket = null;
        $scope.userUri = null;

        $scope.handleSocketSession = function()
        {
            var initSocketSession = function ()
            {
                var host = window.location.host;
                var socket = io(host);
                $scope.socket = socket;
            };

            var handleSocketConnectEvent = function () {
                $scope.socket.on("connect", function () {
                    $scope.socket.emit("identifyUser", { userUri: $scope.userUri });
                });

                $scope.socket.on($scope.userUri + ":identified", function (data) {
                    console.log("user: " +  $scope.userUri + " is now identified");
                });

                $scope.socket.on($scope.userUri + ":message", function (data) {
                    Utils.show_popup("info", "Job Information", data.message);
                });

                $scope.socket.on($scope.userUri + ":notification", function (notificationData) {
                    Utils.show_popup("info", "Notification", "You have a new notification!");
                    //$scope.get_unread_notifications();
                    $scope.pushNewNotificationToAlerts(notificationData);
                });

                $scope.socket.on("disconnect", function () {
                    console.log("client session was disconnected");
                    $scope.socket.emit("forceDisconnect", { socketID : $scope.socket.id, userUri: $scope.userUri });
                });
            };

            usersService.get_logged_user()
                .then(function (user)
                {
                    $scope.userUri = user.uri;
                    initSocketSession();
                    handleSocketConnectEvent();
                })
                .catch(function (error) {
                    console.log("Error here:" + error);
                    Utils.show_popup("error", "Socket Session", "Error getting logged user information");
                });
        };

        $scope.destroySocketSession = function () {
            $scope.socket.emit("forceDisconnect", { "userUri": $scope.userUri,  "socketID": $scope.socket.id });
        };


        $scope.parseResourceTarget = function (resourceTargetUri)
        {
            let debug = resourceTargetUri.split("/")[2];
            return $scope.resourceTypeDictionary[resourceTargetUri.split("/")[2]];
        };

        $scope.parseActionType = function (notification)
        {
            var actionType = $scope.actionTypeDictionary[notification.ddr.actionType];
            var shareURL = actionType == "shared" ? "<" + "a href=" + "\"" + notification.ddr.shareURI + "\"" + ">" + actionType + "</a>" : actionType;
            return shareURL;
        };

        $scope.$on(ngAlertsEvent.event("remove"), function (e, id)
        {
            $scope.delete_notification(id);
        });

        $scope.createAlert = function (notification, notificationUri)
        {
            var drawAlert = function (notificationMsg, notification) {
                $scope.msg = $sce.trustAsHtml(notificationMsg);

                var date = notification.ddr.modified || notification.ddr.created;

                let type = "info";
                /*
                ngAlertsMngr.add({
                    msg: $scope.msg,
                    type: type,
                    time: new Date(date),
                    id: notificationUri
                });
                */
                var alert = {
                    msg: $scope.msg,
                    type: type,
                    time: new Date(date),
                    id: notificationUri
                };
                $scope.addAlert(alert);
            };

            if(notification.ddr.actionType === "SystemMessage")
            {
                var message = null;
                if(notification.ddr.resourceTargetUri)
                {
                    message = "<" + "a href=" + "\"" + notification.ddr.resourceTargetUri + "\"" + ">" + notification.schema.sharedContent + "</a>";
                }
                else
                {
                    message = notification.schema.sharedContent;
                }
                drawAlert(message, notification);
            }
            else if(notification.ddr.actionType === "Like" || notification.ddr.actionType === "Comment" || notification.ddr.actionType === "Share")
            {
                let userInfo = null;
                usersService.getUserInfo(notification.ddr.userWhoActed)
                    .then(function (response)
                    {
                        userInfo = response.data;
                        var resourceURL = "<" + "a href=" + "\"" + notification.ddr.resourceTargetUri + "\"" + ">" + $scope.parseResourceTarget(notification.ddr.resourceTargetUri) + "</a>";
                        var userWhoActedURL = "<" + "a href=" + "\"" + notification.ddr.userWhoActed + "\"" + ">" + userInfo.ddr.username + "</a>";
                        var message = userWhoActedURL + " " + $scope.parseActionType(notification) + " your " + resourceURL;
                        drawAlert(message, notification);
                    })
                    .catch(function (error)
                    {
                        console.log("Error getting a user's information: " + JSON.stringify(error));
                        Utils.show_popup("error", "Notification error", "Error getting a user's information");
                    });
            }
            else
            {
                var message = "invalid message action type";
                drawAlert(message, notification);
            }
        };

        $scope.getAlerts = function ()
        {
            return ngAlertsMngr.get();
        };

        $scope.removeAlert = function (notificationUri)
        {
            ngAlertsMngr.remove(notificationUri);
        };

        $scope.resetAlerts = function () {
            ngAlertsMngr.reset();
        };

        $scope.addAlert = function (alert) {
            /*
            ngAlertsMngr.add({
                msg: $scope.msg,
                type: type,
                time: new Date(date),
                id: notificationUri
            });
            */
            ngAlertsMngr.add(alert);
        };

        $scope.get_unread_notifications = function ()
        {
            //ngAlertsMngr.reset();
            if (!$scope.awaitingResponse)
            {
                $scope.awaitingResponse = true;
                notificationService.getUserUnreadNotifications()
                    .then(function (response)
                    {
                        $scope.notifsUris = _.pluck(response.data, "uri");
                        $scope.awaitingResponse = false;
                    })
                    .catch(function (error)
                    {
                        console.log("error", "Error getting unread notifications" + JSON.stringify(error));
                        Utils.show_popup("error", "Notification error", "Error getting a user's unread notification");
                        $scope.awaitingResponse = false;
                    });
            }
        };

        $scope.init = function ()
        {
            $scope.get_unread_notifications();
            $scope.handleSocketSession();
            $scope.getAlerts();
        };

        $scope.get_notification_info = function (notificationUri)
        {
            var index = _.findIndex($scope.notifsData, function (notifData) {
                return notifData.uri === notificationUri;
            });
            if(index !== -1)
            {
                return $scope.notifsData[index];
            }
            else
            {
                notificationService.get_notification_info(notificationUri)
                    .then(function (response)
                    {
                        //$scope.notifsData[notificationUri] = response.data;
                        $scope.notifsData.push(response.data);
                        var notification = response.data;
                        $scope.createAlert(notification, notificationUri);
                    })
                    .catch(function (error)
                    {
                        console.log("error", "Error getting Notification Info" + JSON.stringify(error));
                        Utils.show_popup("error", "Notification error", "Error getting a user's notification information");
                    });
            }

        };

        $scope.pushNewNotificationToAlerts = function (notificationData) {
            $scope.notifsData.push(notificationData);
            $scope.notifsUris.push(notificationData.uri);
            $scope.createAlert(notificationData, notificationData.uri);
            $scope.getAlerts();
            $scope.$apply();
        };

        $scope.delete_notification = function (notificationUri)
        {
            notificationService.delete_notification(notificationUri)
                .then(function (response)
                {
                    $scope.get_unread_notifications();
                    if($scope.notifsUris.length === 0)
                    {
                        $scope.resetAlerts();
                    }
                    $scope.getAlerts();
                })
                .catch(function (error)
                {
                    console.log("error", "Error deleting a notification" + JSON.stringify(error));
                    Utils.show_popup("error", "Notification error", "Error deleting a user's notification");
                });
        };
    });
