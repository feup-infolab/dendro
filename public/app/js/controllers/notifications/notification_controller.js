angular.module("dendroApp.controllers")
/**
 *  Project administration controller
 */
    .controller("notificationCtrl", function ($scope, $http, $filter, usersService, notificationService, $window, $element, $interval, ngAlertsMngr, ngAlertsEvent, $sce)
    {
        $scope.urisOfNotifsToLoadFromServer = [];
        $scope.loadedNotifsDataFromServer = [];
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

        var handleSocketSession = function()
        {
            var initSocketSession = function ()
            {
                var host = window.location.host;
                $scope.socket = io(host);
            };

            var handleConnectedSocketEvents = function () {
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
                    pushNewNotificationToAlerts(notificationData);
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
                    handleConnectedSocketEvents();
                })
                .catch(function (error) {
                    console.log("Error here:" + error);
                    Utils.show_popup("error", "Socket Session", "Error getting logged user information");
                });
        };

        var destroySocketSession = function () {
            $scope.socket.emit("forceDisconnect", { "userUri": $scope.userUri,  "socketID": $scope.socket.id });
        };


        var parseResourceTarget = function (resourceTargetUri)
        {
            return $scope.resourceTypeDictionary[resourceTargetUri.split("/")[2]];
        };

        var parseActionType = function (notification)
        {
            var actionType = $scope.actionTypeDictionary[notification.ddr.actionType];
            var shareURL = actionType == "shared" ? "<" + "a href=" + "\"" + notification.ddr.shareURI + "\"" + ">" + actionType + "</a>" : actionType;
            return shareURL;
        };

        $scope.$on(ngAlertsEvent.event("remove"), function (e, notificationUri)
        {
            delete_notification(notificationUri);
        });

        var createAlert = function (notification, notificationUri)
        {
            var drawAlert = function (notificationMsg, notification) {
                $scope.msg = $sce.trustAsHtml(notificationMsg);

                var date = notification.ddr.modified || notification.ddr.created;

                let type = "info";
                var alert = {
                    msg: $scope.msg,
                    type: type,
                    time: new Date(date),
                    id: notificationUri
                };
                addAlertToNgAlert(alert);
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
                        var resourceURL = "<" + "a href=" + "\"" + notification.ddr.resourceTargetUri + "\"" + ">" + parseResourceTarget(notification.ddr.resourceTargetUri) + "</a>";
                        var userWhoActedURL = "<" + "a href=" + "\"" + notification.ddr.userWhoActed + "\"" + ">" + userInfo.ddr.username + "</a>";
                        var message = userWhoActedURL + " " + parseActionType(notification) + " your " + resourceURL;
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

        var getAlertsFromNgAlert = function ()
        {
            return ngAlertsMngr.get();
        };

        var removeAlertFromNgAlert = function (notificationUri)
        {
            ngAlertsMngr.remove(notificationUri);
        };

        var resetAlertsFromNgAlert = function () {
            ngAlertsMngr.reset();
        };

        var addAlertToNgAlert = function (alert) {
            ngAlertsMngr.add(alert);
        };

        var get_unread_notifications = function ()
        {
            if (!$scope.awaitingResponse)
            {
                $scope.awaitingResponse = true;
                notificationService.getUserUnreadNotifications()
                    .then(function (response)
                    {
                        $scope.urisOfNotifsToLoadFromServer = _.pluck(response.data, "uri");
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
            //TODO these two first functions are not synchronous -> they must be in a promise chain
            get_unread_notifications();
            handleSocketSession();
            getAlertsFromNgAlert();
        };

        $scope.get_notification_info = function (notificationUri)
        {
            //TODO write function here to check if notification data is already loaded from the server -> so that no unecessary request to the server are made
            var index = _.findIndex($scope.loadedNotifsDataFromServer, function (notifData) {
                return notifData.uri === notificationUri;
            });
            if(index !== -1)
            {
                return $scope.loadedNotifsDataFromServer[index];
            }
            else
            {
                notificationService.get_notification_info(notificationUri)
                    .then(function (response)
                    {
                        $scope.loadedNotifsDataFromServer.push(response.data);
                        var notification = response.data;
                        createAlert(notification, notificationUri);
                    })
                    .catch(function (error)
                    {
                        console.log("error", "Error getting Notification Info" + JSON.stringify(error));
                        Utils.show_popup("error", "Notification error", "Error getting a user's notification information");
                    });
            }

        };

        var pushNewNotificationToAlerts = function (notificationData) {
            $scope.loadedNotifsDataFromServer.push(notificationData);
            $scope.urisOfNotifsToLoadFromServer.push(notificationData.uri);

            //TODO descomplicar a funcão create alert para apenas criar um objeto alert
            createAlert(notificationData, notificationData.uri);

            //TODO chamar funçao aqui para fazer o draw alert -> que chama do addAlert to ngalert
            getAlertsFromNgAlert();
            $scope.$apply();
        };

        var delete_notification = function (notificationUri)
        {
            var noNotifsToLoadFromServer = function () {
                if($scope.urisOfNotifsToLoadFromServer.length === 0)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            };

            notificationService.delete_notification(notificationUri)
                .then(function (response)
                {
                    get_unread_notifications();
                    if(noNotifsToLoadFromServer() === true)
                    {
                        resetAlertsFromNgAlert();
                    }
                    getAlertsFromNgAlert();
                })
                .catch(function (error)
                {
                    console.log("error", "Error deleting a notification" + JSON.stringify(error));
                    Utils.show_popup("error", "Notification error", "Error deleting a user's notification");
                });
        };
    });
