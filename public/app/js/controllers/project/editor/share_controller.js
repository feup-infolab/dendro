angular.module("dendroApp.controllers")

/**
     * share folder controller
     */
    .controller("shareCtrl",
        function (
            $scope,
            $http,
            $filter,
            windowService,
            usersService
        )
        {
            $scope.init = function ()
            {
                usersService.get_logged_user()
                    .then(function (user)
                    {
                        $scope.loggedUser = user;
                    })
                    .catch(function (error)
                    {
                        $scope.show_popup("error", error, "Error fetching user", 20000);
                    });
            };

            $scope.get_current_url = function ()
            {
                var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                return newURL;
            };

            $scope.calculateCkanRepositoryDiffs = function (targetRepository)
            {
                var payload = {
                    repository: targetRepository,
                    new_dataset: $scope.new_dataset
                };

                var requestString = JSON.stringify(payload);

                var url = $scope.get_calling_uri() + "?calculate_ckan_repository_diffs";

                $scope.show_popup("info", "Notice", "Calculating diffs with target repository");
                $scope.is_sending_data = true;
                $scope.firstExportToCkan = false;
                $http({
                    method: "POST",
                    url: url,
                    data: requestString,
                    contentType: "application/json",
                    headers: {Accept: "application/json"}
                }).then(function (response)
                {
                    var data = response.data;
                    $scope.is_sending_data = false;
                    if (typeof data === "string")
                    {
                        if (data === "Package was not previously exported")
                        {
                            $scope.firstExportToCkan = true;
                            $scope.show_popup("info", data, "You can now export the resource", 20000);
                        }
                        else
                        {
                            $scope.show_popup("error", data, "Invalid data message", 20000);
                        }
                    }
                    else if (data instanceof Object)
                    {
                        $scope.needsDendroPermissions = data.dendroDiffs;
                        $scope.needsCkanPermissions = data.ckanDiffs;
                        if (!$scope.needsCkanPermissions && !$scope.needsDendroPermissions || $scope.needsCkanPermissions.length === 0 && $scope.needsDendroPermissions.length === 0)
                        {
                            $scope.show_popup("info", "No files added/deleted on Dendro or Ckan", "HOWEVER!! if the content of a file was updated in Dendro tick the OVERWRITE option.", 20000);
                        }
                        else
                        {
                            if ($scope.needsCkanPermissions && $scope.needsCkanPermissions.length > 0)
                            {
                                $scope.show_popup("warning", "Ckan diffs", "There were changes made to the package on the Ckan repository. To export again from dendro tick the boxes bellow. Note that changes made on the Ckan side could be lost if the same resources were worked on Dendro.", 60000);
                            }
                            if ($scope.needsDendroPermissions && $scope.needsDendroPermissions.length > 0)
                            {
                                $scope.show_popup("warning", "Dendro diffs", "There were files added or deleted in the package via Dendro. To export again from Dendro tick the boxes bellow. Note that if files were added or deleted in Dendro it will also be deleted or added in Ckan.", 60000);
                            }
                        }
                    }
                    else
                    {
                        $scope.show_popup("error", data, "Invalid data type", 20000);
                    }
                }).catch(function (error)
                {
                    if (error.data !== null && error.data.message !== null)
                    {
                        $scope.show_popup("error", error.data.title, error.data.message);
                    }
                    else
                    {
                        $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                    }
                    $scope.is_sending_data = false;
                });
            };

            $scope.datepickerOptions = {
                "close-on-date-selection": true
            };

            $scope.statusCodeDefaults = {
                404: function (e, data)
                {
                    $scope.show_popup("info", "Notice", e.responseJSON.message);
                },
                500: function (e, data)
                {
                    $scope.show_popup("error", "error", e.responseJSON.message);
                },
                401: function (e, data)
                {
                    $scope.show_popup("error", "Unauthorized", e.responseJSON.message);
                },
                400: function (e, data)
                {
                    $scope.show_popup("error", "Invalid Request", e.responseJSON.message);
                }
            };

            $scope.setSpinner = function (spinnerName, value)
            {
                if ($scope.spinners === null)
                {
                    $scope.spinners = {};
                }

                $scope.spinners[spinnerName] = value;
            };

            $scope.spinnerActive = function (spinnerName)
            {
                return $scope.spinners[spinnerName];
            };

            $scope.valid_url = function (url)
            {
                var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                return regexp.test(url);
            };

            $scope.valid_base_address = function (baseAddress)
            {
                return baseAddress !== null && $scope.valid_url(baseAddress) && !baseAddress.endsWith("/");
            };

            $scope.valid_api_key = function (key)
            {
                if (key === null || !key)
                {
                    return false;
                }
                var regexp = /^[a-zA-Z0-9-_]+$/;

                if (key.search(regexp) === -1)
                {
                    return false;
                }
                return true;
            };

            $scope.valid_organization = function (organization)
            {
                if (!organization || organization === null || organization.length === 0)
                {
                    return false;
                }
                var regexp = /[a-zA-Z0-9-]+$/;
                return regexp.test(organization);
            };

            $scope.create_new_repository_bookmark = function (newRepository)
            {
                if (newRepository.ddr === null)
                {
                    newRepository.ddr = {};
                }
                newRepository.ddr.hasPlatform = $scope.new_repository_type;

                var url = window.location.pathname;

                let shared = $scope.shared;

                let selectedUri = [];

                for (index in shared.folder_contents)
                {
                    if (shared.folder_contents[index].selected) selectedUri.push(shared.folder_contents[index].uri);
                }

                if (selectedUri.length === 0) selectedUri.push(url);

                newRepository.ddr.exportedResource = selectedUri;
                newRepository.ddr.exportedFromFolder = url;

                var requestPayload = JSON.stringify(newRepository);

                $.ajax({
                    type: "POST",
                    url: "/external_repositories/new",
                    data: requestPayload,
                    contentType: "application/json",
                    beforeSend: function (xhr)
                    {
                        xhr.setRequestHeader("Accept", "application/json");
                    },
                    success: function (e, data)
                    {
                        $scope.clear_repository_type();
                        // $scope.get_my_repositories();
                        $scope.show_popup("success", "Success", e.message);
                    },
                    statusCode: $scope.statusCodeDefaults
                });
            };

            $scope.create_new_repository_bookmark_dendro_local = function (newRepository)
            {
                if (newRepository.ddr === null || !newRepository.ddr)
                {
                    newRepository.ddr = {};
                }
                newRepository.ddr.hasPlatform = $scope.new_repository_type;
                var url = window.location.pathname;
                newRepository.ddr.exportedFromFolder = url;
                var requestPayload = JSON.stringify(newRepository);

                $.ajax({
                    type: "POST",
                    url: "/external_repositories/new",
                    data: requestPayload,
                    contentType: "application/json",
                    beforeSend: function (xhr)
                    {
                        xhr.setRequestHeader("Accept", "application/json");
                    },
                    success: function (e, data)
                    {
                        $scope.clear_repository_type();
                        // $scope.get_my_repositories();
                        $scope.show_popup("success", "Success", e.message);
                    },
                    statusCode: $scope.statusCodeDefaults
                });
            };

            $scope.clear_repository_type = function ()
            {
                delete $scope.new_repository_type;
                $scope.clear_sword_data();
            };

            $scope.disable_save_bookmark_dendro = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                return false;
            };

            $scope.disable_send_bookmark_dendro = function (title, obj, date)
            {
                let one = false;
                let index;

                if (!title)
                {
                    return true;
                }

                for (let key in obj)
                {
                    if (obj[key] === true)
                    {
                        one = true;
                        index = key;
                    }
                }

                if (index === "1" && one && date)
                {
                    const dateNow = new Date();
                    if (dateNow > date)
                    {
                        return true;
                    }
                    return false;
                }

                if (index !== "1" && one)
                {
                    return false;
                }
                return true;
            };

            $scope.disable_save_bookmark_b2share = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                if (newRepository.ddr.hasAccessToken === "" || !newRepository.ddr.hasAccessToken)
                {
                    return true;
                }
                return false;
            };

            $scope.disable_save_bookmark_zenodo = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                if (newRepository.ddr.hasAccessToken === "" || !newRepository.ddr.hasAccessToken)
                {
                    return true;
                }
                return false;
            };

            $scope.disable_save_bookmark_figshare = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                if (!newRepository.ddr.hasConsumerKey)
                {
                    return true;
                }
                if (newRepository.ddr.hasAccessToken === "" || !newRepository.ddr.hasAccessToken)
                {
                    return true;
                }
                if (newRepository.ddr.hasAccessTokenSecret === "" || !newRepository.ddr.hasAccessTokenSecret)
                {
                    return true;
                }
                return false;
            };

            $scope.disable_save_bookmark_eprints = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                if (!newRepository.ddr || !$scope.valid_url(newRepository.ddr.hasExternalUri))
                {
                    return true;
                }
                return false;
            };

            $scope.disable_save_bookmark_dspace = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                if (!newRepository.ddr || !$scope.valid_url(newRepository.ddr.hasExternalUri))
                {
                    return true;
                }
                if (!newRepository.ddr.username)
                {
                    return true;
                }
                if (!newRepository.ddr.password || newRepository.ddr.password === "")
                {
                    return true;
                }
                return false;
            };

            $scope.disable_save_bookmark_ckan = function (newRepository)
            {
                if (!newRepository || !newRepository.dcterms || !newRepository.dcterms.title)
                {
                    return true;
                }
                if (!newRepository.ddr || !$scope.valid_url(newRepository.ddr.hasExternalUri))
                {
                    return true;
                }
                if (!newRepository.ddr.username)
                {
                    return true;
                }
                if (!newRepository.ddr.hasOrganization)
                {
                    return true;
                }
                if (!newRepository.ddr.hasAPIKey)
                {
                    return true;
                }
                return false;
            };

            $scope.clear_recalled_repository = function ()
            {
                delete $scope.recalled_repository;
                $scope.clear_sword_data();
            };

            $scope.select_repository_type = function (newRepositoryType)
            {
                $scope.new_repository_type = newRepositoryType;
                delete $scope.recalled_repository;
                $scope.clear_sword_data();
            };

            $scope.recall_repository = function (myRepository)
            {
                $scope.recalled_repository = myRepository;
                if ($scope.recalled_repository.ddr.hasPlatform.foaf.nick === "ckan")
                {
                    $scope.calculateCkanRepositoryDiffs($scope.recalled_repository);
                }
                delete $scope.new_repository_type;
                $scope.clear_sword_data();
            };

            $scope.clear_all_bookmarks = function ()
            {
                bootbox.confirm("Are you sure you want to delete ALL your bookmarks?", function (confirmed)
                {
                    if (confirmed)
                    {
                        for (var i = 0; i < $scope.my_repositories.length; i++)
                        {
                            $scope.delete_bookmark($scope.my_repositories[i], false);
                        }

                        setTimeout(function ()
                        {
                            $scope.get_my_repositories();
                        }, 1000);
                    }
                });
            };

            $scope.delete_bookmark = function (bookmark, confirmDelete)
            {
                var doDeletion = function (bookmark)
                {
                    $.ajax({
                        type: "DELETE",
                        url: bookmark.uri,
                        contentType: "application/json",
                        beforeSend: function (xhr)
                        {
                            xhr.setRequestHeader("Accept", "application/json");
                        },
                        success: function (e, data)
                        {
                            setTimeout(function ()
                            {
                                $scope.get_my_repositories();
                            }, 1000);

                            $scope.show_popup("success", "Success", e.message);
                            $scope.clear_recalled_repository();
                        },
                        statusCode: $scope.statusCodeDefaults
                    });
                };

                if (confirmDelete)
                {
                    bootbox.confirm("Are you sure you want to delete the bookmark " + bookmark.dcterms.title + " ?", function (confirmed)
                    {
                        if (confirmed)
                        {
                            doDeletion(bookmark);
                        }
                    });
                }
                else
                {
                    doDeletion(bookmark);
                }
            };
            $scope.change_checkbox = function (array, length, index)
            {
                for (let i = 0; i < length; i++)
                {
                    if (i !== index)
                    {
                        array[i] = false;
                    }
                    else
                    {
                        array[i] = true;
                    }
                }
            };

            /**
         * Project stats
         * @param uri
         */
            $scope.upload_to_repository = function (targetRepository, publicDeposit, titleOfDeposit, embargoedDate, accessTerms, userAffiliation, overwrite, deleteChangesOriginatedFromCkan, propagateDendroChangesIntoCkan)
            {
                var payload = {
                    repository: targetRepository,
                    new_dataset: $scope.new_dataset,
                    titleOfDeposit: titleOfDeposit
                };

                if (typeof publicDeposit === "object")
                {
                    for (let key in publicDeposit)
                    {
                        if (publicDeposit[key] === true)
                        {
                            switch (key)
                            {
                            case "0":
                                payload.publicDeposit = "public";
                                break;
                            case "1":
                                payload.publicDeposit = "embargoed";
                                payload.embargoed_date = embargoedDate;
                                break;
                            case "2":
                                payload.publicDeposit = "private";
                                break;
                            default:
                                payload.publicDeposit = "metadata_only";
                                break;
                            }
                        }
                    }
                }
                else
                {
                    if (!publicDeposit || publicDeposit === false)
                    {
                        payload.publicDeposit = "private";
                    }
                    else
                    {
                        payload.publicDeposit = "public";
                    }
                }
                if (accessTerms)
                {
                    payload.accessTerms = accessTerms;
                }
                if (userAffiliation)
                {
                    payload.userAffiliation = userAffiliation;
                }

                if (overwrite)
                {
                    payload.overwrite = overwrite;
                }

                if (deleteChangesOriginatedFromCkan)
                {
                    payload.deleteChangesOriginatedFromCkan = deleteChangesOriginatedFromCkan;
                }

                if (propagateDendroChangesIntoCkan)
                {
                    payload.propagateDendroChangesIntoCkan = propagateDendroChangesIntoCkan;
                }
                payload.protocolAndHost = windowService.get_protocol_and_host();

                var requestString = JSON.stringify(payload);

                var url = $scope.get_calling_uri() + "?export_to_repository";

                $scope.show_popup("info", "Notice", "Exporting data to target repository");
                $scope.is_sending_data = true;

                $http({
                    method: "POST",
                    url: url,
                    data: requestString,
                    contentType: "application/json",
                    headers: {Accept: "application/json"}
                }).then(function (response)
                {
                    var data = response.data;

                    if (data !== null)
                    {
                        if (data.result === "error")
                        {
                            if (data.message !== null)
                            {
                                $scope.show_popup("error", "Error", data.message);
                            }
                            else
                            {
                                $scope.show_popup("error", "Error", "Unknown error occurred.");
                            }
                        }
                        else
                        {
                            if (data.message !== null)
                            {
                                $scope.show_popup("success", "Success", data.message);
                            }
                            else
                            {
                                $scope.show_popup("success", "Success", "Operation completed successfully.");
                            }
                        }
                    }
                    else
                    {
                        $scope.show_popup("error", "Connection lost", "Connection lost during dataset deposit. Please try again.");
                    }
                    $scope.is_sending_data = false;

                    $scope.clear_recalled_repository();
                }).catch(function (error)
                {
                    if (error.data !== null && error.data.message !== null)
                    {
                        if (error.data.message.indexOf("ckanDiffs") !== -1)
                        {
                            $scope.show_popup("error", "Ckan export error", "If you want to export to Ckan again you have to tick the boxes bellow. Note that the changes made on the Ckan side may be lost if they overlap with the ones made on Dendro", 5000);
                        }
                        else if (error.data.message.indexOf("dendroDiffs") !== -1)
                        {
                            $scope.show_popup("error", "Ckan export error", "If you want to export to Ckan again you have to tick the boxes bellow. Note that if files were added or deleted on Dendro the same will happen in Ckan", 5000);
                        }
                        else
                        {
                            $scope.show_popup("error", error.data.title, error.data.message);
                        }
                    }
                    else
                    {
                        $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                    }
                    $scope.is_sending_data = false;
                });
            };

            $scope.get_my_repositories = function ()
            {
                $.ajax({
                    type: "GET",
                    url: "/external_repositories/my",
                    contentType: "application/json",
                    beforeSend: function (xhr)
                    {
                        xhr.setRequestHeader("Accept", "application/json");
                    },
                    success: function (e, data)
                    {
                        $scope.my_repositories = e;
                    },
                    statusCode: $scope.statusCodeDefaults
                });
            };

            $scope.get_repository_types = function ()
            {
                $.ajax({
                    type: "GET",
                    url: "/external_repositories/types",
                    contentType: "application/json",
                    beforeSend: function (xhr)
                    {
                        xhr.setRequestHeader("Accept", "application/json");
                    },
                    success: function (e, data)
                    {
                        $scope.repository_types = e;
                    },
                    statusCode: $scope.statusCodeDefaults
                });
            };

            $scope.get_sword_workspaces = function (nick, newRepository)
            {
                $scope.clear_sword_data();
                newRepository.ddr.hasPlatform = {};
                newRepository.ddr.hasPlatform.foaf = {nick: nick};

                var payload = {
                    repository: newRepository
                };

                var requestString = JSON.stringify(payload);
                $scope.show_popup("info", "Notice", "Accessing workspaces and collections of target repository");
                $http({
                    method: "POST",
                    url: "/external_repositories/swordCollections",
                    data: requestString
                }).then(function (response)
                {
                    var data = response.data;
                    if (data.result === "error" && data.message !== null)
                    {
                        $scope.show_popup("error", "Error", data.message);
                    }
                    else
                    {
                        var nCollections = 0;
                        for (var workspace in data)
                        {
                            if (data[workspace].collections !== null)
                            {
                                nCollections += data[workspace].collections.length;
                            }
                        }

                        if (nCollections === 0)
                        {
                            $scope.show_popup("info", "Notice", "There are no collections available in this repository");
                        }
                        else
                        {
                            $scope.sword_workspaces = data;
                        }
                    }
                }).catch(function (error)
                {
                    if (error.data !== null && error.data.message !== null)
                    {
                        $scope.show_popup("error", error.data.title, error.data.message);
                    }
                    else
                    {
                        $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                    }
                });
            };
            $scope.set_swordCollections = function (swordCollections)
            {
                $scope.swordCollections = swordCollections;
            };
            $scope.clear_sword_data = function ()
            {
                delete $scope.swordCollections;
                delete $scope.sword_workspaces;
            };

            $scope.get_title_of_file_selected = function ()
            {
                let title = $scope.shared.selected_file.dcterms.title;

                if (title)
                {
                    $scope.title_of_file_selected_disabled = true;

                    $scope.title_of_file_selected = title;
                }
                else
                {
                    $scope.title_of_file_selected_disabled = false;
                    $scope.title_of_file_selected = null;
                }
            };
            $scope.get_my_repositories();
            $scope.get_repository_types();
            $scope.new_dataset = {};
            $scope.is_sending_data = false;
            $scope.overwrite = false;
        });
