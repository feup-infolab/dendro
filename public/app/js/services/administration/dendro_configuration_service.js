angular.module("dendroApp.services")
    .service("dendroConfigurationService", ["$http", function ($http)
    {
        this.saveConfiguration = function (configuration)
        {
            return $http({
                method: "POST",
                url: "/admin/config",
                data: configuration,
                responseType: "json",
                headers: {Accept: "application/json"}
            })
                .then(function (response)
                {
                    return response.data;
                })
                .catch(function (error)
                {
                    console.log("error", error);
                    throw error;
                });
        };

        this.getConfiguration = function ()
        {
            return $http({
                method: "GET",
                url: "/admin/config",
                responseType: "json",
                headers: {Accept: "application/json"}
            })
                .then(function (response)
                {
                    return response.data;
                })
                .catch(function (error)
                {
                    console.log("error", error);
                    throw error;
                });
        };

        this.getLogs = function (nLines)
        {
            return $http({
                method: "GET",
                url: "/admin/logs",
                params: {lines: nLines},
                responseType: "json",
                headers: {Accept: "application/json"}
            })
                .then(function (response)
                {
                    return response.data;
                })
                .catch(function (error)
                {
                    console.log("error", error);
                    throw error;
                });
        };

        this.restartServer = function ()
        {
            return $http({
                method: "POST",
                url: "/admin/restart",
                responseType: "json",
                headers: {Accept: "application/json"}
            })
                .then(function (response)
                {
                    return response.data;
                })
                .catch(function (error)
                {
                    console.log("error", error);
                    throw error;
                });
        };
    }]);
