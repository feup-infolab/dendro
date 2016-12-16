var Config = function() { return GLOBAL.Config; }();

var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;

var async = require('async');
var _ = require('underscore');

exports.recommend_descriptors = function(req, res) {
    if(req.params.requestedResource != null)
    {
        if(req.session.user != null)
        {
            var recommendationMode = req.query.recommendations_mode;

            var getAllowedOntologies = function()
            {
                if(req.session.user.recommendations != null && req.session.user.recommendations.ontologies != null)
                {
                    var acceptedOntologies = req.session.user.recommendations.ontologies.accepted;
                    var fullOntologies = [];

                    for(var prefix in acceptedOntologies)
                    {
                        if(acceptedOntologies.hasOwnProperty(prefix))
                        {
                            var ontology = new Ontology({
                                prefix : prefix
                            });

                            fullOntologies.push(ontology.uri);
                        }
                    }

                    return fullOntologies;
                }
            };

            var registerRecommendationRequestInteraction = function()
            {
                if(req.query.page != null)
                {
                    var oldPage = req.session.user.recommendations.descriptor_page;

                    if(oldPage == null)
                    {
                        oldPage = 0;
                    }

                    var newPage = parseInt(req.query.page);

                    req.session.user.recommendations.descriptor_page = newPage;

                    var interactionType;

                    if(newPage == (oldPage + 1))
                    {
                        interactionType = Interaction.types.browse_to_next_page_in_descriptor_list.key;
                    }
                    else if(newPage == (oldPage - 1))
                    {
                        interactionType = Interaction.types.browse_to_previous_page_in_descriptor_list.key;
                    }

                    if(interactionType != null)
                    {
                        var lastRecommendationList = JSON.stringify(req.session.user.recommendations.lastRecommendationList);

                        new Interaction(
                            {
                                ddr : {
                                    performedBy : req.session.user.uri,
                                    interactionType : interactionType,
                                    lastDescriptorRecommendationsList : lastRecommendationList,
                                    originallyRecommendedFor : req.params.requestedResource
                                }
                            },
                            function(err, interaction){
                                if(!err && interaction != null)
                                {
                                    interaction.save(function(err, interaction){
                                        if(err)
                                        {
                                            console.err("Unable to record interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list. ");
                                        }
                                        else
                                        {
                                            console.log("Successfully recorded interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list in resource with uri " + req.params.requestedResource);
                                        }
                                    });
                                }
                            });
                    }
                }
            };

            if(Config.baselines.dublin_core_only)
            {
                var allowedOntologies = [Ontology.allOntologies['dcterms'].uri];
            }
            else
            {
                var allowedOntologies = getAllowedOntologies();
            }

            exports.shared.recommend_descriptors(req.params.requestedResource, req.session.user.uri, req.query.page, allowedOntologies, req.index, function(err, descriptors){
                if(!err)
                {
                    registerRecommendationRequestInteraction();

                    req.session.user.recommendations.lastRecommendationList = descriptors;
                    res.json(
                        {
                            result : "ok",
                            descriptors : descriptors
                        }
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            result : "error",
                            error_messages : ["Error producing metadata recommendations for resource " + req.params.requestedResource + " . Error reported : " + descriptors]
                        }
                    );
                }
            },
            {
                favorites : (recommendationMode == exports.shared.recommendation_options.favorites),
                smart : (recommendationMode == exports.shared.recommendation_options.smart),
                hidden : (recommendationMode == exports.shared.recommendation_options.hidden)
            });
        }
        else
        {
            res.status(400).json(
                {
                    result : "error",
                    error_messages : ["No user is authenticated in the system, so no metadata recommendations can be obtained."]
                }
            );
        }
    }
    else
    {
        res.status(404).json(
            {
                result : "error",
                error_messages : ["Resource with uri ." + req.params.requestedResource + " does not exist in this Dendro instance."]
            }
        );
    }
};

exports.shared = {};


/**
 * Recommends a page of descriptors
 * @param resourceUri
 * @param userUri
 * @param page
 * @param allowedOntologies
 * @param indexConnection
 * @param callback
 * @param options favorites_only : choose from favorite descriptors only
 */

