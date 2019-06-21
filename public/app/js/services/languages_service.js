"use strict";

angular.module("dendroApp.services")
    .service("languagesService",
        ["$http", "$rootScope", "windowService",
            function ($http, $rootScope, windowService)
            {
                this.get_languages = function ()
                {
                    return $http({
                        method: "GET",
                        url: "/shared/data/languages.json"
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
