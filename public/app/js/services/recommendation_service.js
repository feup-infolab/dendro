'use strict';

angular.module('dendroApp.services')
    .service('recommendationService', ['$http', 'filesService',
        function ($http, filesService)
        {
            this.editor_recommendation_modes = {
                smart: 'smart',
                favorites: 'favorites'
            };

            this.descriptor_selection_modes = {
                manual: 'manual',
                recommendation: 'recommendation',
                favorites: 'favorites'
            };

            this.descriptor_filters = [
                {
                    label: 'All',
                    key: 'all'
                },
                {
                    label: 'Favorites',
                    key: 'favorites'
                },
                {
                    label: 'Hidden',
                    key: 'hidden'
                }
            ];

            /**
         * Recommendations
         */

            this.get_recommendations = function (
                resource_uri,
                descriptor_filter,
                current_metadata,
                recommend_already_filled_in,
                recommendations_page,
                recommendations_page_size
            )
            {
                var self = this;
                var requestUri = resource_uri + '?metadata_recommendations';

                var params = {
                    page: recommendations_page,
                    page_size: recommendations_page_size,
                    current_metadata: JSON.stringify(current_metadata),
                    recommend_already_filled_in: recommend_already_filled_in
                };

                var get_descriptor_filter_object = function (descriptor_filter)
                {
                    for (var filter in self.descriptor_filters)
                    {
                        if (filter.key == descriptor_filter)
                        {
                            return filter;
                        }
                    }

                    return null;
                };

                if (descriptor_filter instanceof Object && descriptor_filter.key != self.descriptor_filters[0].key)
                {
                    // console.log("Getting recommendations with descriptor filter " + descriptor_filter.key);
                    params.recommendations_mode = descriptor_filter.key;
                }
                else if (!(descriptor_filter instanceof Object))
                {
                    if (self.descriptor_filter instanceof Object)
                    {
                        params.recommendations_mode = self.descriptor_filter.key;
                    }
                    else if (typeof self.descriptor_filter === 'string')
                    {
                        params.recommendations_mode = self.descriptor_filter;
                    }
                }
                else if (descriptor_filter != null && typeof descriptor_filter === 'string')
                {
                    var filterObject = get_descriptor_filter_object(descriptor_filter);

                    if (filterObject != null)
                    {
                        params.recommendations_mode = filterObject.key;
                    }
                    else
                    {
                        Utils.show_popup('error', 'Error', 'Unable to change recommendation mode to ' + descriptor_filter + ' as it is not a valid mode');
                    }
                }

                return $http.get(requestUri,
                    {
                        params: params
                    }
                ).then(function (response)
                {
                    return response.data.descriptors;
                }).catch(function (e)
                {
                    var msg = 'Unable to fetch recommendations ';
                    throw msg + JSON.stringify(e);
                });
            };

            this.get_recommendation_ontologies = function (resource_uri)
            {
                var self = this;
                var url = resource_uri + '?recommendation_ontologies';

                return $http.get(url)
                    .then(function (response)
                    {
                        if (!response.data || !(response.data instanceof Array))
                        {
                            self.recommendation_ontologies = [];
                        }
                        else
                        {
                            self.recommendation_ontologies = response.data;
                        }

                        return JSON.parse(JSON.stringify(self.recommendation_ontologies));
                    });
            };
        }]);
