/**
 * Created by Filipe on 01/09/2014.
 */
angular.module("dendroApp.factories")
    .factory("listings", function ($http)
    {
        return {
            getListing: function ($scope, uri, limit, page, filters, change, callback)
            {
                $scope.fetching_data = true;
                if (filters)
                {
                    let params = this.parseParams(filters);
                    params.new_listing = change;
                    params.limit = limit;
                    params.offset = page;
                    $http({
                        method: "GET",
                        url: uri,
                        params: params,
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                    {
                        if (!Utils.isNull(response.data))
                        {
                            $scope.fetching_data = false;
                            callback(response.data, change);
                        }
                    }).catch(function (error)
                    {
                        $scope.fetching_data = false;
                        if (!Utils.isNull(error))
                        {
                            $scope.show_popup("error", "Error", error.message);
                        }
                    });
                }
            },
            parseParams: function (params)
            {
                let search = {};
                var descriptors = [];
                for (var item in params)
                {
                    if (!Utils.isNull(params[item].value) && params[item].value !== "" && params[item].key !== "descriptor")
                    {
                        if (params[item].type === "dropdown" && params[item].hasKey === true)
                        {
                            var array = params[item].value;
                            array.forEach(function (value)
                            {
                                if (value.name === params[item].selected)
                                {
                                    search[params[item].key] = value.key;
                                }
                            });
                        }
                        else if (params[item].type === "dropdown")
                        {
                            search[params[item].key] = params[item].selected;
                        }
                        else
                        {
                            search[params[item].key] = params[item].value;
                        }
                    }
                    else if (params[item].key === "descriptor")
                    {
                        descriptors.push(params[item]);
                    }
                }
                search.descriptors = descriptors;
                return search;
            }
        };
    });
