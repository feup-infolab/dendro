"use strict";

angular.module("dendroApp.services")
    .service("metricsService",
        ["$http", "$rootScope", "windowService",
            function ($http, $rootScope, windowService)
            {
                this.get_stats = function (uri)
                {
                    if (uri == null)
                    {
                        uri = windowService.get_current_url() + "?stats";
                    }
                    else
                    {
                        uri = uri + "?stats";
                    }

                    return $http({
                        method: "GET",
                        url: uri,
                        data: JSON.stringify({}),
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                        {
                            if (response.data != null && response.data instanceof Object)
                            {
                                return response;
                            }
                            return {};
                        }
                    );
                };

                this.get_deposits = function (uri)
                {
                    let url = $scope.get_current_url();
                    url += "deposits/latest";
                    const params = $scope.projectfilter;

                    return $http({
                        method: "GET",
                        url: url,
                        params: params,
                        contentType: "application/json",
                        headers: {"Accept": "application/json"}
                    }).then(function (response)
                        {
                            if (response.data != null && response.data instanceof Object)
                            {
                                return response;
                            }
                            return {};
                        }
                    );
                };


            }]);
