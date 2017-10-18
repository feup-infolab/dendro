const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

const async = require("async");
const _ = require("underscore");

exports.recommend_descriptors = function(req, res) {
    if(!isNull(req.params.requestedResourceUri))
    {
        if(!isNull(req.user))
        {
            const recommendationMode = req.query.recommendations_mode;

            const getAllowedOntologies = function () {
                if (!isNull(req.user.recommendations) && !isNull(req.user.recommendations.ontologies)) {
                    const acceptedOntologies = req.user.recommendations.ontologies.accepted;
                    const fullOntologies = [];

                    for (let prefix in acceptedOntologies) {
                        if (acceptedOntologies.hasOwnProperty(prefix)) {
                            const ontology = new Ontology({
                                prefix: prefix
                            });

                            fullOntologies.push(ontology.uri);
                        }
                    }

                    return fullOntologies;
                }
            };

            const registerRecommendationRequestInteraction = function () {
                if (!isNull(req.query.page)) {
                    let oldPage = req.user.recommendations.descriptor_page;

                    if (isNull(oldPage)) {
                        oldPage = 0;
                    }

                    const newPage = parseInt(req.query.page);

                    req.user.recommendations.descriptor_page = newPage;

                    let interactionType;

                    if (newPage === (oldPage + 1)) {
                        interactionType = Interaction.types.browse_to_next_page_in_descriptor_list.key;
                    }
                    else if (newPage === (oldPage - 1)) {
                        interactionType = Interaction.types.browse_to_previous_page_in_descriptor_list.key;
                    }

                    if (!isNull(interactionType)) {
                        const lastRecommendationList = JSON.stringify(req.user.recommendations.lastRecommendationList);

                        Interaction.create(
                            {
                                ddr: {
                                    performedBy: req.user.uri,
                                    interactionType: interactionType,
                                    lastDescriptorRecommendationsList: lastRecommendationList,
                                    originallyRecommendedFor: req.params.requestedResourceUri
                                }
                            },
                            function (err, interaction) {
                                if (isNull(err) && !isNull(interaction)) {
                                    interaction.save(function (err, interaction) {
                                        if (err) {
                                            console.err("Unable to record interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list. ");
                                        }
                                        else {
                                            console.log("Successfully recorded interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list in resource with uri " + req.params.requestedResourceUri);
                                        }
                                    });
                                }
                            });
                    }
                }
            };

            const allowedOntologies = getAllowedOntologies();

            exports.shared.recommend_descriptors(req.params.requestedResourceUri, req.user.uri, req.query.page, allowedOntologies, req.index, function(err, descriptors){
                if(isNull(err))
                {
                    registerRecommendationRequestInteraction();

                    req.user.recommendations.lastRecommendationList = descriptors;
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
                            error_messages : ["Error producing metadata recommendations for resource " + req.params.requestedResourceUri + " . Error reported : " + descriptors]
                        }
                    );
                }
            },
            {
                favorites : (recommendationMode === exports.shared.recommendation_options.favorites),
                smart : (recommendationMode === exports.shared.recommendation_options.smart),
                hidden : (recommendationMode === exports.shared.recommendation_options.hidden)
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
                error_messages : ["Resource with uri ." + req.params.requestedResourceUri + " does not exist in this Dendro instance."]
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
    const ie = new InformationElement(
        {
            uri: resourceUri
        }
    );

    ie.getOwnerProject(function(err, ownerProject) {
        const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;

        if (isNull(err) && ownerProject instanceof Project) {
            const projectUri = ownerProject.uri;


            let includeOnlyFavorites = !isNull(options) && options[exports.shared.recommendation_options.favorites];
            const smartRecommendationMode = !isNull(options) && options[exports.shared.recommendation_options.smart];
            let includeOnlyHiddenDescriptors = !isNull(options) && options[exports.shared.recommendation_options.hidden];

            /**
             * Get Most Used Descriptors
             * @param callback
             */
            const getMostUsedPublicDescriptors = function (callback) {
                Descriptor.mostUsedPublicDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, mostUsedDescriptors) {
                    return callback(error, mostUsedDescriptors);
                }, allowedOntologies);
            };

            /**
             * Get Recently Used Descriptors
             * @param callback
             */
            const getUsersMostUsedDescriptors = function (userUri, callback) {
                User.findByUri(userUri, function (err, user) {
                    if (isNull(err)) {
                        user.mostRecentlyFilledInDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, mostRecentlyFilledIn) {
                            return callback(error, mostRecentlyFilledIn);
                        }, allowedOntologies);
                    }
                    else {
                        const error = "Error fetching user : " + user + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };


            /**
             * Get User's favorite descriptors
             * @param callback
             */
            const getUsersFavoriteDescriptors = function (userUri, callback) {
                User.findByUri(userUri, function (err, user) {
                    if (isNull(err)) {
                        user.favoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites) {
                            return callback(error, favorites);
                        }, allowedOntologies);
                    }
                    else {
                        const error = "Error fetching user : " + user + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get User's favorite descriptors
             * @param callback
             */
            const getUsersHiddenDescriptors = function (userUri, callback) {
                User.findByUri(userUri, function (err, user) {
                    if (isNull(err)) {
                        user.hiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, hidden) {
                            return callback(error, hidden);
                        }, allowedOntologies);
                    }
                    else {
                        const error = "Error fetching user : " + user + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get Project's favorite descriptors
             * @param callback
             */
            const getProjectsFavoriteDescriptors = function (projectUri, callback) {
                const Project = require('./project.js').Project;

                Project.findByUri(projectUri, function (err, project) {
                    if (isNull(err)) {
                        if (!isNull(project)) {
                            project.getFavoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites) {
                                return callback(error, favorites);
                            }, allowedOntologies);
                        }
                        else {
                            const error = "Project with uri : " + projectUri + " is not registered in this Dendro instance.";
                            console.error(error);
                            return callback(1, error);
                        }
                    }
                    else {
                        const error = "Error fetching project : " + project + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };

            const getProjectsHiddenDescriptors = function (projectUri, callback) {
                const Project = require('./project.js').Project;

                Project.findByUri(projectUri, function (err, project) {
                    if (!isNull(err)) {
                        if (!isNull(project)) {
                            project.getHiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, hidden) {
                                return callback(error, hidden);
                            }, allowedOntologies);
                        }
                        else {
                            const error = "Project with uri : " + projectUri + " is not registered in this Dendro instance.";
                            console.error(error);
                            return callback(1, error);
                        }
                    }
                    else {
                        const error = "Error fetching project : " + project + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get descriptors used in textually similar resources
             * @param callback
             */
            const getDescriptorsFromTextuallySimilarResources = function (resourceUri, callback) {
                const resource = new Resource(
                    {
                        uri: resourceUri
                    }
                );

                resource.getTextuallySimilarResources(indexConnection, Config.limits.index.maxResults, function (err, similarResources) {
                    if (!isNull(err) && !isNull(similarResources) && similarResources instanceof Array) {
                        //get properties of the similar resources
                        const getDescriptorsOfSimilarResources = function (resource, callback) {
                            resource.getPropertiesFromOntologies(allowedOntologies, function (err, descriptors) {
                                if (isNull(err)) {
                                    for (let i = 0; i < descriptors.length; i++) {
                                        descriptors[i].recommendation_types = {};
                                        descriptors[i].recommendation_types[Descriptor.recommendation_types.from_textually_similar.key] = true;
                                    }
                                }

                                return callback(err, resource); //null as 1st argument === no error
                            });
                        };

                        async.map(similarResources, getDescriptorsOfSimilarResources, function (err, similarResourcesWithDescriptors) {
                            return callback(err, similarResourcesWithDescriptors);
                        });
                    }
                    else {
                        const error = "Error fetching similar resources : " + similarResources + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get user's favorite descriptors that are most accepted in the metadata editor
             */
            const getUsersMostAcceptedFavoriteDescriptorsInMetadataEditor = function (userUri, callback) {
                User.findByUri(userUri, function (err, user) {
                    if (isNull(isNull(err))) {
                        user.mostAcceptedFavoriteDescriptorsInMetadataEditor(Config.recommendation.max_suggestions_of_each_type, function (error, hidden) {
                            return callback(error, hidden);
                        }, allowedOntologies);
                    }
                    else {
                        const error = "Error fetching user : " + user + " : " + err;
                        console.error(error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get user's smart descriptors that are most accepted in the metadata editor
             */
            const getUsersMostAcceptedSmartDescriptorsInMetadataEditor = function (userUri, callback) {
                User.findByUri(userUri, function (err, user) {
                    if (isNull(err)) {
                        user.mostAcceptedSmartDescriptorsInMetadataEditor(Config.recommendation.max_suggestions_of_each_type, function (error, hidden) {
                            return callback(error, hidden);
                        }, allowedOntologies);
                    }
                    else {
                        const error = "Error fetching user : " + user + " : " + err;
                        console.error(error);
                        return callback(1, error);
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
                    if (isNull(err))
                    {
                        /**
                         * fill in with random descriptors from the currently
                         * allowed ontologies until we have the needed
                         * recommendations
                         * **/
                        const flattenAndMergeDescriptors = function (results) {
                            const initDescriptorsHash = function (descriptorsArray) {
                                const hash = {};

                                for (let i = 0; i < descriptorsArray.length; i++) {
                                    const descriptor = new Descriptor({
                                        uri: descriptorsArray[i].uri
                                    });

                                    if (isNull(hash[descriptor.prefix])) {
                                        hash[descriptor.prefix] = {};
                                    }

                                    if (isNull(hash[descriptor.prefix][descriptor.shortName])) {
                                        hash[descriptor.prefix][descriptor.shortName] = null;
                                    }
                                }

                                return hash;
                            };

                            const flatResults = _.compact(_.flatten(results));
                            const descriptors = initDescriptorsHash(flatResults);
                            let d;
                            let i;

                            for (i = 0; i < flatResults.length; i++) {
                                const dummyToParseUri = new Descriptor(flatResults[i]);
                                const descriptorPrefix = dummyToParseUri.prefix;
                                const descriptorShortName = dummyToParseUri.shortName;

                                d = descriptors[descriptorPrefix][descriptorShortName];

                                if (isNull(d)) {
                                    d = new Descriptor(flatResults[i]);
                                }

                                if (typeof flatResults[i].recent_use_count !== "undefined") {
                                    d.recent_use_count = flatResults[i].recent_use_count;
                                }
                                if (typeof flatResults[i].overall_use_count !== "undefined") {
                                    d.overall_use_count = flatResults[i].overall_use_count;
                                }
                                if (typeof flatResults[i].times_smart_accepted_in_md_editor !== "undefined") {
                                    d.times_smart_accepted_in_md_editor = flatResults[i].times_smart_accepted_in_md_editor;
                                }
                                if (typeof flatResults[i].times_favorite_accepted_in_md_editor !== "undefined") {
                                    d.times_favorite_accepted_in_md_editor = flatResults[i].times_favorite_accepted_in_md_editor;
                                }
                                if (typeof flatResults[i].last_use !== "undefined") {
                                    d.last_use = flatResults[i].last_use;
                                }

                                descriptors[descriptorPrefix][descriptorShortName] = d;
                            }

                            for (i = 0; i < flatResults.length; i++) {
                                d = new Descriptor(flatResults[i]);

                                let fused_result_types = descriptors[d.prefix][d.shortName].recommendation_types;
                                if (typeof fused_result_types === "undefined") {
                                    fused_result_types = {};
                                }

                                let result_rec_types;
                                if (flatResults[i].recommendation_types instanceof Object) {
                                    try {
                                        result_rec_types = Object.keys(flatResults[i].recommendation_types);
                                    }
                                    catch (e) {
                                        console.error("Estourei onde devia");
                                    }


                                    if (typeof result_rec_types === "undefined")
                                        result_rec_types = [];

                                    //copy rec types from the result
                                    for (let j = 0; j < result_rec_types.length; j++) {
                                        const result_rec_type = result_rec_types[j];
                                        fused_result_types[result_rec_type] = true;
                                    }
                                }

                                descriptors[d.prefix][d.shortName].recommendation_types = fused_result_types;
                            }

                            const flatDescriptors = [];

                            for (let prefix in descriptors) {
                                if (descriptors.hasOwnProperty(prefix)) {
                                    for (let shortName in descriptors[prefix]) {
                                        if (descriptors[prefix].hasOwnProperty(shortName)) {
                                            var descriptor = descriptors[prefix][shortName];

                                            if (includeOnlyFavorites) {
                                                if (descriptor.recommendation_types[Descriptor.recommendation_types.project_favorite.key]
                                                    ||
                                                    descriptor.recommendation_types[Descriptor.recommendation_types.user_favorite.key]) {
                                                    flatDescriptors.push(descriptor);
                                                }
                                            }
                                            else if (includeOnlyHiddenDescriptors) {
                                                if (descriptor.recommendation_types[Descriptor.recommendation_types.project_hidden.key]
                                                    ||
                                                    descriptor.recommendation_types[Descriptor.recommendation_types.user_hidden.key]) {
                                                    flatDescriptors.push(descriptor);
                                                }
                                            }
                                            else {
                                                flatDescriptors.push(descriptor);
                                            }
                                        }
                                    }
                                }
                            }

                            return flatDescriptors;
                        };

                        const rankDescriptors = function (descriptors) {
                            for (let i = 0; i < descriptors.length; i++) {
                                var descriptor = descriptors[i];

                                //console.log("Ranking descriptor " + descriptor.prefixedForm);

                                let score = descriptor.score;

                                if (isNull(score)) {
                                    score = 0;
                                }

                                let rec_types = {};

                                if (typeof descriptor.recommendation_types !== "undefined") {
                                    rec_types = descriptor.recommendation_types;
                                }
                                else {
                                    rec_types = {};
                                }

                                //Hidden descriptors have Zero Score!
                                if (rec_types[Descriptor.recommendation_types.user_hidden.key] || rec_types[Descriptor.recommendation_types.project_hidden.key]) {
                                    score = 0;
                                }
                                else {
                                    //if NOT hidden, calculate score
                                    if (rec_types[Descriptor.recommendation_types.recently_used.key]) {
                                        score += descriptor.recent_use_count *
                                            Descriptor.recommendation_types.recently_used.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.from_textually_similar.key]) {
                                        score += Descriptor.recommendation_types.from_textually_similar *
                                            Descriptor.recommendation_types.from_textually_similar.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.frequently_used_overall.key]) {
                                        score += descriptor.overall_use_count *
                                            Descriptor.recommendation_types.frequently_used_overall.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.random.key]) {
                                        score += Descriptor.recommendation_types.random.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.user_favorite.key]) {
                                        score += Descriptor.recommendation_types.user_favorite.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.project_favorite.key]) {
                                        score += Descriptor.recommendation_types.project_favorite.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.smart_accepted_in_metadata_editor.key]) {
                                        score += descriptor.times_smart_accepted_in_md_editor *
                                            Descriptor.recommendation_types.smart_accepted_in_metadata_editor.weight;
                                    }
                                    if (rec_types[Descriptor.recommendation_types.favorite_accepted_in_metadata_editor.key]) {
                                        score += descriptor.times_favorite_accepted_in_md_editor *
                                            Descriptor.recommendation_types.favorite_accepted_in_metadata_editor.weight;
                                    }
                                }

                                descriptor.score = score;
                                descriptors[i] = descriptor;
                            }


                            descriptors = _.sortBy(descriptors, function (descriptor) {
                                return descriptor.score;
                            });

                            descriptors = descriptors.reverse();

                            return descriptors;
                        };

                        const applyPaging = function (rankedDescriptors, page) {
                            if (!isNull(page)) {
                                const skip = page * Config.recommendation.recommendation_page_size;
                                rankedDescriptors = rankedDescriptors.slice(skip, skip + Config.recommendation.recommendation_page_size);
                            }
                            else {
                                rankedDescriptors = rankedDescriptors.slice(0, Config.recommendation.recommendation_page_size);
                            }

                            return rankedDescriptors;
                        };

                        const padWithRandomDescriptors = function (results, callback) {
                            const numberOfDescriptorsRequiredForPadding = Config.recommendation.recommendation_page_size - results.length;

                            Descriptor.getRandomDescriptors(allowedOntologies, numberOfDescriptorsRequiredForPadding, function (err, randomDescriptors) {
                                if (isNull(err) && !isNull(randomDescriptors)) {
                                    results = results.concat(randomDescriptors);
                                    return callback(err, results);
                                }
                                else {
                                    const msg = "Error occurred when padding recommended descriptors list with random descriptors: " + err + ". Error reported: " + JSON.stringify(randomDescriptors);
                                    console.error(msg);
                                    return callback(err, msg);
                                }
                            });
                        };

                        const removeDuplicates = function (results) {
                            const uniques = _.uniq(results, false, function (result) {
                                return result.uri;
                            });

                            return uniques;
                        };

                        const removeLockedAndPrivate = function (results) {
                            const filtered = _.filter(results, function (result) {
                                let isLockedOrPrivate = (result.locked || result.private);
                                return !isLockedOrPrivate;
                            });

                            return filtered;
                        };

                        results = flattenAndMergeDescriptors(results);
                        results = rankDescriptors(results);
                        results = removeLockedAndPrivate(results);

                        const uuid = require("uuid");
                        const recommendation_call_id = uuid.v4();
                        const recommendation_call_timestamp = new Date().toISOString();
                        for(var i = 0; i < results.length; i++)
                        {
                            results[i].recommendationCallId = recommendation_call_id;
                            results[i].recommendationCallTimeStamp = recommendation_call_timestamp;
                        }

                        if(!includeOnlyFavorites && !includeOnlyHiddenDescriptors)
                        {
                            results = applyPaging(results, page);
                        }

                        if(includeOnlyFavorites || includeOnlyHiddenDescriptors)
                        {
                            /**
                             * In case we only want favorites, no need to pad with random descriptors
                             */

                            return callback(null, results)
                        }
                        else if (results.length < Config.recommendation.recommendation_page_size && !includeOnlyFavorites && !includeOnlyHiddenDescriptors)
                        {
                            padWithRandomDescriptors(results, function(err, results){
                                results = removeDuplicates(results);
                                return callback(err, results);
                            });
                        }
                        else
                        {
                            return callback(null, results);
                        }
                    }
                    else
                    {
                        const error_messages = [];
                        for(var i = 0; i < results.length; i++)
                        {
                            if(!(results[i] instanceof Array))
                            {
                                error_messages.push(results[i]);
                            }
                        }

                        const msg = "Error performing final ranking of descriptors. Error reported : " + err + ", Errors reported  " + JSON.stringify(error_messages);
                        console.log(msg);
                        return callback(err, msg);
                    }
                });
        }
        else {
            callback(err, ownerProject);
        }
    });
};