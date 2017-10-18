angular.module('dendroApp.controllers')

    /**
     * share folder controller
     */
    .controller('shareCtrl',
        function (
            $scope,
            $http,
            $filter
        )
        {

        $scope.get_current_url = function()
        {
            var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            return newURL;
        };

        $scope.calculateCkanRepositoryDiffs = function (target_repository) {
            var payload = {
                repository : target_repository,
                new_dataset : $scope.new_dataset
            };

            var requestString = JSON.stringify(payload);

            var url = $scope.get_calling_uri() + "?calculate_ckan_repository_diffs";

            $scope.show_popup("info", "Notice", "Calculating diffs with target repository");
            $scope.is_sending_data = true;

            $http({
                method: "POST",
                url: url,
                data: requestString,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            }).then(function(response) {
                var data = response.data;
                $scope.is_sending_data = false;
                if(typeof data === "string")
                {
                    if(data === "Package was not previously exported")
                    {
                        $scope.show_popup("info", data, "You can now export the resource", 20000);
                    }
                    else
                    {
                        $scope.show_popup("error", data, "Invalid data message", 20000);
                    }
                }
                else if(data instanceof Object)
                {
                    $scope.needsDendroPermissions = data.dendroDiffs;
                    $scope.needsCkanPermissions = data.ckanDiffs;
                    if(!$scope.needsCkanPermissions &&  !$scope.needsDendroPermissions || $scope.needsCkanPermissions.length === 0 &&  $scope.needsDendroPermissions.length === 0)
                    {
                        $scope.show_popup("info", "No differences detected", "You can now export the resource", 20000);
                    }
                    else
                    {
                        if($scope.needsCkanPermissions && $scope.needsCkanPermissions.length > 0)
                        {
                            $scope.show_popup("warning", "Ckan diffs", "There were changes made to the package on the Ckan repository. To export again from dendro tick the boxes bellow. Note that changes made on the Ckan side will be lost.", 60000);
                        }
                        if($scope.needsDendroPermissions && $scope.needsDendroPermissions.length > 0)
                        {
                            $scope.show_popup("warning", "Dendro diffs", "There were changes made to the package on Dendro. To export again from Dendro tick the boxes bellow. Note that if files were added or deleted in Dendro it will also be deleted or added in Ckan.", 60000);
                        }
                    }
                }
                else
                {
                    $scope.show_popup("error", data, "Invalid data type", 20000);
                }
            }).catch(function(error){
                if(error.data != null && error.data.message != null)
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
            "close-on-date-selection" : true
        };

        $scope.statusCodeDefaults = {
            404: function (e, data) {
                $scope.show_popup("info", "Notice", e.responseJSON.message);
            },
            500 : function(e, data)
            {
                $scope.show_popup("error", "error", e.responseJSON.message);
            },
            401: function (e, data) {
                $scope.show_popup("error", "Unauthorized", e.responseJSON.message);
            },
            400: function (e, data) {
                $scope.show_popup("error", "Invalid Request", e.responseJSON.message);
            }
        };

        $scope.setSpinner = function(spinnerName, value)
        {
            if($scope.spinners == null)
            {
                $scope.spinners = {};
            }

            $scope.spinners[spinnerName] = value;
        };

        $scope.spinnerActive = function(spinnerName)
        {
            return $scope.spinners[spinnerName];
        };

        $scope.valid_url = function(url)
        {
            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            return regexp.test(url);
        };

        $scope.valid_base_address = function(baseAddress)
        {
            return baseAddress != null && $scope.valid_url(baseAddress) && !baseAddress.endsWith("/");
        }


        $scope.valid_api_key = function(key)
        {
            if(key == null)
            {
                return false;
            }
            else
            {
                var regexp = /^[a-zA-Z0-9-_]+$/;

                if (key.search(regexp) == -1)
                {
                    return false;
                }
                else
                {
                    return true
                }
            }
        }

        $scope.valid_organization = function(organization)
        {
            if(organization == null || organization.length == 0)
            {
                return false;
            }
            else
            {
                var regexp = /[a-zA-Z0-9-]+$/;
                return regexp.test(organization);
            }
        };

        $scope.create_new_repository_bookmark = function(new_repository)
        {
            if(new_repository.ddr == null)
            {
                new_repository.ddr = {};
            }
            new_repository.ddr.hasPlatform = $scope.new_repository_type;

            var requestPayload = JSON.stringify(new_repository);

            $.ajax({
                type: "POST",
                url: "/external_repositories/new",
                data: requestPayload,
                contentType : "application/json",
                beforeSend: function (xhr)
                {
                    xhr.setRequestHeader("Accept", "application/json");
                },
                success: function (e, data) {
                    $scope.clear_repository_type();
                    //$scope.get_my_repositories();
                    $scope.show_popup("success", "Success", e.message);
                },
                statusCode: $scope.statusCodeDefaults
            });
        };

        $scope.clear_repository_type = function()
        {
            delete $scope.new_repository_type;
            $scope.clear_sword_data();
        };

        $scope.clear_recalled_repository = function()
        {
            delete $scope.recalled_repository;
            $scope.clear_sword_data();
        };

        $scope.select_repository_type = function(new_repository_type)
        {
            $scope.new_repository_type = new_repository_type;
            delete $scope.recalled_repository;
            $scope.clear_sword_data();
        };

        $scope.recall_repository = function(my_repository)
        {
            $scope.recalled_repository = my_repository;
            delete $scope.new_repository_type;
            $scope.clear_sword_data();
        };

        $scope.clear_all_bookmarks = function()
        {
            bootbox.confirm("Are you sure you want to delete ALL your bookmarks?", function(confirmed) {
                if (confirmed) {
                    for(var i = 0; i < $scope.my_repositories.length; i++)
                    {
                        $scope.delete_bookmark($scope.my_repositories[i], false);
                    }

                    setTimeout(function(){
                        $scope.get_my_repositories();
                    }, 1000);
                }
            });
        };

        $scope.delete_bookmark = function(bookmark, confirmDelete)
        {
            var doDeletion = function(bookmark)
            {
                $.ajax({
                    type: "DELETE",
                    url: bookmark.uri,
                    contentType : "application/json",
                    beforeSend: function (xhr)
                    {
                        xhr.setRequestHeader("Accept", "application/json")
                    },
                    success: function (e, data) {
                        setTimeout(function(){
                            $scope.get_my_repositories();
                        }, 1000);

                        $scope.show_popup("success", "Success", e.message);
                        $scope.clear_recalled_repository();
                    },
                    statusCode: $scope.statusCodeDefaults
                });
            }

            if(confirmDelete)
            {
                bootbox.confirm("Are you sure you want to delete the bookmark "+ bookmark.dcterms.title + " ?", function(confirmed) {
                    if(confirmed) {
                        doDeletion(bookmark);
                    }
                });
            }
            else
            {
                doDeletion(bookmark);
            }
        }

        /**
         * Project stats
         * @param uri
         */

        $scope.upload_to_repository = function(target_repository, deleteChangesOriginatedFromCkan, propagateDendroChangesIntoCkan)
        {
            var payload = {
                repository : target_repository,
                new_dataset : $scope.new_dataset
            };

            /*if(overwrite != null)
            {
                payload.overwrite = overwrite;
            }*/

            if(deleteChangesOriginatedFromCkan != null)
            {
                payload.deleteChangesOriginatedFromCkan = deleteChangesOriginatedFromCkan;
            }

            if(propagateDendroChangesIntoCkan != null)
            {
                payload.propagateDendroChangesIntoCkan = propagateDendroChangesIntoCkan;
            }

            var requestString = JSON.stringify(payload);

            var url = $scope.get_calling_uri() + "?export_to_repository";

            $scope.show_popup("info", "Notice", "Exporting data to target repository");
            $scope.is_sending_data = true;

            $http({
                method: "POST",
                url: url,
                data: requestString,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(function(response) {
                var data = response.data;

                if(data!= null)
                {
                    if(data.result === "error")
                    {
                        if(data.message != null)
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
                        if(data.message != null)
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

            }).catch(function(error){
                if(error.data != null && error.data.message != null)
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

        $scope.get_my_repositories = function() {
            $.ajax({
                type: "GET",
                url: "/external_repositories/my",
                contentType : "application/json",
                beforeSend: function (xhr)
                {
                    xhr.setRequestHeader("Accept", "application/json")
                },
                success: function (e, data) {
                    $scope.my_repositories = e;
                },
                statusCode: $scope.statusCodeDefaults
            });
        }

        $scope.get_repository_types = function()
        {
            $.ajax({
                type: "GET",
                url: "/external_repositories/types",
                contentType : "application/json",
                beforeSend: function (xhr)
                {
                    xhr.setRequestHeader("Accept", "application/json")
                },
                success: function (e, data) {
                    $scope.repository_types = e;
                },
                statusCode: $scope.statusCodeDefaults
            });
        };

        $scope.get_sword_workspaces = function(nick, new_repository){

            $scope.clear_sword_data();
            new_repository.ddr.hasPlatform = {};
            new_repository.ddr.hasPlatform.foaf = {nick:nick};

            var payload = {
                repository : new_repository
            };

            var requestString = JSON.stringify(payload);
            $scope.show_popup("info", "Notice", "Accessing workspaces and collections of target repository");
            $http({
                method: "POST",
                url: "/external_repositories/sword_collections",
                data: requestString
            }).then(function(response) {
                    var data = response.data;
                    if(data.result == 'error' && data.message != null)
                    {
                        $scope.show_popup("error", "Error", data.message);
                    }
                    else{

                        var n_collections = 0;
                        for(var workspace in data)
                        {
                            if(data[workspace].collections != null)
                            {
                                n_collections+=data[workspace].collections.length;
                            }
                        }

                        if(n_collections == 0)
                        {
                            $scope.show_popup("info", "Notice", "There are no collections available in this repository");
                        }
                        else
                        {
                            $scope.sword_workspaces = data;
                        }

                    }
            }).catch(function(error){
                if(error.data != null && error.data.message != null)
                {
                    $scope.show_popup("error", error.data.title, error.data.message);
                }
                else
                {
                    $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                }
            });

        };
        $scope.set_sword_collections = function(sword_collections){
            $scope.sword_collections = sword_collections;
        }
        $scope.clear_sword_data = function(){
            delete $scope.sword_collections;
            delete $scope.sword_workspaces;
        };

        $scope.get_my_repositories();
        $scope.get_repository_types();
        $scope.new_dataset = {};
        $scope.is_sending_data = false;
        $scope.overwrite = false;
    });

