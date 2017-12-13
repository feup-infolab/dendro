angular.module("dendroApp.services")
    .service("dendroConfigurationService", ["$http", function ($http)
    {
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
    }]);
