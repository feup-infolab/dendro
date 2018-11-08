angular.module("dendroApp.controllers")
/**
 *  Project administration controller
 */
    .controller("notificationCtrl", function ($scope, $http, $filter, usersService, notificationService, $window, $element, $interval, ngAlertsMngr, ngAlertsEvent, $sce, $q)
    {
        $scope.urisOfNotifsToLoadFromServer = [];
        $scope.loadedNotifsDataFromServer = [];

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

        // BEGIN AUX FUNCTIONS

        var getAlertsFromNgAlert = function ()
        {
            return ngAlertsMngr.get();
        };

        var removeAlertFromNgAlert = function (notificationUri)
        {
            ngAlertsMngr.remove(notificationUri);
        };

        var resetAlertsFromNgAlert = function ()
        {
            ngAlertsMngr.reset();
        };

        var addAlertToNgAlert = function (alert)
        {
            ngAlertsMngr.add(alert);
        };

        var handleSocketSession = function ()
        {
            var initSocketSession = function ()
            {
                var host = window.location.host;
                $scope.socket = io(host);
            };

            var handleConnectedSocketEvents = function ()
            {
                $scope.socket.on("connect", function ()
                {
                    $scope.socket.emit("identifyUser", { userUri: $scope.userUri });
                });

                $scope.socket.on($scope.userUri + ":identified", function (data)
                {
                    // console.log("user: " + $scope.userUri + " is now identified");
                    // console.log("Will now handle the rest of the events!");
                    $scope.socket.on($scope.userUri + ":message", function (data)
                    {
                        Utils.show_popup("info", "Job Information", data.message);
                    });

                    $scope.socket.on($scope.userUri + ":progress", function (data)
                    {
                        Utils.show_progress("Working...", data.schema.sharedContent, data.ddr.taskID);
                    });

                    $scope.socket.on($scope.userUri + ":end_task", function (data)
                    {
                        Utils.endTask(data.ddr.taskID);
                    });

                    $scope.socket.on($scope.userUri + ":notification", function (notificationData)
                    {
                        Utils.show_popup("info", "Notification", "You have a new notification!");
                        pushNewNotificationToAlerts(notificationData);
                    });

                    $scope.socket.on("disconnect", function ()
                    {
                        console.log("client session was disconnected");
                    });
                });
            };

            return usersService.get_logged_user()
                .then(function (user)
                {
                    $scope.userUri = user.uri;
                    initSocketSession();
                    handleConnectedSocketEvents();
                    return null;
                })
                .catch(function (error)
                {
                    console.log("Error here:" + error);
                    Utils.show_popup("error", "Socket Session", "Error getting logged user information");
                    throw error;
                });
        };

        var parseResourceTarget = function (resourceTargetUri)
        {
            return $scope.resourceTypeDictionary[resourceTargetUri.split("/")[2]];
        };

        var parseActionType = function (notification)
        {
            var actionType = $scope.actionTypeDictionary[notification.ddr.actionType];
            var shareURL = actionType === "shared" ? "<" + "a target=\"_blank\"" + " href=" + "\"" + notification.ddr.shareURI + "\"" + ">" + actionType + "</a>" : actionType;
            return shareURL;
        };

        var drawAlert = function (alertObject)
        {
            addAlertToNgAlert(alertObject);
        };

        var createAlert = function (notification, notificationUri)
        {
            var createAlertObject = function (notification, notificationMsg)
            {
                $scope.msg = $sce.trustAsHtml(notificationMsg);

                var date = notification.ddr.modified || notification.ddr.created;

                let type = "info";
                var alert = {
                    msg: $scope.msg,
                    type: type,
                    time: new Date(date),
                    id: notificationUri
                };
                return alert;
            };

            if (notification.ddr.actionType === "SystemMessage")
            {
                var message = null;
                if (notification.ddr.resourceTargetUri)
                {
                    message = "<" + "a target=\"_blank\"" + " href=" + "\"" + notification.ddr.resourceTargetUri + "\"" + ">" + notification.schema.sharedContent + "</a>";
                }
                else
                {
                    message = notification.schema.sharedContent;
                }
                var deferred = $q.defer();
                var alertObject = createAlertObject(notification, message);
                deferred.resolve(alertObject);
                return deferred.promise;
            }
            else if (notification.ddr.actionType === "Like" || notification.ddr.actionType === "Comment" || notification.ddr.actionType === "Share")
            {
                let userInfo = null;
                return usersService.getUserInfo(notification.ddr.userWhoActed)
                    .then(function (response)
                    {
                        userInfo = response.data;
                        var resourceURL = "<" + "a target=\"_blank\"" + " href=" + "\"" + notification.ddr.resourceTargetUri + "\"" + ">" + parseResourceTarget(notification.ddr.resourceTargetUri) + "</a>";
                        var userWhoActedURL = "<" + "a target=\"_blank\"" + " href=" + "\"" + notification.ddr.userWhoActed + "\"" + ">" + userInfo.ddr.username + "</a>";
                        var message = userWhoActedURL + " " + parseActionType(notification) + " your " + resourceURL;
                        return createAlertObject(notification, message);
                    })
                    .catch(function (error)
                    {
                        console.log("Error getting a user's information: " + JSON.stringify(error));
                        Utils.show_popup("error", "Notification error", "Error getting a user's information");
                        throw error;
                    });
            }

            var deferred = $q.defer();
            var message = "invalid message action type";
            var alertObject = createAlertObject(notification, message);
            deferred.resolve(alertObject);
            return deferred.promise;
        };

        var get_unread_notifications = function ()
        {
            return notificationService.getUserUnreadNotifications()
                .then(function (response)
                {
                    $scope.urisOfNotifsToLoadFromServer = _.pluck(response.data, "uri");
                    return $scope.urisOfNotifsToLoadFromServer;
                })
                .catch(function (error)
                {
                    console.log("error", "Error getting unread notifications" + JSON.stringify(error));
                    Utils.show_popup("error", "Notification error", "Error getting a user's unread notification");
                    throw error;
                });
        };

        var pushToLoadedNotifsDataFromServer = function (notificationData)
        {
            var index = _.findIndex($scope.loadedNotifsDataFromServer, function (notifData)
            {
                return notificationData.uri === notifData.uri;
            });

            if (index === -1)
            {
                $scope.loadedNotifsDataFromServer.push(notificationData);
            }
        };

        var pushToUrisOfNotifsToLoadFromServer = function (notificationUri)
        {
            var index = _.findIndex($scope.urisOfNotifsToLoadFromServer, function (notifUri)
            {
                return notifUri === notificationUri;
            });

            if (index === -1)
            {
                $scope.urisOfNotifsToLoadFromServer.push(notificationUri);
            }
        };

        var pushNewNotificationToAlerts = function (notificationData)
        {
            pushToLoadedNotifsDataFromServer(notificationData);
            pushToUrisOfNotifsToLoadFromServer(notificationData.uri);

            createAlert(notificationData, notificationData.uri).then(function (alert)
            {
                return alert;
            }).then(function (alert)
            {
                return drawAlert(alert);
            }).then(function (data)
            {
                return getAlertsFromNgAlert();
            }).then(function (data)
            {
                // $scope.$apply();
            }).catch(function (error)
            {
                Utils.show_popup("error", "Notification error", "Error drawing a new notification");
            });
        };

        var delete_notification = function (notificationUri)
        {
            var noNotifsToLoadFromServer = function ()
            {
                if ($scope.urisOfNotifsToLoadFromServer.length === 0)
                {
                    return true;
                }

                return false;
            };

            notificationService.delete_notification(notificationUri)
                .then(function (response)
                {
                    get_unread_notifications().then(function (data)
                    {
                        return data;
                    }).then(function (data)
                    {
                        if (noNotifsToLoadFromServer() === true)
                        {
                            resetAlertsFromNgAlert();
                        }
                        return data;
                    }).then(function (data)
                    {
                        getAlertsFromNgAlert();
                    }).catch(function (error)
                    {
                        throw error;
                    });
                })
                .catch(function (error)
                {
                    console.log("error", "Error deleting a notification" + JSON.stringify(error));
                    Utils.show_popup("error", "Notification error", "Error deleting a user's notification");
                });
        };

        // END AUX FUNCTIONS

        // BEGIN SCOPE FUNCTIONS
        $scope.$on(ngAlertsEvent.event("remove"), function (e, notificationUri)
        {
            delete_notification(notificationUri);
        });

        $scope.init = function ()
        {
            get_unread_notifications().then(function (data)
            {
                return data;
            }).then(function (data)
            {
                return handleSocketSession();
            }).then(function (data)
            {
                getAlertsFromNgAlert();
            }).catch(function (error)
            {
                Utils.show_popup("error", "Notification error", "Error initializing the notification controller");
            });
        };

        $scope.drawNotification = function (notificationUri)
        {
            // This functions returns the positions of notificationUri in the loadedNotifsDataFromServer Array
            // if the notification was not yet loaded from the server it returns -1
            // this is used to reduce the number of http requests to the server
            var getNotificationUriPositionInLoadedNotifsDataFromServer = function (notificationUri)
            {
                var index = _.findIndex($scope.loadedNotifsDataFromServer, function (notifData)
                {
                    return notifData.uri === notificationUri;
                });

                return index;
            };

            var index = getNotificationUriPositionInLoadedNotifsDataFromServer(notificationUri);
            if (index === -1)
            {
                // the notification data for this particular notificationUri is not loaded so a http request will be made
                // and the notification will be drawn to ngAlert
                notificationService.get_notification_info(notificationUri)
                    .then(function (response)
                    {
                        pushToLoadedNotifsDataFromServer(response.data);
                        var notificationData = response.data;
                        createAlert(notificationData, notificationData.uri).then(function (alert)
                        {
                            return alert;
                        }).then(function (alert)
                        {
                            return drawAlert(alert);
                        }).then(function (data)
                        {
                            return getAlertsFromNgAlert();
                        }).then(function (data)
                        {
                            // $scope.$apply();
                        }).catch(function (error)
                        {
                            Utils.show_popup("error", "Notification error", "Error drawing a new notification");
                        });
                    })
                    .catch(function (error)
                    {
                        console.log("error", "Error getting Notification Info" + JSON.stringify(error));
                        Utils.show_popup("error", "Notification error", "Error getting a user's notification information");
                    });
            }
        };

        // END SCOPE FUNCTIONS
    });
