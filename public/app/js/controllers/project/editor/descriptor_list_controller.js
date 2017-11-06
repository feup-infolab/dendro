angular.module('dendroApp.controllers')
    /**
     *  Descriptors List controller
     */
    .controller('descriptorListCtrl', function (
        $scope,
        $http,
        $filter,
        $q,
        $log,
        $sce,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        cacheService,
        filesService,
        interactionsService,
        ontologiesService,
        storageService,
        recommendationService,
        descriptorsService
    ) {

        $scope.get_recommendations = function() {
            recommendationService.get_recommendations(
                $scope.get_calling_uri(),
                $scope.descriptor_filter,
                $scope.shared.metadata,
                $scope.recommend_already_filled_in,
                $scope.recommendations_page,
                $scope.recommendations_page_size
            ).then(function(recommendations){
                if(recommendations != null)
                {
                    $scope.recommendations = recommendations;
                    $scope.shared.recommender_offline = false;
                    storageService.save_to_local_storage('recommender_offline', $scope.shared.recommender_offline, "shared");
                }
            }).catch(function(error){
                $scope.shared.recommender_offline = true;
                storageService.save_to_local_storage('recommender_offline', $scope.shared.recommender_offline, "shared");
            });
        };

        $scope.get_descriptors_by_text_search = function(typed) {
            var current_url = $scope.get_calling_uri();
            return descriptorsService.get_descriptors_by_text_search(current_url, typed);
        };

        $scope.clear_manually_selected_ontology = function()
        {
            $scope.manually_selected_ontology  = null;
            storageService.save_to_local_storage("manually_selected_ontology", null);
            storageService.save_to_local_storage("manual_descriptors", null);
        };

        $scope.get_manual_descriptors_from_ontology = function(ontology_uri)
        {
            $scope.fetching_descriptors_from_manual_ontology = true;
            descriptorsService.get_descriptors_from_ontology_annotated_for_a_resource(ontology_uri, $scope.get_calling_uri())
                .then(function(manual_descriptors){
                    $scope.manual_descriptors = manual_descriptors;
                    storageService.save_to_local_storage("manual_descriptors", $scope.manual_descriptors);
                    $scope.fetching_descriptors_from_manual_ontology = false;
                })
                .catch(function(error){
                    $scope.fetching_descriptors_from_manual_ontology = false;
                });
        };

        $scope.manually_select_ontology = function(ontology) {

            if(ontology != null && ontology instanceof Object)
            {
                var autocompletedOntology = JSON.parse(JSON.stringify(ontology));

                $scope.manually_selected_ontology = autocompletedOntology;
                storageService.save_to_local_storage('manually_selected_ontology', $scope.manually_selected_ontology);

                $scope.get_manual_descriptors_from_ontology(autocompletedOntology.prefix);
                
                interactionsService.register_interaction(
                    "/interactions/select_ontology_manually",
                    autocompletedOntology,
                    'select_ontology_manually',
                    ontology.index,
                    $scope.get_calling_uri()
                ).then(
                    function(result){
                        $scope.get_recommendations(
                            $scope.get_calling_uri()
                        );
                    }
                ).catch(
                    function(error){
                        $scope.show_popup(
                            "error",
                            "Unable to register interaction",
                            "Unable to register manual selection of the ontology " + ontology.label + "!"
                        );
                    }
                );
            }
        };

        $scope.select_descriptor_from_autocomplete = function(suggestion, model, label)
        {
            if(suggestion != null && suggestion instanceof Object)
            {
                var autocompletedDescriptor = JSON.parse(JSON.stringify(suggestion));
                autocompletedDescriptor.just_added = true;

                $scope.add_descriptor(autocompletedDescriptor);

                $scope.accept_descriptor_from_autocomplete(suggestion);
            }
        };

        $scope.accept_descriptor_from_quick_list = function(descriptor, index, callback) {
            //necessary because we want a clone, without this, when editing a box,
            // all other boxes of the same descriptor would change!

            if(descriptor != null && descriptor instanceof Object)
            {
                var newDescriptor = JSON.parse(JSON.stringify(descriptor));
                var uri;
                var interactionType;

                if(newDescriptor.control == "date_picker")
                {
                    newDescriptor.value = new Date();
                }

                if($scope.descriptor_selection_mode == recommendationService.descriptor_selection_modes.recommendation)
                {
                    interactionType = 'accept_descriptor_from_quick_list';
                    uri = "/interactions/accept_descriptor_from_quick_list";

                    newDescriptor.just_added = true;
                    newDescriptor.added_from_quick_list = true;
                    newDescriptor.rankingPosition = index;
                    newDescriptor.pageNumber = $scope.recommendations_page;
                }
                else if($scope.descriptor_selection_mode == recommendationService.descriptor_selection_modes.manual)
                {
                    newDescriptor.just_added = true;
                    newDescriptor.added_from_manual_list = true;
                    newDescriptor.rankingPosition = index;
                    newDescriptor.pageNumber = $scope.recommendations_page;

                    if(descriptor.recommendation_types != null)
                    {
                        if (
                            descriptor.recommendation_types.user_favorite &&
                            descriptor.recommendation_types.project_favorite
                        )
                        {
                            uri = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite";
                            interactionType = "accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite"
                        }
                        else if (descriptor.recommendation_types.project_favorite)
                        {
                            uri = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite";
                            interactionType = "accept_descriptor_from_manual_list_while_it_was_a_project_favorite"
                        }
                        else if (descriptor.recommendation_types.user_favorite)
                        {
                            uri = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite";
                            interactionType = "accept_descriptor_from_manual_list_while_it_was_a_user_favorite"
                        }
                        else
                        {
                            uri = "/interactions/accept_descriptor_from_manual_list";
                            interactionType = "accept_descriptor_from_manual_list"
                        }
                    }
                    else
                    {
                        uri = "/interactions/accept_descriptor_from_manual_list";
                        interactionType = "accept_descriptor_from_manual_list"
                    }
                }
                
                $scope.add_descriptor(newDescriptor);

                interactionsService.register_interaction(
                    uri,
                    newDescriptor,
                    interactionType,
                    index,
                    $scope.get_calling_uri()
                ).then(
                    function(result){
                        //$scope.get_recommendations()

                        if(typeof callback == "function")
                        {
                            callback(null);
                        }
                    }
                ).catch(
                    function(error){
                        if(typeof callback == "function")
                        {
                            callback(1);
                        }
                    }
                );
            }
        };

        $scope.multiple_accept_descriptor_from_quick_list = function(descriptor, index) {
            bootbox.prompt("Please enter the number of descriptors of type " + descriptor.label + " that you would like to add (a number from 1 to 15)", function(number_of_times) {
                if(number_of_times === null || typeof number_of_times === "undefined")
                {
                    return;
                }
                else
                {
                    number_of_times = parseInt(number_of_times, 10);

                    if (!isNaN(number_of_times) && number_of_times > 0 && number_of_times <= 15)
                    {
                        async.timesSeries(number_of_times, function(n, next){
                            if($scope.descriptor_selection_mode == recommendationService.descriptor_selection_modes.recommendation)
                            {
                                if (
                                    descriptor.recommendation_types != null
                                )
                                {
                                    if (
                                        descriptor.recommendation_types.user_favorite &&
                                        descriptor.recommendation_types.project_favorite
                                    )
                                    {
                                        var uri = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite";
                                        var interactionType = "accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite";
                                    }
                                    else if (descriptor.recommendation_types.project_favorite)
                                    {
                                        var uri = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite";
                                        var interactionType = "accept_descriptor_from_quick_list_while_it_was_a_project_favorite";
                                    }
                                    else if (descriptor.recommendation_types.user_favorite)
                                    {
                                        var uri = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite";
                                        var interactionType = "accept_descriptor_from_quick_list_while_it_was_a_user_favorite";
                                    }
                                    else
                                    {
                                        var uri = "/interactions/accept_descriptor_from_quick_list";
                                        var interactionType = "accept_descriptor_from_quick_list";
                                    }
                                }
                                else
                                {
                                    var uri = "/interactions/accept_descriptor_from_quick_list";
                                    var interactionType = "accept_descriptor_from_quick_list";
                                }
                            }
                            else if($scope.descriptor_selection_mode == recommendationService.descriptor_selection_modes.manual)
                            {
                                if (
                                    descriptor.recommendation_types != null
                                )
                                {
                                    if (
                                        descriptor.recommendation_types.user_favorite &&
                                        descriptor.recommendation_types.project_favorite
                                    )
                                    {
                                        var uri = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite";
                                        var interactionType = "accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite";
                                    }
                                    else if (descriptor.recommendation_types.project_favorite)
                                    {
                                        var uri = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite";
                                        var interactionType = "accept_descriptor_from_manual_list_while_it_was_a_project_favorite";
                                    }
                                    else if (descriptor.recommendation_types.user_favorite)
                                    {
                                        var uri = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite";
                                        var interactionType = "accept_descriptor_from_manual_list_while_it_was_a_user_favorite";
                                    }
                                    else
                                    {
                                        var uri = "/interactions/accept_descriptor_from_manual_list";
                                        var interactionType = "accept_descriptor_from_manual_list";
                                    }
                                }
                                else
                                {
                                    var uri = "/interactions/accept_descriptor_from_manual_list";
                                    var interactionType = "accept_descriptor_from_manual_list";
                                }
                            }

                            if(descriptor != null && descriptor instanceof Object)
                            {


                                var newDescriptor = JSON.parse(JSON.stringify(descriptor));
                                newDescriptor.just_added = true;

                                if($scope.descriptor_selection_mode == recommendationService.descriptor_selection_modes.recommendation)
                                {
                                    newDescriptor.added_from_quick_list = true;
                                }
                                else if($scope.descriptor_selection_mode == recommendationService.descriptor_selection_modes.manual)
                                {
                                    newDescriptor.added_from_manual_list = true;
                                }

                                newDescriptor.rankingPosition = index;
                                newDescriptor.recommendations_page = $scope.recommendations_page;

                                if (newDescriptor.control == "date_picker")
                                {
                                    newDescriptor.value = new Date();
                                }

                                $scope.add_descriptor(newDescriptor);

                                //next(null, null);

                                interactionsService.register_interaction(
                                    uri,
                                    newDescriptor,
                                    interactionType,
                                    index,
                                    $scope.get_calling_uri()
                                ).then(
                                    function(result){
                                        next(null, null);
                                    }
                                ).catch(
                                    function(error){
                                        next(1, "Error batch registering interaction " + interactionType + " at step " + n);
                                    }
                                );
                            }

                        }, function(err, results){
                            if(err)
                            {
                                $scope.show_popup("error", "Descriptor selection", "Error recording multiple descriptor selection");
                            }
                        });
                    }
                    else
                    {
                        bootbox.alert("Invalid value supplied. You must input an integer between 1 and 15", function() {});
                    }
                }
            });
        };

        $scope.remove_recommendation_ontology = function(recommendation_ontology, index)
        {
            interactionsService.remove_recommendation_ontology(recommendation_ontology, index)
                .then(function()
                {
                    $scope.get_public_ontologies();
                })
                .catch(function(error){
                    $scope.show_popup(
                        "error",
                        "Error",
                        "Unable to register rejection of ontology " + recommen
                    );
                });
        }

        $scope.get_public_ontologies = function() {
            ontologiesService.get_public_ontologies()
                .then(function(ontologies)
                {
                    $scope.public_ontologies = ontologies;
                })
                .catch(function(error){
                    $scope.show_popup(
                        "error",
                        "Error",
                        "Unable to retrieve public ontologies for the manual descriptor selection screen"
                    );
                });
        };

        $scope.toggle_recommend_already_filled_in = function() {
            recommendationService.toggle_recommend_already_filled_in();
            $scope.get_recommendations();
        };

        ///////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////


        $scope.get_previous_descriptor_recommendations = function()
        {
            if($scope.recommendations_page == null)
            {
                $scope.recommendations_page = 0;
            }

            $scope.recommendations_page--;
            storageService.save_to_local_storage("recommendations_page", $scope.recommendations_page);

            $scope.get_recommendations();
        };

        $scope.get_next_descriptor_recommendations = function()
        {
            if($scope.recommendations_page == null)
            {
                $scope.recommendations_page = 0;
            }

            $scope.recommendations_page++;
            storageService.save_to_local_storage("recommendations_page", $scope.recommendations_page);

            $scope.get_recommendations();
        };

        $scope.switch_selection_mode = function(newMode)
        {
            if(
                newMode == recommendationService.descriptor_selection_modes.recommendation ||
                newMode == recommendationService.descriptor_selection_modes.manual ||
                newMode == recommendationService.descriptor_selection_modes.favorites
            )
            {
                $scope.descriptor_selection_mode = newMode;
                storageService.save_to_local_storage("descriptor_selection_mode", $scope.descriptor_selection_mode);

                if(newMode == recommendationService.descriptor_selection_modes.manual)
                {
                    if(ontologiesService.public_ontologies == null)
                    {
                        $scope.get_public_ontologies();
                    }

                    if($scope.manually_selected_ontology != null && typeof $scope.manually_selected_ontology.uri === "string")
                    {
                        descriptorsService.get_descriptors_from_ontology_annotated_for_a_resource($scope.manually_selected_ontology.uri, $scope.get_calling_uri());
                    }
                }
                else if(newMode == recommendationService.descriptor_selection_modes.recommendation)
                {
                    $scope.get_recommendations(
                        $scope.get_calling_uri()
                    );
                }
            }
            else
            {
                windowService.show_popup("error", "Error", "Error changing descriptor selection mode.");
            }
        };

        $scope.switch_descriptor_filter = function(newFilter, refreshRecommendations)
        {
            $scope.descriptor_filter = newFilter;
            storageService.save_to_local_storage("descriptor_filter", $scope.descriptor_filter);

            if(refreshRecommendations)
            {
                $scope.get_recommendations(
                    $scope.get_calling_uri(), null, newFilter
                );
            }
        };

        $scope.toggle_recommend_already_filled_in = function()
        {
            $scope.recommend_already_filled_in = !$scope.recommend_already_filled_in;
            storageService.save_to_local_storage('recommend_already_filled_in', $scope.recommend_already_filled_in);
            $scope.get_recommendations();
        };

        $scope.set_ontology_description_html_popup = function(ontology)
        {
            $scope.ontology_description_html_popup =  $sce.trustAsHtml("<span><strong>" + ontology.description + "</strong></span>");
        };

        $scope.init = function()
        {
            $scope.set_from_local_storage_and_then_from_value("descriptor_selection_mode", "manual");
            $scope.set_from_local_storage_and_then_from_value("descriptor_filter", 'all');
            $scope.set_from_local_storage_and_then_from_value("recommend_already_filled_in", true);
            $scope.set_from_local_storage_and_then_from_value("public_ontologies", false);
            $scope.set_from_local_storage_and_then_from_value("recommendations_page_size", 25);
            $scope.set_from_local_storage_and_then_from_value("recommendations_page", 0);

            $scope.set_from_local_storage_and_then_from_value("manually_selected_ontology");

            if(
                $scope.descriptor_selection_mode === $scope.recommendationService.descriptor_selection_modes.recommendation
            )
            {
                $scope.get_recommendations();
            }

            if($scope.manually_selected_ontology == null)
            {
                $scope.get_public_ontologies();
            }
            else
            {
                $scope.set_from_local_storage_and_then_from_value("manual_descriptors");

                if($scope.manual_descriptors == null)
                {
                    $scope.get_manual_descriptors_from_ontology($scope.manually_selected_ontology.prefix);
                }
            }
        };
    });