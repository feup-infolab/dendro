const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models//meta/ontology.js")).Ontology;
const Project = require(Pathfinder.absPathInSrcFolder("/models//project.js")).Project;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

const async = require("async");
const _ = require("underscore");

exports.descriptors_autocomplete = function(req, res) {

    if(!isNull(req.params.requestedResourceUri))
    {
        Descriptor.findByLabelOrComment(
            req.query.descriptor_autocomplete,
            Config.recommendation.max_autocomplete_results,
            function(err, descriptors)
            {
                if(isNull(err))
                {
                    res.json(
                        descriptors
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            error_messages : [descriptors]
                        }
                    );
                }
            });
    }
};

exports.from_ontology = function(req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const ontologyIdentifier = req.query.descriptors_from_ontology;
        let fetchingFunction;
        const validator = require('validator');

        if(validator.isURL(ontologyIdentifier))
        {
            fetchingFunction = Ontology.findByUri;
        }
        else if(validator.isAlphanumeric)
        {
            fetchingFunction = Ontology.findByPrefix;
        }
        else
        {
            return res.status(400).json({
                result: "error",
                message : "Ontology uri / prefix  was not specified or is invalid!"
            })
        }

        fetchingFunction(ontologyIdentifier, function (err, ontology)
        {
            if (isNull(err))
            {
                if (!isNull(ontology))
                {
                    if (!ontology.private)
                    {
                        Descriptor.all_in_ontology(ontology.uri, function (err, descriptors)
                        {
                            if (isNull(err))
                            {
                                descriptors = _.sortBy(descriptors, function (descriptor)
                                {
                                    return descriptor.label;
                                });

                                const removeDuplicates = function (results)
                                {
                                    let uniques = _.uniq(results, false, function (result)
                                    {
                                        return result.uri;
                                    });

                                    return uniques;
                                };

                                const removeLockedAndPrivate = function (results)
                                {
                                    let filtered = _.filter(results, function (result)
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
                                    descriptors[i].recommendationCallId = recommendation_call_id;
                                    descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
                                }

                                res.json(
                                    {
                                        result: "ok",
                                        "descriptors": descriptors
                                    }
                                );
                            }
                            else
                            {
                                res.status(500).json(
                                    {
                                        result: "error",
                                        error_messages: [descriptors]
                                    }
                                );
                            }
                        });
                    }
                    else
                    {
                        res.status(401).json(
                            {
                                result: "error",
                                error_messages: "Unauthorized. Ontology with prefix or uri " + ontologyIdentifier + " is not public."
                            }
                        );
                    }
                }
                else
                {
                    res.status(404).json(
                        {
                            result: "error",
                            error_messages: "Ontology with prefix or uri " + ontologyIdentifier + " does not exist in this Dendro instance."
                        }
                    );
                }
            }
            else
            {
                res.status(500).json(
                    {
                        result: "error",
                        error_messages: "Error retrieving ontology with prefix " + ontologyIdentifier + " Error reported : " + ontology
                    }
                );
            }
        });
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        console.log(msg);
        res.status(405).render('',
            {
            }
        );
    }
};

