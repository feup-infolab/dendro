'use strict';

angular.module('dendroApp.services')
    .service('usersService',
        [ '$http',
            '$q',
            function ($http, $q)
            {
                this.get_logged_user = function ()
                {
                    var requestUri = '/users/loggedUser';

                    var getUserPromise = $q.defer();

                    $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(
                        function (response)
                        {
                            if (response.data != null)
                            {
                                getUserPromise.resolve(response.data);
                            }
                            else
                            {
                                getUserPromise.reject('Invalid response format received from server');
                            }
                        }
                    ).catch(function (error)
                    {
                        getUserPromise.reject(error);
                    });

                    return getUserPromise.promise;
                };

                this.get_users_by_text_search = function (current_resource_uri, typed)
                {
                    if (typeof typed !== 'undefined')
                    {
                        return $http({
                            method: 'GET',
                            params: {
                                user_autocomplete: typed
                            },
                            url: current_resource_uri,
                            responseType: 'json'
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
                                console.error('Unable to fetch autocompleted descriptors. Query was: ' + typed + ' Error : ' + JSON.stringify(error));
                                $scope.autocompleted_descriptors = [];
                            });
                    }
                };

                this.updateAvatar = function (newAvatarPicture)
                {
                    var requestUri = '/user_avatar';

                    var params = {
                        newAvatar: newAvatarPicture
                    };

                    return $http({
                        method: 'POST',
                        url: requestUri,
                        data: params,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                        // contentType: "data:image/png;base64",
                        // headers: {"Accept": "data:image/png;base64"}
                    });
                };

                this.receiveAvatar = function (username)
                {
                    var requestUri = '/user/' + username + '?avatar';

                    return $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    });
                };

                this.getUserInfo = function (userUri)
                {
                    var requestUri = userUri;

                    return $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    });
                };
            }]);
