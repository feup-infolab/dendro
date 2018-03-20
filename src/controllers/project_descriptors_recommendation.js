const path = require("path");
const Pathfinder = global.Pathfinder;
const IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Project = require(Pathfinder.absPathInSrcFolder("/models//project.js")).Project;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

const _ = require("underscore");
const async = require("async");

exports.recommend_descriptors = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    let acceptsJSON = req.accepts("json");

    if (!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message: "HTML Request not valid for this route."
        });
    }
    else
    {
        const resourceUri = req.params.requestedResourceUri;
        let userUri = null;

        if (!isNull(req.user))
        {
            userUri = req.user.uri;
        }

        const allowedOntologies = _.map(Config.public_ontologies, function (prefix)
        {
            return Ontology.allOntologies[prefix].uri;
        });

        const indexConnection = IndexConnection.getDefault();

        exports.shared.recommend_descriptors(resourceUri, userUri, req.query.page, allowedOntologies, indexConnection, function (err, descriptors)
        {
            if (isNull(err))
            {
                res.json(
                    {
                        result: "ok",
                        descriptors: descriptors
                    }
                );
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "There was an error fetching the descriptors",
                    error: descriptors
                });
            }
        }, {
            page_number: req.query.page,
            page_size: req.query.page_size
        });
    }
};

exports.shared = {};

exports.shared.recommendation_options = {
    favorites: "favorites",
    smart: "smart",
    hidden: "hidden"
};