exports.from_ontology_in_project = function(req, res)
{
    const validator = require('validator');
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const ontologyIdentifier = req.query.descriptors_from_ontology;
        let fetchingFunction;

        if(validator.isURL(ontologyIdentifier))
        {
            fetchingFunction = Ontology.findByUri;
        }
        else if(validator.isAlphanumeric)
        {
            fetchingFunction = Ontology.findByPrefix;
        }
        else
        {
            return res.status(400).json({
                result: "error",
                message : "Ontology uri / prefix  was not specified or is invalid!"
            })
        }

        fetchingFunction(ontologyIdentifier, function (err, ontology) {
            if (isNull(err))
            {
                if (!isNull(ontology))
                {
                    if (!ontology.private)
                    {
                        Descriptor.all_in_ontology(ontology.uri, function (err, descriptors)
                        {
                            if (isNull(err))
                            {
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
                                            }, [ontology]);
                                        }
                                        else
                                        {
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
                                const getProjectsFavoriteDescriptors = function (projectUri, callback)
                                {
                                    Project.findByUri(projectUri, function (err, project)
                                    {
                                        if (isNull(err) && !isNull(project))
                                        {
                                            project.getFavoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites)
                                            {
                                                return callback(error, favorites);
                                            }, [ontology]);
                                        }
                                        else
                                        {
                                            const error = "Error fetching project : " + project + " : " + err;
                                            console.error(error);
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
                                            }, [ontology]);
                                        }
                                        else
                                        {
                                            const error = "Error fetching user : " + user + " : " + err;
                                            console.error(error);
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
                                            }, [ontology]);
                                        }
                                        else
                                        {
                                            const error = "Error fetching project : " + project + " : " + err;
                                            console.error(error);
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
                                        else
                                        {
                                            const error = "Error fetching DC Elements Descriptors : " + err;
                                            console.error(error);
                                            return callback(1, error);
                                        }
                                    });
                                };

                                async.series(
                                    [
                                        function (callback)
                                        {
                                            if (isNull(req.user))
                                            {
                                                return callback(null, []);
                                            }
                                            else
                                            {
                                                getUsersFavoriteDescriptors(req.user.uri, callback);
                                            }
                                        },
                                        function (callback)
                                        {
                                            if (typeof req.params.requestedResourceUri === "undefined")
                                            {
                                                return callback(null, []);
                                            }
                                            else
                                            {
                                                getProjectsFavoriteDescriptors(req.params.requestedResourceUri, callback);
                                            }
                                        },
                                        function (callback)
                                        {
                                            if (isNull(req.user))
                                            {
                                                return callback(null, []);
                                            }
                                            else
                                            {
                                                getUsersHiddenDescriptors(req.user.uri, callback);
                                            }
                                        },
                                        function (callback)
                                        {
                                            if (typeof req.params.requestedResourceUri === "undefined")
                                            {
                                                return callback(null, []);
                                            }
                                            else
                                            {
                                                getProjectsHiddenDescriptors(req.params.requestedResourceUri, callback);
                                            }
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

                                            for (let i = 0; i < descriptors.length; i++)
                                            {
                                                descriptors[i]["recommendation_types"] = {};

                                                if (typeDetected(results[0], descriptors[i]))
                                                {
                                                    descriptors[i]["recommendation_types"][Descriptor.recommendation_types.user_favorite.key] = true;
                                                }

                                                if (typeDetected(results[1], descriptors[i]))
                                                {
                                                    descriptors[i]["recommendation_types"][Descriptor.recommendation_types.project_favorite.key] = true;
                                                }

                                                if (typeDetected(results[2], descriptors[i]))
                                                {
                                                    descriptors[i]["recommendation_types"][Descriptor.recommendation_types.user_hidden.key] = true;
                                                }

                                                if (typeDetected(results[3], descriptors[i]))
                                                {
                                                    descriptors[i]["recommendation_types"][Descriptor.recommendation_types.project_hidden.key] = true;
                                                }

                                                if (typeDetected(results[4], descriptors[i]))
                                                {
                                                    descriptors[i]["recommendation_types"][Descriptor.recommendation_types.dc_element_forced.key] = true;
                                                }
                                            }

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
                                                descriptors[i].recommendationCallId = recommendation_call_id;
                                                descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
                                            }

                                            res.json(
                                                {
                                                    result: "ok",
                                                    "descriptors": descriptors
                                                }
                                            );
                                        }
                                        else
                                        {
                                            res.status(500).json(
                                                {
                                                    result: "error",
                                                    error_messages: [results]
                                                }
                                            );
                                        }
                                    });
                            }
                            else
                            {
                                res.status(500).json(
                                    {
                                        result: "error",
                                        error_messages: [descriptors]
                                    }
                                );
                            }
                        });
                    }
                    else
                    {
                        res.status(401).json(
                            {
                                result: "error",
                                error_messages: "Unauthorized. Ontology with prefix or uri " + ontologyIdentifier + " is not public."
                            }
                        );
                    }
                }
                else
                {
                    res.status(404).json(
                        {
                            result: "error",
                            error_messages: "Ontology with prefix or uri " + ontologyIdentifier + " does not exist in this Dendro instance."
                        }
                    );
                }
            }
            else
            {
                res.status(500).json(
                    {
                        result: "error",
                        error_messages: "Error retrieving ontology with prefix or uri " + ontologyIdentifier + " Error reported : " + ontology
                    }
                );
            }
        });
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        console.log(msg);
        res.status(405).render('',
            {
            }
        );
    }
};