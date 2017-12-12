angular.module("dendroApp.services")
    .service("dendroConfigurationService", ["$http", function ($http)
    {
        this.getConfiguration = function (current_resource_uri, typed)
        {
            if (typeof typed !== "undefined")
            {
                return $http({
                    method: "GET",
                    params: {
                        descriptor_autocomplete: typed
                    },
                    url: current_resource_uri,
                    responseType: "json",
                    headers: {Accept: "application/json"}
                })
                    .then(function (response)
                    {
                        return response.data.map(function (item)
                        {
                            return item;
                        });
                    })
                    .catch(function (error)
                    {
                        console.log("error", error);
                        throw error;
                    });
            }
        };
    }]);