exports.shared.recommend_descriptors = function (resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    if (isNull(allowedOntologies))
    {
        allowedOntologies = _.map(Config.public_ontologies, function (prefix)
        {
            return Ontology.allOntologies[prefix].uri;
        });
    }

    const getOwnerProjectUri = function (callback)
    {
        //TODO THIS IS NEW STUFF
        /*
        if (req.params.showing_project_root)
        {
            callback(null, req.params.requestedResourceUri);
        }
        else
        {*/
            const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
            const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;

            Project.findByUri(resourceUri, function (err, projectData)
            {
                if(isNull(err))
                {
                    if (!isNull(projectData) && projectData instanceof Project)
                    {
                        callback(null, resourceUri);
                    }
                    else
                    {
                        InformationElement.findByUri(resourceUri, function (err, ie)
                        {
                            if (isNull(err))
                            {
                                if (!isNull(ie) && ie instanceof InformationElement)
                                {
                                    ie.getOwnerProject(function (err, result)
                                    {
                                        if (isNull(err))
                                        {
                                            if (result instanceof Project)
                                            {
                                                callback(err, result.uri);
                                            }
                                            else
                                            {
                                                const msg = "Result is not a project while getting parent project of information element with uri " + resourceUri + " when fetching recommend_descriptors.";
                                                Logger.log("error", msg);
                                                callback(1, msg);
                                            }
                                        }
                                        else
                                        {
                                            const msg = "Error while getting parent project of information element with uri " + resourceUri + " when fetching recommend_descriptors.";
                                            Logger.log("error", msg);
                                            callback(1, msg);
                                        }
                                    });
                                }
                                else
                                {
                                    const msg = "Unable to retrieve information element with uri " + resourceUri + " when fetching recommend_descriptors.";
                                    Logger.log("error", msg);
                                    callback(1, msg);
                                }
                            }
                            else
                            {
                                const msg = "Error while retrieving information element with uri " + resourceUri + " when fetching recommend_descriptors.";
                                Logger.log("error", msg);
                                callback(1, msg);
                            }
                        });
                    }
                }
                else
                {
                    const msg = "Error while retrieving Project with uri " + resourceUri + " when fetching recommend_descriptors.";
                    Logger.log("error", msg);
                    callback(1, msg);
                }
            });
        /*}*/
    };

    /*
    Descriptor.all_in_ontologies(allowedOntologies, function (err, descriptors)
    {
        if (isNull(err))
        {
            const uuid = require("uuid");
            const recommendation_call_id = uuid.v4();
            const recommendation_call_timestamp = new Date().toISOString();

            for (let i = 0; i < descriptors.length; i++)
            {
                descriptors[i].recommendation_types = {};
                descriptors[i].recommendation_types[Descriptor.recommendation_types.project_descriptors.key] = true;
                descriptors[i].recommendationCallId = recommendation_call_id;
                descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
            }

            return callback(null, descriptors);
        }
        return callback(err, []);
    }, options.page_number, options.page_size);
    */

    Descriptor.all_in_ontologies(allowedOntologies, function (err, descriptors)
    {
        if (isNull(err))
        {
            //TODO set here the favorite/hidden properties
            //HERE
            /**
             * Get User's favorite descriptors
             * @param callback
             */
            const getUsersFavoriteDescriptors = function (userUri, callback)
            {
                User.findByUri(userUri, function (err, user)
                {
                    if (isNull(err))
                    {
                        user.favoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites)
                        {
                            return callback(error, favorites);
                        }, allowedOntologies);
                    }
                    else
                    {
                        const error = "Error fetching user : " + user + " : " + err;
                        Logger.log("error", error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get Project's favorite descriptors
             * @param callback
             */
            const getProjectsFavoriteDescriptors = function (projectUri, callback)
            {
                Project.findByUri(projectUri, function (err, project)
                {
                    if (isNull(err) && !isNull(project))
                    {
                        project.getFavoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites)
                        {
                            return callback(error, favorites);
                        }, allowedOntologies);
                    }
                    else
                    {
                        const error = "Error fetching project : " + project + " : " + err;
                        Logger.log("error", error);
                        return callback(1, error);
                    }
                });
            };

            /**
             * Get User's favorite descriptors
             * @param callback
             */
            const getUsersHiddenDescriptors = function (userUri, callback)
            {
                User.findByUri(userUri, function (err, user)
                {
                    if (isNull(err))
                    {
                        user.hiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites)
                        {
                            return callback(error, favorites);
                        }, allowedOntologies);
                    }
                    else
                    {
                        const error = "Error fetching user : " + user + " : " + err;
                        Logger.log("error", error);
                        return callback(1, error);
                    }
                });
            };

            const getProjectsHiddenDescriptors = function (projectUri, callback)
            {
                Project.findByUri(projectUri, function (err, project)
                {
                    if (isNull(err))
                    {
                        project.getHiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, hidden)
                        {
                            return callback(error, hidden);
                        }, allowedOntologies);
                    }
                    else
                    {
                        const error = "Error fetching project : " + project + " : " + err;
                        Logger.log("error", error);
                        return callback(1, error);
                    }
                });
            };

            const getDCTermsDescriptors = function (callback)
            {
                Descriptor.dublinCoreElements(function (error, dcElementsDescriptors)
                {
                    if (isNull(err))
                    {
                        return callback(error, dcElementsDescriptors);
                    }

                    Logger.log("error", "Error fetching DC Elements Descriptors : " + err);
                    return callback(1, error);
                });
            };

            getOwnerProjectUri(function (err, projectUri)
            {
                if (isNull(err))
                {
                    async.series(
                        [
                            function (callback)
                            {
                                if (isNull(userUri))
                                {
                                    return callback(null, []);
                                }
                                getUsersFavoriteDescriptors(userUri, callback);
                            },
                            function (callback)
                            {
                                if (typeof resourceUri === "undefined")
                                {
                                    return callback(null, []);
                                }
                                getProjectsFavoriteDescriptors(projectUri, callback);
                            },
                            function (callback)
                            {
                                if (isNull(userUri))
                                {
                                    return callback(null, []);
                                }
                                getUsersHiddenDescriptors(userUri, callback);
                            },
                            function (callback)
                            {
                                if (typeof resourceUri === "undefined")
                                {
                                    return callback(null, []);
                                }
                                getProjectsHiddenDescriptors(projectUri, callback);
                            },
                            function (callback)
                            {
                                getDCTermsDescriptors(callback);
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
                                let typeDetected = function (results, descriptor)
                                {
                                    return _.find(results, function (userFavoriteDescriptor)
                                    {
                                        return userFavoriteDescriptor.uri === descriptor.uri;
                                    });
                                };

                                async.map(descriptors, function (descriptor, cb)
                                {
                                    descriptor.recommendation_types = {};

                                    if (typeDetected(results[0], descriptor))
                                    {
                                        descriptor.recommendation_types[Descriptor.recommendation_types.user_favorite.key] = true;
                                    }

                                    if (typeDetected(results[1], descriptor))
                                    {
                                        descriptor.recommendation_types[Descriptor.recommendation_types.project_favorite.key] = true;
                                    }

                                    if (typeDetected(results[2], descriptor))
                                    {
                                        descriptor.recommendation_types[Descriptor.recommendation_types.user_hidden.key] = true;
                                    }

                                    if (typeDetected(results[3], descriptor))
                                    {
                                        descriptor.recommendation_types[Descriptor.recommendation_types.project_hidden.key] = true;
                                    }

                                    if (typeDetected(results[4], descriptor))
                                    {
                                        descriptor.recommendation_types[Descriptor.recommendation_types.dc_element_forced.key] = true;
                                    }
                                    cb(null, null);
                                }, function (err, results)
                                {
                                    /*
                                 Sort descriptors alphabetically
                                 */
                                    descriptors = _.sortBy(descriptors, function (descriptor)
                                    {
                                        return descriptor.label;
                                    });

                                    const removeDuplicates = function (results)
                                    {
                                        const uniques = _.uniq(results, false, function (result)
                                        {
                                            return result.uri;
                                        });

                                        return uniques;
                                    };

                                    const removeLockedAndPrivate = function (results)
                                    {
                                        const filtered = _.filter(results, function (result)
                                        {
                                            let isLockedOrPrivate = (result.locked || result.private);
                                            return !isLockedOrPrivate;
                                        });

                                        return filtered;
                                    };

                                    descriptors = removeDuplicates(descriptors);
                                    descriptors = removeLockedAndPrivate(descriptors);

                                    const uuid = require("uuid");
                                    const recommendation_call_id = uuid.v4();
                                    const recommendation_call_timestamp = new Date().toISOString();

                                    for (let i = 0; i < descriptors.length; i++)
                                    {
                                        /*
                                        descriptors[i].recommendationCallId = recommendation_call_id;
                                        descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
                                        */
                                        descriptors[i].recommendation_types[Descriptor.recommendation_types.project_descriptors.key] = true;
                                        descriptors[i].recommendationCallId = recommendation_call_id;
                                        descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
                                    }

                                    /*
                                    res.json(
                                        {
                                            result: "ok",
                                            descriptors: descriptors
                                        }
                                    );
                                    */
                                    return callback(err, descriptors);
                                });
                            }
                            else
                            {
                                /*
                                res.status(500).json(
                                    {
                                        result: "error",
                                        error_messages: [results]
                                    }
                                );
                                */
                                return callback(err, projectUri);
                            }
                        });
                }
                else
                {
                    /*
                    res.status(500).json(
                        {
                            result: "error",
                            error_messages: [projectUri]
                        }
                    );
                    */
                    return callback(err, projectUri);
                }
            });
            //END

            //TODO THIS IS THE OLD CODE
            /*
            const uuid = require("uuid");
            const recommendation_call_id = uuid.v4();
            const recommendation_call_timestamp = new Date().toISOString();

            for (let i = 0; i < descriptors.length; i++)
            {
                descriptors[i].recommendation_types = {};
                descriptors[i].recommendation_types[Descriptor.recommendation_types.project_descriptors.key] = true;
                descriptors[i].recommendationCallId = recommendation_call_id;
                descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
            }

            return callback(null, descriptors);
            */
        }
        else
        {

            callback(err, JSON.stringify(descriptors));
        }
        //return callback(err, []);
    }, options.page_number, options.page_size);
};
