// TODO make this a single call for every array instead of for every element of arrays......

angular.module('dendroApp.services')
    .service('interactionsService',
        ['$http', '$q',
            function ($http, $q)
            {
                /**
                 * Give notice to server
                 */

                this.register_interaction = function (url, objectOfInteraction, interactionType, rankingPosition, recommendedFor, pageNumber)
                {
                    if (objectOfInteraction != null && objectOfInteraction instanceof Object)
                    {
                        objectOfInteraction.interactionType = interactionType;

                        if (rankingPosition == null)
                        {
                            rankingPosition = -1;
                        }

                        if (objectOfInteraction.rankingPosition == null && rankingPosition != null)
                        {
                            objectOfInteraction.rankingPosition = rankingPosition;
                        }

                        if (objectOfInteraction.recommendedFor == null && recommendedFor != null)
                        {
                            objectOfInteraction.recommendedFor = recommendedFor;
                        }

                        if (objectOfInteraction.pageNumber == null && pageNumber != null)
                        {
                            objectOfInteraction.pageNumber = pageNumber;
                        }

                        // serialize for sending
                        var objectOfInteractionString = JSON.stringify(objectOfInteraction);

                        return $http({
                            method: 'POST',
                            url: url,
                            data: objectOfInteractionString,
                            contentType: 'application/json',
                            headers: {Accept: 'application/json'}
                        });
                    }
                    throw 'Cannot register an interaction without an object of interaction.';
                };

                this.register_accepted = function (descriptors_accepted)
                {
                    var self = this;
                    return $q.all(descriptors_accepted.map(function (descriptor)
                    {
                        if (descriptor.recommendation_types != null)
                        {
                            if (descriptor.recommendation_types.just_recommended)
                            {
                                return self.accept_descriptor_in_metadata_editor(descriptor);
                            }
                            else if (descriptor.recommendation_types.favorite)
                            {
                                return self.accept_favorite_descriptor_in_metadata_editor(descriptor);
                            }
                        }
                        else
                        {
                            return self.accept_descriptor_in_metadata_editor(descriptor);
                        }
                    })
                    )
                        .catch(function (error)
                        {
                            console.error('Unable to record the acceptance of recommended descriptors in the metadata editor. ' +
                            'Please contact your system administrator. Error reported: ' + JSON.stringify(error));
                        });
                };

                this.register_filled_in = function (descriptors_filled_in)
                {
                    var self = this;
                    return $q.all(descriptors_filled_in.map(function (descriptor)
                    {
                        if (descriptor.added_from_manual_list)
                        {
                            return self.fill_in_descriptor_from_manual_list_in_metadata_editor(descriptor);
                        }
                        else if (descriptor.added_from_quick_list)
                        {
                            return self.fill_in_descriptor_from_quick_list_in_metadata_editor(descriptor);
                        }
                    })
                    )
                        .catch(function (error)
                        {
                            console.error('Unable to record the filling in of descriptors in the metadata editor. Please contact your system administrator. Error reported: ' + JSON.stringify(error));
                        });
                };

                this.register_deleted = function (descriptors_deleted)
                {
                    var self = this;
                    return $q.all(descriptors_deleted.map(function (descriptor)
                    {
                        return self.delete_descriptor_in_metadata_editor(descriptor);
                    })
                    )
                        .catch(function (error)
                        {
                            console.error('Unable to record the deletion of descriptors in the metadata editor. Please contact your system administrator. Error reported: ' + JSON.stringify(error));
                        });
                };

                this.register_inherited = function (descriptors_inherited)
                {
                    var self = this;
                    return $q.all(descriptors_inherited.map(function (descriptor)
                    {
                        return self.fill_in_inherited_descriptor(descriptor);
                    })
                    )
                        .catch(function (error)
                        {
                            console.error('Unable to record the inheritance of descriptors in the metadata editor. Please contact your system administrator. Error reported: ' + JSON.stringify(error));
                        });
                };

                this.fill_in_descriptor_from_manual_list_in_metadata_editor = function (descriptor)
                {
                    var self = this;
                    var url;
                    var interactionType;

                    if (descriptor.recommendation_types != null)
                    {
                        if (
                            descriptor.recommendation_types.user_favorite &&
                            descriptor.recommendation_types.project_favorite
                        )
                        {
                            url = '/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite';
                            interactionType = 'fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite';
                        }
                        else if (descriptor.recommendation_types.project_favorite)
                        {
                            url = '/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite';
                            interactionType = 'fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite';
                        }
                        else if (descriptor.recommendation_types.user_favorite)
                        {
                            url = '/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite';
                            interactionType = 'fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite';
                        }
                        else
                        {
                            url = '/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor';
                            interactionType = 'fill_in_descriptor_from_manual_list_in_metadata_editor';
                        }
                    }
                    else
                    {
                        url = '/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor';
                        interactionType = 'fill_in_descriptor_from_manual_list_in_metadata_editor';
                    }

                    return self.register_interaction(
                        url,
                        descriptor,
                        interactionType,
                        descriptor.rankingPosition, // previously saved at the time of selection from the list
                        null,
                        null,
                        null,
                        null
                    );
                };

                this.fill_in_inherited_descriptor = function (descriptor)
                {
                    var self = this;

                    return self.register_interaction(
                        '/interactions/fill_in_inherited_descriptor',
                        descriptor,
                        'fill_in_inherited_descriptor',
                        null,
                        null,
                        null,
                        null,
                        null
                    );
                };

                this.send_interaction_over_quick_list_descriptor = function (descriptor, index, url, interactionType)
                {
                    var self = this;

                    if (index == null)
                    {
                        index = -1;
                    }

                    if (descriptor != null && descriptor instanceof Object)
                    {
                        return self.register_interaction(
                            url,
                            descriptor,
                            interactionType,
                            index);
                    }
                };

                this.favorite_descriptor_from_quick_list_for_user = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/favorite_descriptor_from_quick_list_for_user',
                        'favorite_descriptor_from_quick_list_for_user',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register favoriting of descriptor ' + descriptor.label + ' for user.'
                    );
                };

                this.favorite_descriptor_from_quick_list_for_project = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/favorite_descriptor_from_quick_list_for_project',
                        'favorite_descriptor_from_quick_list_for_project',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register favoriting of descriptor ' + descriptor.label + ' for project.',
                        true
                    );
                };

                this.unfavorite_descriptor_from_quick_list_for_user = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/unfavorite_descriptor_from_quick_list_for_user',
                        'unfavorite_descriptor_from_quick_list_for_user',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register unfavoriting of descriptor ' + descriptor.label + ' for user.',
                        true
                    );
                };

                this.unfavorite_descriptor_from_quick_list_for_project = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/unfavorite_descriptor_from_quick_list_for_project',
                        'unfavorite_descriptor_from_quick_list_for_project',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register unfavoriting of descriptor ' + descriptor.label + ' for project.',
                        true
                    );
                };

                this.hide_descriptor_from_quick_list_for_user = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/hide_descriptor_from_quick_list_for_user',
                        'hide_descriptor_from_quick_list_for_user',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register hiding of descriptor ' + descriptor.label + ' for user.',
                        true
                    );
                };

                this.hide_descriptor_from_quick_list_for_project = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/hide_descriptor_from_quick_list_for_project',
                        'hide_descriptor_from_quick_list_for_project',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register hiding of descriptor ' + descriptor.label + ' for project.',
                        true
                    );
                };

                this.unhide_descriptor_from_quick_list_for_user = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/unhide_descriptor_from_quick_list_for_user',
                        'unhide_descriptor_from_quick_list_for_user',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register unhiding of descriptor ' + descriptor.label + ' for user.',
                        true
                    );
                };

                this.unhide_descriptor_from_quick_list_for_project = function (descriptor, index)
                {
                    var self = this;

                    return self.register_interaction(
                        descriptor,
                        index,
                        '/interactions/unhide_descriptor_from_quick_list_for_project',
                        'unhide_descriptor_from_quick_list_for_project',
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register unhiding of descriptor ' + descriptor.label + ' for project.',
                        true
                    );
                };

                this.accept_descriptor_from_autocomplete = function (descriptor)
                {
                    var self = this;

                    return self.register_interaction(
                        '/interactions/accept_descriptor_from_autocomplete',
                        descriptor,
                        'accept_descriptor_from_autocomplete',
                        descriptor.index,
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register descriptor acceptance from autocomplete box: ' + descriptor.label + '!',
                        true
                    );
                };

                this.remove_recommendation_ontology = function (ontology, index)
                {
                    var self = this;

                    return self.register_interaction(
                        '/interactions/reject_ontology_from_quick_list',
                        ontology,
                        'reject_ontology_from_quick_list',
                        index,
                        null,
                        null,
                        'Unable to register interaction',
                        'Unable to register rejection of ontologies in the interface: ' + suggestion.label + '!');
                };

                this.accept_descriptor_in_metadata_editor = function (descriptor)
                {
                    var self = this;

                    return self.register_interaction(
                        '/interactions/accept_smart_descriptor_in_metadata_editor',
                        descriptor,
                        'accept_smart_descriptor_in_metadata_editor',
                        null,
                        null,
                        null,
                        null,
                        null
                    );
                };

                this.accept_favorite_descriptor_in_metadata_editor = function (descriptor)
                {
                    var self = this;

                    return self.register_interaction(
                        '/interactions/accept_favorite_descriptor_in_metadata_editor',
                        descriptor,
                        'accept_favorite_descriptor_in_metadata_editor',
                        null,
                        null,
                        null,
                        null,
                        null
                    );
                };

                this.delete_descriptor_in_metadata_editor = function (descriptor)
                {
                    var self = this;

                    return self.register_interaction(
                        '/interactions/delete_descriptor_in_metadata_editor',
                        descriptor,
                        'delete_descriptor_in_metadata_editor',
                        null,
                        null,
                        null,
                        null,
                        null
                    );
                };

                this.fill_in_descriptor_from_quick_list_in_metadata_editor = function (descriptor)
                {
                    var self = this;

                    if (descriptor.recommendation_types != null)
                    {
                        if (
                            descriptor.recommendation_types.user_favorite &&
                            descriptor.recommendation_types.project_favorite
                        )
                        {
                            var url = '/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite';
                            var interactionType = 'fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite';
                        }
                        else if (descriptor.recommendation_types.project_favorite)
                        {
                            var url = '/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite';
                            var interactionType = 'fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite';
                        }
                        else if (descriptor.recommendation_types.user_favorite)
                        {
                            var url = '/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite';
                            var interactionType = 'fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite';
                        }
                        else
                        {
                            var url = '/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor';
                            var interactionType = 'fill_in_descriptor_from_quick_list_in_metadata_editor';
                        }
                    }
                    else
                    {
                        var url = '/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor';
                        var interactionType = 'fill_in_descriptor_from_quick_list_in_metadata_editor';
                    }

                    return self.register_interaction(
                        url,
                        descriptor,
                        interactionType,
                        descriptor.rankingPosition, // previously saved at the time of selection from the list
                        null,
                        null,
                        null,
                        null
                    );
                };
            }]);
