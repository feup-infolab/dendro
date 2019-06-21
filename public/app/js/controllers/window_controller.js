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
        languagesService,
        usersService
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
            if (!Utils.isNull(descriptor.value) && descriptor.value instanceof Object)
            {
                var numberOfDates = Object.keys(descriptor.value).length;
                for (var i = 0; i !== numberOfDates; i++)
                {
                    var result = windowService.valid_date(descriptor.value[i]);
                    if (result === false)
                    {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

        $scope.save_to_local_storage = function (key, value, namespace)
        {
            storageService.save_to_local_storage(key, value, namespace);
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

        $scope.runningOnSmartphone = function ()
        {
            var check = false;
            (function (a)
            {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };

        $scope.runningOnSmartphoneOrTablet = function ()
        {
            var check = false;
            (function (a)
            {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };
    });
