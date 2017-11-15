angular.module("dendroApp.controllers")
/*
     *  Window controller
     */
    .controller("windowCtrl", function (
        $scope,
        $http,
        $filter,
        $q,
        $log,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        storageService,
        licensesService,
        languagesService
    )
    {
        $scope.get_current_url = function ()
        {
            var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            return newURL;
        };

        $scope.get_host = function ()
        {
            var newURL = window.location.protocol + "//" + window.location.host;
            return newURL;
        };

        $scope.get_thumbnail_uri = function (uri)
        {
            return uri + "?thumbnail&size=icon";
        };

        $scope.get_filename_icon = function (filename)
        {
            var extension = filename.split(".").pop();
            return $scope.get_extension_icon(extension);
        };

        $scope.get_short_filename = function (filename, maxLength)
        {
            var length = filename.length;

            if (length > maxLength)
            {
                var trimmedFileName = filename.substring(0, maxLength);
                return trimmedFileName + "...";
            }
            return filename;
        };

        $scope.get_extension_icon = function (extension)
        {
            return "/images/icons/extensions/file_extension_" + extension + ".png";
        };

        $scope.get_last_section_of_url = function (url)
        {
            return url.substr(url.lastIndexOf("/") + 1);
        };

        $scope.show_popup = function (type, title, message, delay)
        {
            windowService.show_popup(type, title, message, delay);
        };

        $scope.valid_date = function (descriptor)
        {
            if (descriptor.value != null)
            {
                return windowService.valid_date(descriptor.value);
            }
            return false;
        };

        $scope.set_from_local_storage_and_then_from_value = function (key, value, targetObject, namespace)
        {
            var storedValue = storageService.load_from_local_storage(key, targetObject, namespace);

            if (key != null)
            {
                if (storedValue != null)
                {
                    if (targetObject != null)
                    {
                        if (namespace != null)
                        {
                            if (targetObject[namespace] != null && targetObject[namespace][key] == null)
                            {
                                targetObject[namespace][key] = value;
                            }
                            else if (targetObject[namespace] == null)
                            {
                                targetObject[namespace] = {};
                                targetObject[namespace][key] = value;
                            }
                        }
                        else
                        {
                            if (targetObject[key] == null)
                            {
                                targetObject[key] = value;
                            }
                        }
                    }
                    else
                    {
                        if (namespace != null)
                        {
                            if ($scope[namespace] != null && $scope[namespace][key] == null)
                            {
                                $scope[namespace][key] = value;
                            }
                            else if ($scope[namespace] == null)
                            {
                                $scope[namespace] = {};
                                $scope[namespace][key] = value;
                            }
                        }
                        else
                        {
                            $scope[key] = storedValue;
                        }
                    }
                }
                else
                {
                    if (namespace != null)
                    {
                        if ($scope[namespace] == null)
                        {
                            $scope[namespace] = {};
                        }

                        $scope[namespace][key] = value;
                    }
                    else
                    {
                        $scope[key] = value;
                    }
                }
            }
        };

        $scope.valid_word = function (word)
        {
            if (word == null || word.length == 0)
            {
                return false;
            }
            var regexp = /^[0-9a-z]+$/;
            return regexp.test(word);
        };

        $scope.valid_int = function (int)
        {
            if (!int || int === "")
            {
                return false;
            }

            try
            {
                parseInt(int);
            }
            catch (e)
            {
                return false;
            }

            return true;
        };

        $scope.load_licenses = function ()
        {
            var deferred = $q.defer();

            licensesService.get_licenses()
                .then(function (licenses)
                {
                    $scope.licenses = [];
                    var keys = Object.keys(licenses);
                    for (var i = 0; i < keys.length; i++)
                    {
                        $scope.licenses.push(licenses[keys[i]]);
                    }

                    deferred.resolve($scope.licenses);
                });

            return deferred.promise;
        };

        $scope.load_languages = function ()
        {
            var deferred = $q.defer();

            languagesService.get_languages()
                .then(function (languages)
                {
                    $scope.languages = [];
                    var keys = Object.keys(languages);
                    for (var i = 0; i < keys.length; i++)
                    {
                        $scope.languages.push(languages[keys[i]]);
                    }

                    deferred.resolve($scope.languages);
                });

            return deferred.promise;
        };

        $scope.get_descriptor_by_prefixed_form = function (descriptorsArray, prefixedForm)
        {
            var descriptor = _.find(descriptorsArray, function (descriptor)
            {
                return descriptor.prefixedForm === prefixedForm;
            });

            if (!descriptor)
            {
                return null;
            } return descriptor.value;
        };
    });
