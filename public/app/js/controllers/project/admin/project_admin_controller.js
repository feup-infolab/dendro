angular.module('dendroApp.controllers')
/**
 *  Project administration controller
 */
    .controller('projectAdminCtrl', function (
        $scope,
        $http,
        $filter,
        $q,
        $location,
        $log,
        $sce,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        projectsService,
        usersService
    )
    {
        $scope.active_tab = null;
        $scope.contributors = [];

        $scope.get_project = function()
        {
            var url = $scope.get_current_url();

            $http({
                method: 'GET',
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(function(response) {
                var descriptors = response.data.descriptors;

                $scope.project =  {
                    dcterms: {
                        creator: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:creator"),
                        title: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:title"),
                        description: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:description"),
                        publisher: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:publisher"),
                        language: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:language"),
                        coverage: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:coverage"),
                    },
                    ddr: {
                        handle: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:handle"),
                        privacyStatus: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:privacyStatus"),
                        hasStorageLimit: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:hasStorageLimit"),
                        requiresVerifiedUploads: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:requiresVerifiedUploads"),
                    },
                    schema : {
                        provider : $scope.get_descriptor_by_prefixed_form(descriptors, "schema:provider"),
                        telephone : $scope.get_descriptor_by_prefixed_form(descriptors, "schema:telephone"),
                        address : $scope.get_descriptor_by_prefixed_form(descriptors, "schema:address"),
                        email: $scope.get_descriptor_by_prefixed_form(descriptors, "schema:email"),
                        license : $scope.get_descriptor_by_prefixed_form(descriptors, "schema:license")
                    }
                };

                $scope.load_licenses()
                    .then(function(licenses)
                    {
                        $scope.project.schema.license = _.find(licenses, function(license){
                            return license.title === $scope.project.schema.license;
                        });
                    });

                $scope.load_languages()
                    .then(function(languages)
                    {
                        $scope.project.dcterms.language = _.find(languages, function(language){
                            return language.alpha2 === $scope.project.dcterms.language;
                        });
                    });

                if($scope.get_descriptor_by_prefixed_form("ddr:deleted") === true)
                {
                    project.deleted = true;
                }
            })
                .catch(function(error){
                    if(error.message != null && error.title != null)
                    {
                        Utils.show_popup("error", error.title, error.message);
                    }
                    else
                    {
                        Utils.show_popup("error", "Error occurred", JSON.stringify(error));
                    }
                });
        };

        $scope.delete_project = function ()
        {
            //TODO ugly, convert this to the standard representation with the namespace (to enable if(project.ddr.deleted) ) later

            if($scope.project != null && $scope.project.descriptors != null)
            {
                var uri;
                if(project.deleted)
                    uri = $scope.get_current_url() + "?undelete";
                else
                    uri = $scope.get_current_url() + "?delete";

                //console.log("deleting " + get_current_url() + " via url " + uri);

                $http.post(uri)
                    .then(function(response) {
                        var data = response.data;
                        Utils.show_popup("success", data.title, data.message);
                    })
                    .catch(function(error){
                        if(error.message != null && error.title != null)
                        {
                            Utils.show_popup("error", error.title, error.message);
                        }
                        else
                        {
                            Utils.show_popup("error", "Error occurred", JSON.stringify(error));
                        }
                    });
            }
        };

        $scope.project_data_uri = function(node){
            node.uri = $scope.get_current_url() + '/data';
        };

        $scope.init = function(contributors)
        {
            $scope.get_contributors(contributors);
            $scope.active_tab = $localStorage.active_tab;
            $scope.get_project();
        };

        $scope.get_users_by_text_search = function(typed) {
            var current_url = $scope.get_calling_uri();
            return usersService.get_users_by_text_search(current_url, typed);
        };

        $scope.select_user_from_autocomplete = function(suggestion, model, label)
        {
            if(suggestion != null){
                $scope.contributors[this.$index].info = suggestion;
            }
        };

        $scope.get_calling_uri = function(queryParametersString, uri)
        {
            if(uri != null)
            {
                uri = uri + queryParametersString;
            }
            else
            {
                if(queryParametersString != null)
                {
                    if($scope.shared.selected_file != null)
                    {
                        uri = $scope.shared.selected_file.uri + queryParametersString;
                    }
                    else
                    {
                        uri = windowService.get_current_url() + queryParametersString;
                    }
                }
                else
                {
                    uri = windowService.get_current_url();
                }
            }

            return uri;
        };

        $scope.get_contributors = function(contributors){
            if(contributors != "") {
                var names = contributors.split(",");
                projectsService.get_contributors(names)
                    .then(function(response){
                        var users = response.contributors;
                        $scope.contributors = [];
                        for (var i in users) {
                            $scope.contributors.push({"info": users[i], "remove": false});
                        }
                    });

            }
        };

        $scope.add_new_contributor = function(){
            $scope.contributors.push({"info":{ddr: {username: ""}}, "remove": false});

        };

        $scope.update_contributors = function(){
            var contributors = [];
            for (var i = 0; i < $scope.contributors.length; i++){
                var person = $scope.contributors[i];
                if(!person.remove){
                    if(person.info.ddr.username != "") {
                        if (person.info.uri){
                            contributors.push(person.info.uri);
                        }else{
                            contributors.push(person.info.ddr.username);
                        }
                    }
                }
            }

            projectsService.update_contributors(contributors)
                .then(function (result){
                    location.reload();
                    $scope.show_popup("success", "Success", "Project updated");
                }).catch(function (error){
                $scope.show_popup("error", "Error", error.message);
            });
        };

        $scope.clicked_information_tab = function()
        {
            $scope.active_tab = 'information';
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_metadataquality_tab = function()
        {
            $scope.active_tab = 'metadataquality';
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_people_tab = function()
        {
            $scope.active_tab = 'people';
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_settings_tab = function()
        {
            $scope.active_tab = 'settings';
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.update_project_settings = function()
        {
            projectsService.update_project_settings($scope.project)
                .then(function(response){
                    $scope.show_popup("success", "Project settings updated", response.message);
                    $scope.get_project();
                })
                .catch(function(error){
                    $scope.show_popup("error", "Error occurred", error.message);
                });
        };

        $scope.update_project_metadata = function()
        {
            if($scope.project.schema.license && $scope.project.dcterms.language)
            {
                $scope.project.schema.license = $scope.project.schema.license.title;
                $scope.project.dcterms.language = $scope.project.dcterms.language.alpha2;
            }

            projectsService.update_metadata($scope.project)
                .then(function(response){
                    $scope.show_popup("success", "Project Updated", response.message);
                    $scope.get_project();
                })
                .catch(function(error){
                    $scope.show_popup("error", "Error occurred", error.message);
                });
        };
    });