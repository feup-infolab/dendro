angular.module("dendroApp.controllers")
/**
 *  Metadata editor controller
 */
    .controller("metadataEditorCtrl", function (
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
        cacheService,
        filesService,
        interactionsService,
        ontologiesService,
        storageService,
        recommendationService,
        descriptorsService
    )
    {
        $scope.recover_metadata = function ()
        {
            bootbox.confirm("Undo all changes to the metadata?", function (confirmed)
            {
                if (confirmed)
                {
                    metadataService.load_metadata()
                        .then(
                            function (metadata)
                            {
                                $scope.reset_metadata(metadata);
                            }
                        );
                }
            });
        };

        $scope.has_editable_metadata = function ()
        {
            if ($scope.shared.metadata == null || ($scope.shared.metadata instanceof Array && $scope.shared.metadata.length === 0))
            {
                return false;
            }
            const is_editable = function (descriptor)
            {
                return !descriptor.private &&
                    !descriptor.locked &&
                    !(descriptor.locked_for_project && $scope.shared.showing_project_root);
            };

            for (var i = 0; i < $scope.shared.metadata.length; i++)
            {
                var descriptor = $scope.shared.metadata[i];
                if (is_editable(descriptor))
                {
                    return true;
                }
            }

            return false;
        };

        $scope.descriptor_is_valid = function (descriptor)
        {
            return descriptorsService.descriptor_is_valid(descriptor);
        };

        $scope.metadata_is_valid = function ()
        {
            return descriptorsService.metadata_is_valid($scope);
        };

        $scope.save_metadata = function ()
        {
            var deferred = $q.defer();

            if (metadataService.metadata_is_valid($scope.shared.metadata))
            {
                var new_metadata = [];
                var descriptors_recommended = [];
                var descriptors_added = [];
                var descriptors_deleted = [];
                var descriptors_inherited = [];

                var currentUri = $scope.get_calling_uri();

                for (var i = 0; i < $scope.shared.metadata.length; i++)
                {
                    var descriptor_clone = $scope.shared.metadata[i];
                    descriptor_clone.recommendedFor = currentUri;

                    if (!descriptor_clone.just_deleted)
                    {
                        new_metadata.push(descriptor_clone);
                    }

                    if (descriptor_clone.just_deleted)
                    {
                        descriptors_deleted.push(descriptor_clone);
                    }

                    if (descriptor_clone.just_recommended && descriptor_clone.value != null)
                    {
                        descriptors_recommended.push(descriptor_clone);
                    }

                    if (descriptor_clone.just_added && descriptor_clone.value != null)
                    {
                        descriptors_added.push(descriptor_clone);
                    }

                    if (descriptor_clone.just_inherited && descriptor_clone.value != null)
                    {
                        descriptors_inherited.push(descriptor_clone);
                    }
                }

                var save_metadata = function ()
                {
                    return metadataService.save_metadata(new_metadata, $scope.get_calling_uri());
                };

                var register_accepted = function ()
                {
                    return interactionsService.register_accepted(descriptors_recommended);
                };

                var register_filled_in = function ()
                {
                    return interactionsService.register_filled_in(descriptors_added);
                };

                var register_deleted = function ()
                {
                    return interactionsService.register_deleted(descriptors_deleted);
                };

                var register_inherited = function ()
                {
                    return interactionsService.register_inherited(descriptors_inherited);
                };

                var refetch_metadata = function ()
                {
                    $scope.load_metadata();
                };

                var report_problems = function (fault)
                {
                    console.log(fault);
                    windowService.show_popup("error", "Error", fault);
                    deferred.reject(fault);
                };

                save_metadata()
                    .then(register_accepted)
                    .then(register_filled_in)
                    .then(register_deleted)
                    .then(register_inherited)
                    .then(refetch_metadata)
                    .then(function ()
                    {
                        var msg = "Information was saved successfully";
                        windowService.show_popup("success", "OK", msg);
                    })
                    .catch(report_problems);
            }
            else
            {
                var msg = "There are still errors in your metadata. Please go over each descriptor and check for any warnings before trying to save again.";
                windowService.show_popup("warning",
                    "Warning",
                    msg
                );

                deferred.reject(msg);
            }

            return deferred.promise;
        };

        $scope.remove_descriptor = function (index)
        {
            $scope.remove_descriptor_at(index);
        };

        $scope.set_all_descriptors_as_deleted = function ()
        {
            if ($scope.shared.metadata != null && $scope.shared.metadata instanceof Array)
            {
                for (var i = 0; i < $scope.shared.metadata.length; i++)
                {
                    $scope.shared.metadata[i].just_deleted = true;
                }
            }
        };

        $scope.contains_inherited = function ()
        {
            if ($scope.shared.metadata != null && $scope.shared.metadata instanceof Array)
            {
                for (var i = 0; i < $scope.shared.metadata.length; i++)
                {
                    if ($scope.shared.metadata[i].just_inherited)
                    {
                        return true;
                    }
                }
            }
            else
            {
                return false;
            }
        };

        $scope.clear_metadata = function ()
        {
            bootbox.confirm("Clear metadata?", function (confirmed)
            {
                if (confirmed)
                {
                    $scope.set_all_descriptors_as_deleted();
                    $scope.save_metadata();
                }
            });
        };

        $scope.dirty_metadata = function ()
        {
            return metadataService.dirty_metadata(
                $scope.shared.initial_metadata,
                $scope.shared.metadata
            );
        };

        $scope.inherit_metadata = function ()
        {
            var requestUri = $scope.get_calling_uri("?parent_metadata");

            return $http
                .get(requestUri)
                .then(function (data)
                {
                    if (data.descriptors != null && data.descriptors instanceof Array && data.descriptors.length > 0)
                    {
                        for (var i = 0; i < data.descriptors.length; i++)
                        {
                            data.descriptors[i].just_inherited = true;
                        }

                        $scope.add_all_descriptors(data.descriptors);

                        windowService.show_popup("success", "Completed", "Copied " + data.descriptors.length + " descriptors from parent folder.");

                        return $scope.shared.metadata;
                    }
                    windowService.show_popup("info", "No descriptors", "Parent has no descriptors to copy.");
                });
        };

        $scope.fill_with_recommendations = function ()
        {
            recommendationService.get_recommendations(
                $scope.get_calling_uri(),
                $scope.descriptor_filter,
                $scope.shared.metadata,
                $scope.recommend_already_filled_in,
                $scope.recommendations_page,
                $scope.recommendations_page_size)

                .then(
                    function (data)
                    {
                        for (var i = 0; i < data.descriptors.length; i++)
                        {
                            var descriptorToBeRecommended = data.descriptors[i];
                            if (descriptorToBeRecommended != null && descriptorToBeRecommended instanceof Object)
                            {
                                descriptorToBeRecommended.just_recommended = true;
                                $scope.add_descriptor(descriptorToBeRecommended);
                            }
                        }
                    }
                );
        };

        $scope.fill_with_missing_recommendations = function ()
        {
            if ($scope.recommended_descriptors_missing instanceof Array)
            {
                for (var i = 0; i < $scope.recommended_descriptors_missing.length; i++)
                {
                    var descriptorToBeRecommended = $scope.recommended_descriptors_missing[i];

                    if (!$scope.descriptor_is_present(descriptorToBeRecommended))
                    {
                        if (descriptorToBeRecommended != null && descriptorToBeRecommended instanceof Object)
                        {
                            descriptorToBeRecommended.just_recommended = true;

                            if (descriptorToBeRecommended.recommendation_types != null && (descriptorToBeRecommended.recommendation_types.project_favorite || descriptorToBeRecommended.recommendation_types.user_favorite))
                            {
                                descriptorToBeRecommended.favorite = true;
                            }

                            $scope.add_descriptor(descriptorToBeRecommended);
                        }
                    }
                }
            }
        };

        $scope.save_descriptor_on_enter = function ()
        {
            bootbox.confirm("Save changes to the annotations?", function (confirmed)
            {
                if (confirmed)
                {
                    $scope.save_metadata();
                }
            });
        };

        $scope.toggle_datepicker = function (descriptorIndex)
        {
            if ($scope.shared.metadata != null && $scope.shared.metadata instanceof Array)
            {
                if ($scope.shared.metadata[descriptorIndex].datepicker_uuid == null)
                {
                    $scope.shared.metadata[descriptorIndex].datepicker_uuid = UUIDjs.create().hex;
                }

                var datepickerUUID = $scope.shared.metadata[descriptorIndex].datepicker_uuid;

                if ($scope.open_datepickers == null)
                {
                    $scope.open_datepickers = {};
                }

                if ($scope.open_datepickers[datepickerUUID])
                {
                    $scope.open_datepickers[datepickerUUID] = false;
                }
                else
                {
                    $scope.open_datepickers[datepickerUUID] = true;
                }
            }
        };

        $scope.toggle_editor_recommendations_mode = function ()
        {
            switch ($scope.editor_recommendations_mode)
            {
            case recommendationService.editor_recommendation_modes.smart:
                $scope.editor_recommendations_mode = recommendationService.editor_recommendation_modes.favorites;
                break;
            case recommendationService.editor_recommendation_modes.favorites:
                $scope.editor_recommendations_mode = null;
                break;
            default:
                $scope.editor_recommendations_mode = recommendationService.editor_recommendation_modes.smart;
                break;
            }

            $localStorage.editor_recommendations_mode = $scope.editor_recommendations_mode;
        };

        $scope.fill_with_missing_recommendations = function (recommended_descriptors_missing)
        {
            if (recommended_descriptors_missing != null && recommended_descriptors_missing instanceof Array)
            {
                for (var i = 0; i < recommended_descriptors_missing.length; i++)
                {
                    var descriptorToBeRecommended = recommended_descriptors_missing[i];

                    if ($scope.descriptor_is_present(descriptorToBeRecommended))
                    {
                        if (descriptorToBeRecommended != null && descriptorToBeRecommended instanceof Object)
                        {
                            descriptorToBeRecommended.just_recommended = true;

                            if (
                                descriptorToBeRecommended.recommendation_types != null &&
                                (
                                    descriptorToBeRecommended.recommendation_types.project_favorite ||
                                    descriptorToBeRecommended.recommendation_types.user_favorite
                                )
                            )
                            {
                                descriptorToBeRecommended.favorite = true;
                            }

                            $scope.add_descriptor(
                                descriptorToBeRecommended
                            );
                        }
                    }
                }
            }
        };

        $scope.get_map_src = function (descriptor, key)
        {
            return "https://www.google.com/maps/embed/v1/place?key=" + key + "&q=" + descriptor.value;
        };

        $scope.shared.descriptor_is_filled_in = function (descriptor)
        {
            return metadataService.descriptor_is_filled_in(
                descriptor,
                $scope.shared.metadata
            );
        };

        $scope.shared.descriptor_is_present = function (descriptor)
        {
            return metadataService.descriptor_is_present(
                descriptor,
                $scope.shared.metadata
            );
        };

        $scope.init = function ()
        {

        };
    });