exports.shared.recommendation_options = {
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden"
};

exports.shared.recommend_descriptors = function(resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    var ie = new InformationElement(
        {
            uri: resourceUri
        }
    );

    var projectUri = ie.getOwnerProjectFromUri();


    var includeOnlyFavorites = options != null && options[exports.shared.recommendation_options.favorites];
    var smartRecommendationMode = options != null && options[exports.shared.recommendation_options.smart];
    var includeOnlyHiddenDescriptors = options != null && options[exports.shared.recommendation_options.hidden];

    /**
     * Get Most Used Descriptors
     * @param callback
     */

    var getMostUsedPublicDescriptors = function(callback)
    {
        Descriptor.mostUsedPublicDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, mostUsedDescriptors)
        {
            callback(error, mostUsedDescriptors);
        }, allowedOntologies);
    };

    /**
     * Get Recently Used Descriptors
     * @param callback
     */

    var getUsersMostUsedDescriptors = function(userUri, callback)
    {
        User.findByUri(userUri, function (err, user)
        {
            if (!err)
            {
                user.mostRecentlyFilledInDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, mostRecentlyFilledIn)
                {
                    callback(error, mostRecentlyFilledIn);
                }, allowedOntologies);
            }
            else
            {
                var error = "Error fetching user : " + user + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };


    /**
     * Get User's favorite descriptors
     * @param callback
     */

    var getUsersFavoriteDescriptors = function(userUri, callback)
    {
        User.findByUri(userUri, function (err, user)
        {
            if (!err)
            {
                user.favoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites)
                {
                    callback(error, favorites);
                }, allowedOntologies);
            }
            else
            {
                var error = "Error fetching user : " + user + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    /**
     * Get User's favorite descriptors
     * @param callback
     */

    var getUsersHiddenDescriptors = function(userUri, callback)
    {
        User.findByUri(userUri, function (err, user)
        {
            if (!err)
            {
                user.hiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, hidden)
                {
                    callback(error, hidden);
                }, allowedOntologies);
            }
            else
            {
                var error = "Error fetching user : " + user + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    /**
     * Get Project's favorite descriptors
     * @param callback
     */

    var getProjectsFavoriteDescriptors = function(projectUri, callback)
    {
        var Project = require('./project.js').Project;

        Project.findByUri(projectUri, function (err, project)
        {
            if (!err)
            {
                if(project != null)
                {
                    project.getFavoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites)
                    {
                        callback(error, favorites);
                    }, allowedOntologies);
                }
                else
                {
                    var error = "Project with uri : " + projectUri + " is not registered in this Dendro instance.";
                    console.error(error);
                    callback(1, error);
                }
            }
            else
            {
                var error = "Error fetching project : " + project + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    var getProjectsHiddenDescriptors = function(projectUri, callback)
    {
        var Project = require('./project.js').Project;

        Project.findByUri(projectUri, function (err, project)
        {
            if (!err)
            {
                if(project != null)
                {
                    project.getHiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, hidden)
                    {
                        callback(error, hidden);
                    }, allowedOntologies);
                }
                else
                {
                    var error = "Project with uri : " + projectUri + " is not registered in this Dendro instance.";
                    console.error(error);
                    callback(1, error);
                }
            }
            else
            {
                var error = "Error fetching project : " + project + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    /**
     * Get descriptors used in textually similar resources
     * @param callback
     */

    var getDescriptorsFromTextuallySimilarResources = function(resourceUri, callback)
    {
        var resource = new Resource(
            {
                uri: resourceUri
            }
        );

        resource.getTextuallySimilarResources(indexConnection, Config.limits.index.maxResults, function (err, similarResources)
        {
            if (!err && similarResources != null && similarResources instanceof Array)
            {
                //get properties of the similar resources
                var getDescriptorsOfSimilarResources = function (resource, callback)
                {
                    resource.getPropertiesFromOntologies(allowedOntologies, function (err, descriptors)
                    {
                        if (!err)
                        {
                            for (var i = 0; i < descriptors.length; i++)
                            {
                                descriptors[i].recommendation_types = {};
                                descriptors[i].recommendation_types[Descriptor.recommendation_types.from_textually_similar.key] = true;
                            }
                        }

                        callback(err, resource); //null as 1st argument == no error
                    });
                };

                async.map(similarResources, getDescriptorsOfSimilarResources, function (err, similarResourcesWithDescriptors)
                {
                    callback(err, similarResourcesWithDescriptors);
                });
            }
            else
            {
                var error = "Error fetching similar resources : " + similarResources + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    /**
     * Get user's favorite descriptors that are most accepted in the metadata editor
     */

    var getUsersMostAcceptedFavoriteDescriptorsInMetadataEditor = function(userUri, callback)
    {
        User.findByUri(userUri, function (err, user)
        {
            if (!err)
            {
                user.mostAcceptedFavoriteDescriptorsInMetadataEditor(Config.recommendation.max_suggestions_of_each_type, function (error, hidden)
                {
                    callback(error, hidden);
                }, allowedOntologies);
            }
            else
            {
                var error = "Error fetching user : " + user + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    /**
     * Get user's smart descriptors that are most accepted in the metadata editor
     */

    var getUsersMostAcceptedSmartDescriptorsInMetadataEditor = function(userUri, callback)
    {
        User.findByUri(userUri, function (err, user)
        {
            if (!err)
            {
                user.mostAcceptedSmartDescriptorsInMetadataEditor(Config.recommendation.max_suggestions_of_each_type, function (error, hidden)
                {
                    callback(error, hidden);
                }, allowedOntologies);
            }
            else
            {
                var error = "Error fetching user : " + user + " : " + err;
                console.error(error);
                callback(1, error);
            }
        });
    };

    async.series(
        [
            function (callback)
            {
                getMostUsedPublicDescriptors(callback); //0
            },
            function (callback)
            {
                getUsersMostUsedDescriptors(userUri, callback); //1
            },
            function (callback)
            {
                getDescriptorsFromTextuallySimilarResources(resourceUri, callback); //2
            },
            function (callback)
            {
                getUsersFavoriteDescriptors(userUri, callback); //3
            },
            function (callback)
            {
                getUsersHiddenDescriptors(userUri, callback); //4
            },
            function (callback)
            {
                getProjectsFavoriteDescriptors(projectUri, callback); //5
            },
            function (callback)
            {
                getProjectsHiddenDescriptors(projectUri, callback); //6
            },
            function (callback)
            {
                getUsersMostAcceptedFavoriteDescriptorsInMetadataEditor(userUri, callback); //7
            },
            function (callback)
            {
                getUsersMostAcceptedSmartDescriptorsInMetadataEditor(userUri, callback); //8
            }
        ],
        /**
         * Perform final ranking
         * @param callback
         */
        function (err, results)
        {
            if (!err)
            {
                /**
                 * fill in with random descriptors from the currently
                 * allowed ontologies until we have the needed
                 * recommendations
                 * **/

                var flattenAndMergeDescriptors = function(results)
                {
                    var initDescriptorsHash = function (descriptorsArray)
                    {
                        var hash = {};

                        for (var i = 0; i < descriptorsArray.length; i++)
                        {
                            var descriptor = new Descriptor({
                                uri: descriptorsArray[i].uri
                            });

                            if (hash[descriptor.prefix] == null)
                            {
                                hash[descriptor.prefix] = {};
                            }

                            if (hash[descriptor.prefix][descriptor.shortName] == null)
                            {
                                hash[descriptor.prefix][descriptor.shortName] = null;
                            }
                        }

                        return hash;
                    };

                    var flatResults = _.compact(_.flatten(results));
                    var descriptors = initDescriptorsHash(flatResults);

                    for(var i = 0; i < flatResults.length; i++)
                    {
                        var dummyToParseUri = new Descriptor(flatResults[i]);
                        var descriptorPrefix = dummyToParseUri.prefix;
                        var descriptorShortName = dummyToParseUri.shortName;

                        var d = descriptors[descriptorPrefix][descriptorShortName];

                        if(d == null)
                        {
                            d = new Descriptor(flatResults[i]);
                        }

                        if(flatResults[i].recent_use_count != null)
                        {
                            d.recent_use_count = flatResults[i].recent_use_count;
                        }
                        if(flatResults[i].overall_use_count != null)
                        {
                            d.overall_use_count = flatResults[i].overall_use_count;
                        }
                        if(flatResults[i].times_smart_accepted_in_md_editor != null)
                        {
                            d.times_smart_accepted_in_md_editor = flatResults[i].times_smart_accepted_in_md_editor;
                        }
                        if(flatResults[i].times_favorite_accepted_in_md_editor != null)
                        {
                            d.times_favorite_accepted_in_md_editor = flatResults[i].times_favorite_accepted_in_md_editor;
                        }
                        if(flatResults[i].last_use != null)
                        {
                            d.last_use = flatResults[i].last_use;
                        }

                        descriptors[descriptorPrefix][descriptorShortName] = d;
                    }

                    for (var i = 0; i < flatResults.length; i++)
                    {
                        var d = new Descriptor(flatResults[i]);

                        var fused_result_types = descriptors[d.prefix][d.shortName].recommendation_types;
                        if(fused_result_types == null)
                        {
                            fused_result_types = {};
                        }

                        if(flatResults[i].recommendation_types instanceof Object)
                        {
                            try{
                                var result_rec_types = Object.keys(flatResults[i].recommendation_types);
                            }
                            catch(e)
                            {
                                console.error("Estourei onde devia");
                            }


                            if(result_rec_types == null)
                                result_rec_types = [];

                            //copy rec types from the result
                            for(var j = 0; j < result_rec_types.length; j++)
                            {
                                var result_rec_type = result_rec_types[j];
                                fused_result_types[result_rec_type] = true;
                            }
                        }

                        descriptors[d.prefix][d.shortName].recommendation_types = fused_result_types;
                    }

                    var flatDescriptors = [];

                    for (var prefix in descriptors)
                    {
                        if (descriptors.hasOwnProperty(prefix))
                        {
                            for (var shortName in descriptors[prefix])
                            {
                                if (descriptors[prefix].hasOwnProperty(shortName))
                                {
                                    var descriptor = descriptors[prefix][shortName];

                                    if(includeOnlyFavorites)
                                    {
                                        if(descriptor.recommendation_types[Descriptor.recommendation_types.project_favorite.key]
                                            ||
                                            descriptor.recommendation_types[Descriptor.recommendation_types.user_favorite.key])
                                        {
                                            flatDescriptors.push(descriptor);
                                        }
                                    }
                                    else if(includeOnlyHiddenDescriptors)
                                    {
                                        if(descriptor.recommendation_types[Descriptor.recommendation_types.project_hidden.key]
                                            ||
                                            descriptor.recommendation_types[Descriptor.recommendation_types.user_hidden.key])
                                        {
                                            flatDescriptors.push(descriptor);
                                        }
                                    }
                                    else
                                    {
                                        flatDescriptors.push(descriptor);
                                    }
                                }
                            }
                        }
                    }

                    return flatDescriptors;
                };

                var rankDescriptors = function (descriptors)
                {
                    for (var i = 0; i < descriptors.length; i++)
                    {
                        var descriptor = descriptors[i];

                        //console.log("Ranking descriptor " + descriptor.prefixedForm);

                        var score = descriptor.score;

                        if (score == null)
                        {
                            score = 0;
                        }

                        var rec_types = {};

                        if (descriptor.recommendation_types != null)
                        {
                            rec_types = descriptor.recommendation_types;
                        }
                        else
                        {
                            rec_types = {};
                        }

                        //Hidden descriptors have Zero Score!
                        if(rec_types[Descriptor.recommendation_types.user_hidden.key] || rec_types[Descriptor.recommendation_types.project_hidden.key])
                        {
                            score = 0;
                        }
                        else
                        {
                            //if NOT hidden, calculate score
                            if (rec_types[Descriptor.recommendation_types.recently_used.key])
                            {
                                score += descriptor.recent_use_count *
                                    Descriptor.recommendation_types.recently_used.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.from_textually_similar.key])
                            {
                                score += Descriptor.recommendation_types.from_textually_similar *
                                    Descriptor.recommendation_types.from_textually_similar.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.frequently_used_overall.key])
                            {
                                score += descriptor.overall_use_count *
                                    Descriptor.recommendation_types.frequently_used_overall.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.random.key])
                            {
                                score += Descriptor.recommendation_types.random.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.user_favorite.key])
                            {
                                score += Descriptor.recommendation_types.user_favorite.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.project_favorite.key])
                            {
                                score += Descriptor.recommendation_types.project_favorite.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.smart_accepted_in_metadata_editor.key])
                            {
                                score += descriptor.times_smart_accepted_in_md_editor *
                                    Descriptor.recommendation_types.smart_accepted_in_metadata_editor.weight;
                            }
                            if (rec_types[Descriptor.recommendation_types.favorite_accepted_in_metadata_editor.key])
                            {
                                score += descriptor.times_favorite_accepted_in_md_editor *
                                    Descriptor.recommendation_types.favorite_accepted_in_metadata_editor.weight;
                            }
                        }

                        descriptor.score = score;
                        descriptors[i] = descriptor;
                    }


                    descriptors = _.sortBy(descriptors, function (descriptor)
                    {
                        return descriptor.score;
                    });

                    descriptors = descriptors.reverse();

                    return descriptors;
                };

                var applyPaging = function (rankedDescriptors, page)
                {
                    if (page != null)
                    {
                        var skip = page * Config.recommendation.recommendation_page_size;
                        rankedDescriptors = rankedDescriptors.slice(skip, skip + Config.recommendation.recommendation_page_size);
                    }
                    else
                    {
                        rankedDescriptors = rankedDescriptors.slice(0, Config.recommendation.recommendation_page_size);
                    }

                    return rankedDescriptors;
                };

                var padWithRandomDescriptors = function(results, callback)
                {
                    var numberOfDescriptorsRequiredForPadding = Config.recommendation.recommendation_page_size - results.length;

                    Descriptor.getRandomDescriptors(allowedOntologies, numberOfDescriptorsRequiredForPadding, function (err, randomDescriptors)
                    {
                        if (!err && randomDescriptors != null)
                        {
                            results = results.concat(randomDescriptors);
                            callback(err, results);
                        }
                        else
                        {
                            var msg = "Error occurred when padding recommended descriptors list with random descriptors: " + err + ". Error reported: " + JSON.stringify(randomDescriptors);
                            console.error(msg);
                            callback(err, msg);
                        }
                    });
                };

                var removeDuplicates = function(results)
                {
                    var uniques = _.uniq(results, false, function(result){
                        return result.uri;
                    });

                    return uniques;
                };

                var removeLockedAndPrivate = function(results)
                {
                    var filtered = _.filter(results, function(result){
                        var isLockedOrPrivate =  (result.locked || result.private);
                        return !isLockedOrPrivate;
                    });

                    return filtered;
                };

                results = flattenAndMergeDescriptors(results);
                results = rankDescriptors(results);
                results = removeLockedAndPrivate(results);

                if(!includeOnlyFavorites && !includeOnlyHiddenDescriptors)
                {
                    results = applyPaging(results, page);
                }

                if(includeOnlyFavorites || includeOnlyHiddenDescriptors)
                {
                    /**
                     * In case we only want favorites, no need to pad with random descriptors
                     */

                    callback(null, results)
                }
                else if (results.length < Config.recommendation.recommendation_page_size && !includeOnlyFavorites && !includeOnlyHiddenDescriptors)
                {
                    padWithRandomDescriptors(results, function(err, results){
                        results = removeDuplicates(results);
                        callback(err, results);
                    });
                }
                else
                {
                    callback(null, results);
                }
            }
            else
            {
                var error_messages = [];
                for(var i = 0; i < results.length; i++)
                {
                    if(!(results[i] instanceof Array))
                    {
                        error_messages.push(results[i]);
                    }
                }

                var msg = "Error performing final ranking of descriptors. Error reported : " + err + ", Errors reported  " + JSON.stringify(error_messages);
                console.log(msg);
                callback(err, msg);
            }
        });
};