angular.module('dendroApp.controllers')
    /*
     *  Window controller
     */
    .controller('windowCtrl', function (
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
        storageService
    )
{
    $scope.get_current_url = function()
    {
        var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
        return newURL;
    };

    $scope.get_host = function()
    {
        var newURL = window.location.protocol + "//" + window.location.host;
        return newURL;
    }

    $scope.get_thumbnail_uri = function(uri)
    {
        return uri+'?thumbnail&size=icon';
    };

    $scope.get_filename_icon = function(filename)
    {
        var extension = filename.split('.').pop();
        console.log(extension);
        return $scope.get_extension_icon(extension);
    };

    $scope.get_extension_icon = function(extension)
    {
        return "/images/icons/extensions/file_extension_"+extension+".png";
    };

    $scope.get_last_section_of_url = function(url)
    {
        return url.substr(url.lastIndexOf('/') + 1);
    };

    $scope.show_popup = function(type, title, message)
    {
        windowService.show_popup(type,title,message);
    };

    $scope.valid_date = function(descriptor)
    {
        if(descriptor.value != null)
        {
            return windowService.valid_date(descriptor.value);
        }
        else
        {
            return false;
        }
    };

    $scope.set_from_local_storage_and_then_from_value = function(key, value, targetObject, namespace)
    {
        var storedValue = storageService.load_from_local_storage(key, targetObject, namespace);

        if(key != null)
        {
            if(storedValue != null)
            {
                if(targetObject != null)
                {
                    if(namespace != null)
                    {
                        if(targetObject[namespace] != null && targetObject[namespace][key] == null)
                        {
                            targetObject[namespace][key] = value;
                        }
                        else if(targetObject[namespace] == null)
                        {
                            targetObject[namespace] = {};
                            targetObject[namespace][key] = value;
                        }
                    }
                    else
                    {
                        if(targetObject[key] == null)
                        {
                            targetObject[key] = value;
                        }
                    }
                }
                else
                {
                    if(namespace != null)
                    {
                        if($scope[namespace] != null && $scope[namespace][key] == null)
                        {
                            $scope[namespace][key] = value;
                        }
                        else if($scope[namespace] == null)
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
                if(namespace != null)
                {
                    if($scope[namespace] == null)
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

    $scope.valid_word = function(word) {
        if(word == null || word.length == 0)
        {
            return false;
        }
        else
        {
            var regexp = /^[0-9a-z]+$/;
            return regexp.test(word);
        }

    }

});