'use strict';

angular.module('dendroApp.services')
    .service('usersService',
        [   '$http',
            "$q",
            function ($http, $q) {

                this.get_logged_user = function()
                {
                    var requestUri = "/users/loggedUser";

                    var getUserPromise = $q.defer();

                    $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: "application/json",
                        headers: {'Accept': "application/json"}
                    }).then(
                        function (response)
                        {
                            if (response.data != null)
                            {
                                getUserPromise.resolve(response.data);
                            }
                            else
                            {
                                getUserPromise.reject("Invalid response format received from server");
                            }
                        }
                    ).catch(function (error)
                    {
                        getUserPromise.reject(error);
                    });

                    return getUserPromise.promise;
                };
            }]);
