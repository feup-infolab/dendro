"use strict";

angular.module("dendroApp.services")
    .service("depositsService",
        ["$q", "$http", "windowService", "$location",
            function ($q, $http, windowService, $location)
            {
                this.get_deposit_conditions = function (depositUri)
                {
                    var deferred = $q.defer();

                    var payload = JSON.stringify({});

                    var URL = depositUri;
                    URL += "?get_deposit_conditions";

                    $http({
                        method: "GET",
                        url: URL,
                        data: payload,
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                    {
                        deferred.resolve(response.data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };
                this.change_user_access = function (condition, value, forDelete)
                {
                    var deferred = $q.defer();

                    var URL = windowService.get_current_url();
                    var payload = JSON.stringify({condition: condition, value: value, forDelete: forDelete});

                    URL += "?change_user_access";

                    $http({
                        method: "POST",
                        url: URL,
                        data: payload,
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                    {
                        deferred.resolve(response.data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };
            }]);
