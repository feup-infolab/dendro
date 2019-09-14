"use strict";

angular.module("dendroApp.services")
    .service("licensesService",
        ["$http", "$rootScope", "windowService", "Utils",
            function ($http, $rootScope, windowService, Utils)
            {
                this.get_licenses = function ()
                {
                    return $http({
                        method: "GET",
                        url: "/bower_components/okfn-licenses/licenses/groups/ckan.json"
                    }).then(function (response)
                    {
                        if (!Utils.isNull(response.data) && response.data instanceof Object)
                        {
                            return response.data;
                        }
                        return [];
                    }
                    );
                };
            }]);
