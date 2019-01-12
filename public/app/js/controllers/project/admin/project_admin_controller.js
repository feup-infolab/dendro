angular.module("dendroApp.controllers")
/**
 *  Project administration controller
 */
    .controller("projectAdminCtrl", function (
        $scope,
        $rootScope,
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
        filesService,
        windowService,
        projectsService,
        usersService
    )
    {
        $scope.button = "Cluster";
        // keyword extraction
        $scope.keywords = null;
        $scope.concepts = null;
        $scope.properties = null;
        $scope.clusters;

        $scope.filelist = null;
        $scope.keywordlist = null;
        $scope.termList = null;
        $scope.clusterList = false;
        $scope.conceptlist = null;
        $scope.descriptorlist = null;
        $scope.multiple_term_selection = true;
        $scope.multiple_concept_selection = true;
        $scope.extra_terms = null;
        $scope.selected_term = null;
        $scope.selected_method = "CValueJJ";
        $scope.extractionmethods = ["CValueNN", "CValueJJ", "Yake!"];
        //
        $scope.active_tab = null;
        $scope.contributors = [];
        $scope.availableStorages = ["local", "b2drop"];

        $scope.get_project = function ()
        {
            var url = $scope.get_current_url();

            $http({
                method: "GET",
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {Accept: "application/json"}
            }).then(function (response)
            {
                var descriptors = response.data.descriptors;

                $scope.project = {
                    dcterms: {
                        creator: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:creator"),
                        title: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:title"),
                        description: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:description"),
                        publisher: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:publisher"),
                        language: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:language"),
                        coverage: $scope.get_descriptor_by_prefixed_form(descriptors, "dcterms:coverage")
                    },
                    ddr: {
                        handle: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:handle"),
                        privacyStatus: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:privacyStatus"),
                        hasStorageLimit: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:hasStorageLimit"),
                        requiresVerifiedUploads: $scope.get_descriptor_by_prefixed_form(descriptors, "ddr:requiresVerifiedUploads")
                    },
                    schema: {
                        provider: $scope.get_descriptor_by_prefixed_form(descriptors, "schema:provider"),
                        telephone: $scope.get_descriptor_by_prefixed_form(descriptors, "schema:telephone"),
                        address: $scope.get_descriptor_by_prefixed_form(descriptors, "schema:address"),
                        email: $scope.get_descriptor_by_prefixed_form(descriptors, "schema:email"),
                        license: $scope.get_descriptor_by_prefixed_form(descriptors, "schema:license")
                    }
                };

                $scope.load_licenses()
                    .then(function (licenses)
                    {
                        $scope.project.schema.license = _.find(licenses, function (license)
                        {
                            return license.title === $scope.project.schema.license;
                        });
                    });

                $scope.load_languages()
                    .then(function (languages)
                    {
                        $scope.project.dcterms.language = _.find(languages, function (language)
                        {
                            return language.alpha2 === $scope.project.dcterms.language;
                        });
                    });

                if ($scope.get_descriptor_by_prefixed_form("ddr:deleted") === true)
                {
                    $scope.project.deleted = true;
                }
            })
                .catch(function (error)
                {
                    if (error.message != null && error.title != null)
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
            // TODO ugly, convert this to the standard representation with the namespace (to enable if(project.ddr.deleted) ) later

            if ($scope.project != null && $scope.project.descriptors != null)
            {
                var uri;
                if ($scope.project.deleted)
                {
                    uri = $scope.get_current_url() + "?undelete";
                }
                else
                {
                    uri = $scope.get_current_url() + "?delete";
                }

                // console.log("deleting " + get_current_url() + " via url " + uri);

                $http.post(uri)
                    .then(function (response)
                    {
                        var data = response.data;
                        Utils.show_popup("success", data.title, data.message);
                    })
                    .catch(function (error)
                    {
                        if (error.message != null && error.title != null)
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

        $scope.project_data_uri = function (node)
        {
            node.uri = $scope.get_current_url() + "/data";
        };

        $scope.init = function (contributors)
        {
            $scope.filelist = true;
            $scope.keywordlist = false;
            $scope.conceptlist = false;
            $scope.descriptorlist = false;
            $scope.get_contributors(contributors);
            $scope.active_tab = $localStorage.active_tab;

            if (!$scope.active_tab)
            {
                $scope.clicked_information_tab();
            }
            $scope.get_project();
            $scope.get_storage();
        };

        $scope.get_users_by_text_search = function (typed)
        {
            var current_url = $scope.get_calling_uri();
            return usersService.get_users_by_text_search(current_url, typed);
        };

        $scope.select_user_from_autocomplete = function (suggestion, model, label)
        {
            if (suggestion != null)
            {
                $scope.contributors[this.$index].info = suggestion;
            }
        };

        $scope.get_calling_uri = function (queryParametersString, uri)
        {
            if (uri != null)
            {
                uri = uri + queryParametersString;
            }
            else
            {
                if (queryParametersString != null)
                {
                    if ($scope.shared.selected_file != null)
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

        $scope.get_contributors = function (contributors)
        {
            if (contributors != "")
            {
                var names = contributors.split(",");
                projectsService.get_contributors(names)
                    .then(function (response)
                    {
                        var users = response.contributors;
                        $scope.contributors = [];
                        for (var i in users)
                        {
                            $scope.contributors.push({info: users[i], remove: false});
                        }
                    });
            }
        };

        $scope.add_new_contributor = function ()
        {
            $scope.contributors.push({info: {ddr: {username: ""}}, remove: false});
        };

        $scope.update_contributors = function ()
        {
            var contributors = [];
            for (var i = 0; i < $scope.contributors.length; i++)
            {
                var person = $scope.contributors[i];
                if (!person.remove)
                {
                    if (person.info.ddr.username != "")
                    {
                        if (person.info.uri)
                        {
                            contributors.push(person.info.uri);
                        }
                        else
                        {
                            contributors.push(person.info.ddr.username);
                        }
                    }
                }
            }

            projectsService.update_contributors(contributors)
                .then(function (result)
                {
                    location.reload();
                    $scope.show_popup("success", "Success", "Project updated");
                }).catch(function (error)
                {
                    $scope.show_popup("error", "Error", error.message);
                });
        };

        $scope.clicked_information_tab = function ()
        {
            $scope.active_tab = "information";
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_metadataquality_tab = function ()
        {
            $scope.active_tab = "metadataquality";
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_people_tab = function ()
        {
            $scope.active_tab = "people";
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_settings_tab = function ()
        {
            $scope.active_tab = "settings";
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_storage_tab = function ()
        {
            $scope.active_tab = "storage";
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_concept_tab = function ()
        {
            $scope.active_tab = "concept";
            $localStorage.active_tab = $scope.active_tab;
        };

        $scope.clicked_back_keyword_list = function ()
        {
            $scope.filelist = true;
            $scope.keywordlist = false;
        };

        $scope.clicked_back_dbpedia_list = function ()
        {
            $scope.keywordlist = true;
            $scope.conceptlist = false;
        };

        $scope.clicked_back_descriptor_list = function ()
        {
            $scope.conceptlist = true;
            $scope.descriptorlist = false;
        };

        $scope.update_project_settings = function ()
        {
            projectsService.update_project_settings($scope.project)
                .then(function (response)
                {
                    $scope.show_popup("success", "Project settings updated", response.message);
                    $scope.get_project();
                })
                .catch(function (error)
                {
                    $scope.show_popup("error", "Error occurred", error.message);
                });
        };

        $scope.update_project_metadata = function ()
        {
            if ($scope.project.schema.license && $scope.project.dcterms.language)
            {
                $scope.project.schema.license = $scope.project.schema.license.title;
                $scope.project.dcterms.language = $scope.project.dcterms.language.alpha2;
            }

            projectsService.update_metadata($scope.project)
                .then(function (response)
                {
                    $scope.show_popup("success", "Project Updated", response.message);
                    $scope.get_project();
                })
                .catch(function (error)
                {
                    $scope.show_popup("error", "Error occurred", error.message);
                });
        };

        $scope.get_storage = function ()
        {
            var url = $scope.get_current_url() + "?storage";

            $http({
                method: "GET",
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {Accept: "application/json"}
            }).then(function (response)
            {
                $scope.storage = response.data.storageConfig;
            }).catch(function (error)
            {
                if (error.data !== null && error.data.message !== null && error.data.title !== null)
                {
                    Utils.show_popup("error", error.data.title, error.data.message);
                }
                else
                {
                    Utils.show_popup("error", "Error occurred while fetching the storage options of the project: ", JSON.stringify(error));
                }
            });
        };

        $scope.update_storage = function ()
        {
            var url = $scope.get_current_url() + "?storage";

            $http({
                method: "POST",
                url: url,
                data: JSON.stringify({ storageConfig: $scope.storage}),
                contentType: "application/json",
                headers: {Accept: "application/json"}
            }).then(function (response)
            {
                Utils.show_popup("success", response.data.title, response.data.message);
                $scope.get_storage();
            }).catch(function (error)
            {
                if (error.data !== null && error.data.message !== null && error.data.title !== null)
                {
                    Utils.show_popup("error", error.data.title, error.data.message);
                }
                else
                {
                    Utils.show_popup("error", "Error occurred while updating the storage options of the project: ", JSON.stringify(error));
                }
            });
        };

        $scope.msg = "";
        $scope.get = function ()
        {
            $scope.$broadcast("someEvent");
            return $scope.msg;
        };

        $scope.$on("getFiles", function (e, data)
        {
            $scope.msg = data;
        });

        $scope.extract_terms = function ()
        {
            let data = {method: $scope.selected_method, text: []};
            for (let i = 0; i < $scope.get().length; i++)
            {
                data.text.push({
                    text: $scope.get()[i].nie.plainTextContent
                });
            }
            $http({
                method: "POST",
                url: "/keywords/processExtract",
                data: JSON.stringify(data),
                headers: {"Content-Type": "application/json; charset=UTF-8"}
            }).then(function (response)
            {
                $scope.keywords = response.data.dbpediaTerms.keywords;
                $scope.filelist = false;
                $scope.keywordlist = true;
                $scope.termList = true;
            }).catch(function (error)
            {
                if (Boolean(error.data) && error.data.message !== null && error.data.title !== null)
                {
                    Utils.show_popup("error", error.data.title, error.data.message);
                }
                else
                {
                    Utils.show_popup("error", "Error occurred while fetching keywords: " + error.stack);
                }
            });
        };

        $scope.cluster_concepts = function ()
        {
            if ($scope.button === "Cluster")
            {
                if (typeof $scope.clusters === "undefined")
                {
                    let data = {terms: []};
                    for (let i = 0; i < $scope.keywords.length; i++)
                    {
                        data.terms.push({
                            words: $scope.keywords[i].words, score: $scope.keywords[i].score
                        });
                    }
                    $http({
                        method: "POST",
                        url: "/keywords/clustering",
                        data: JSON.stringify(data),
                        headers: {"Content-Type": "application/json; charset=UTF-8"}
                    }).then(function (response)
                    {
                        // $scope.keywords = response.data.output.dbpediaTerms.keywords;
                        $scope.termList = false;
                        $scope.clusterList = true;
                        $scope.clusters = response.data.clusters;
                        $scope.button = "Term List";
                    }).catch(function (error)
                    {
                        if (error.data !== null && error.data.message !== null && error.data.title !== null)
                        {
                            // Utils.show_popup("error", error.data.title, error.data.message);
                        }
                        else
                        {
                            // Utils.show_popup("error", "Error occurred while updating the storage options of the project: ", JSON.stringify(error));
                        }
                    });
                }
                else
                {
                    $scope.termList = false;
                    $scope.clusterList = true;
                    $scope.button = "Term List";
                }
            }
            else
            {
                $scope.termList = true;
                $scope.clusterList = false;
                $scope.button = "Cluster";
            }
        };
        $scope.clickTerm = function (term)
        {
            for (let k = 0; k < $scope.keywords.length; k++)
            {
                if ($scope.keywords[k].words === term.words)
                {
                    $scope.keywords[k].selected = true;
                    break;
                }
            }
        };

        $scope.clickCluster = function (cluster)
        {
            for (let k = 0; k < cluster.length; k++)
            {
                for (let h = 0; h < $scope.keywords.length; h++)
                {
                    if (cluster[k].words === $scope.keywords[h].words)
                    {
                        $scope.keywords[h].selected = true;
                        break;
                    }
                }
            }
        };

        $scope.get_concepts = function ()
        {
            let data = {keywords: []};
            for (let i = 0; i < $scope.keywords.length; i++)
            {
                if ($scope.keywords[i].selected)
                {
                    data.keywords.push({
                        words: $scope.keywords[i].words, score: $scope.keywords[i].score
                    });
                }
            }
            $http({
                method: "POST",
                url: "/keywords/dbpediaResourceLookup",
                data: JSON.stringify(data),
                headers: {"Content-Type": "application/json; charset=UTF-8"}
            }).then(function (response)
            {
                // $scope.keywords = response.data.output.dbpediaTerms.keywords;
                $scope.concepts = response.data.dbpediaResources.result;
                $scope.keywordlist = false;
                $scope.conceptlist = true;
            }).catch(function (error)
            {
                if (error.data !== null && error.data.message !== null && error.data.title !== null)
                {
                    // Utils.show_popup("error", error.data.title, error.data.message);
                }
                else
                {
                    // Utils.show_popup("error", "Error occurred while updating the storage options of the project: ", JSON.stringify(error));
                }
            });
        };

        $scope.get_properties = function ()
        {
            let data = {concepts: []};
            for (let i = 0; i < $scope.concepts.length; i++)
            {
                if ($scope.concepts[i].selected)
                {
                    data.concepts.push($scope.concepts[i]);
                }
            }
            $http({
                method: "POST",
                url: "/keywords/lovProperties",
                data: JSON.stringify(data),
                headers: {"Content-Type": "application/json; charset=UTF-8"}
            }).then(function (response)
            {
                $scope.properties = response.data.lovProperties;
                $scope.conceptlist = false;
                $scope.descriptorlist = true;
            }).catch(function (error)
            {
                if (error.data !== null && error.data.message !== null && error.data.title !== null)
                {
                    // Utils.show_popup("error", error.data.title, error.data.message);
                }
                else
                {
                    // Utils.show_popup("error", "Error occurred while updating the storage options of the project: ", JSON.stringify(error));
                }
            });
        };

        $scope.add_terms = function ()
        {
            let temporary_terms = $scope.extra_terms.split(";");
            for (let i = 0; i < temporary_terms.length; i++)
            {
                $scope.keywords.unshift({words: temporary_terms[i], score: "important", selected: true});
            }
            $scope.extra_terms = "";
        };

        $scope.toggle_multiple_term_selection = function ()
        {
            $scope.multiple_term_selection = !$scope.multiple_term_selection;
            if (!$scope.multiple_term_selection)
            {
                $scope.clear_selected_terms();
            }
        };
        $scope.toggle_multiple_concept_selection = function ()
        {
            $scope.multiple_concept_selection = !$scope.multiple_concept_selection;
            if (!$scope.multiple_concept_selection)
            {
                $scope.clear_selected_concepts();
            }
        };

        $scope.clear_selected_terms = function ()
        {
            if ($scope.keywords != null && $scope.keywords instanceof Array)
            {
                for (let i = 0; i < $scope.keywords.length; i++)
                {
                    if ($scope.keywords[i].score !== "important")
                    {
                        $scope.keywords[i].selected = false;
                    }
                }
            }
            $scope.selected_term = null;
        };

        $scope.clear_selected_concepts = function ()
        {
            if ($scope.concepts != null && $scope.concepts instanceof Array)
            {
                for (let i = 0; i < $scope.concepts.length; i++)
                {
                    $scope.concepts[i].selected = false;
                }
            }
            $scope.selected_term = null;
        };
        $scope.toggle_select_all_terms = function ()
        {
            if (!$scope.multiple_term_selection)
            {
                $scope.multiple_term_selection = !$scope.multiple_term_selection;
                $scope.select_all_terms(true);
            }
            if ($scope.get_selected_terms().length === $scope.keywords.length)
            {
                $scope.clear_selected_terms();
            }
            else
            {
                $scope.select_all_terms($scope.multiple_term_selection);
            }
        };
        $scope.toggle_select_all_concepts = function ()
        {
            if (!$scope.multiple_concept_selection)
            {
                $scope.multiple_concept_selection = !$scope.multiple_concept_selection;
                $scope.select_all_concepts(true);
            }
            if ($scope.get_selected_concepts().length === $scope.concepts.length)
            {
                $scope.clear_selected_concepts();
            }
            else
            {
                $scope.select_all_concepts($scope.multiple_concept_selection);
            }
        };

        $scope.select_all_terms = function (selected)
        {
            if ($scope.keywords != null && $scope.keywords instanceof Array)
            {
                for (let i = 0; i < $scope.keywords.length; i++)
                {
                    $scope.keywords[i].selected = selected;
                }
            }
        };
        $scope.select_all_concepts = function (selected)
        {
            if ($scope.concepts != null && $scope.concepts instanceof Array)
            {
                for (let i = 0; i < $scope.concepts.length; i++)
                {
                    $scope.concepts[i].selected = selected;
                }
            }
        };
        $scope.get_selected_terms = function ()
        {
            let selected_files = [];

            if ($scope.keywords)
            {
                for (let i = 0; i < $scope.keywords.length; i++)
                {
                    if ($scope.keywords[i].selected)
                    {
                        selected_files.push($scope.keywords[i]);
                    }
                }
            }
            return selected_files;
        };

        $scope.get_selected_concepts = function ()
        {
            let selected_files = [];

            if ($scope.concepts)
            {
                for (let i = 0; i < $scope.concepts.length; i++)
                {
                    if ($scope.concepts[i].selected)
                    {
                        selected_files.push($scope.concepts[i]);
                    }
                }
            }
            return selected_files;
        };
        /*
        $scope.set_selected_term = function (index)
        {
            if (
                $scope.keywords != null &&
                $scope.keywords instanceof Array &&
                index < $scope.keywords.length
            )
            {
                $scope.keywords[index].selected = true;
                $scope.selected_term = $scope.keywords[index];
            }
        };
        */
        $scope.toggle_select_term_at_index_for_multiple_selection = function (index)
        {
            if ($scope.keywords != null && $scope.keywords instanceof Array)
            {
                if ($scope.keywords.length > index)
                {
                    $scope.keywords[index].selected = !$scope.keywords[index].selected;
                }
            }
        };

        $scope.toggle_select_concept_at_index_for_multiple_selection = function (index)
        {
            if ($scope.concepts != null && $scope.concepts instanceof Array)
            {
                if ($scope.concepts.length > index)
                {
                    $scope.concepts[index].selected = !$scope.concepts[index].selected;
                }
            }
        };
        $scope.clicked_term_explorer_node = function (index)
        {
            if ($scope.multiple_term_selection)
            {
                $scope.toggle_select_term_at_index_for_multiple_selection(index);
            }
            else
            {
                // $scope.set_selected_term(index);
            }
        };
        $scope.clicked_concept_explorer_node = function (index)
        {
            if ($scope.multiple_concept_selection)
            {
                $scope.toggle_select_concept_at_index_for_multiple_selection(index);
            }
            else
            {
                // $scope.set_selected_term(index);
            }
        };
    });
