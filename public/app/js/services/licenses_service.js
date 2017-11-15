"use strict";

angular.module("dendroApp.services")
    .service("licensesService",
        ["$http", "$rootScope", "windowService",
            function ($http, $rootScope, windowService)
            {
                this.get_licenses = function ()
                {
                    return $http({
                        method: "GET",
                        url: "/bower_components/okfn-licenses/licenses/groups/ckan.json"
                    }).then(function (response)
                    {
                        if (response.data != null && response.data instanceof Object)
                        {
                            return response.data;
                        }
                        return [];
                    }
                    );
                };
            }]);
