const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Ontology = require(Config.absPathInSrcFolder("/models//meta/ontology.js")).Ontology;
const Project = require(Config.absPathInSrcFolder("/models//project.js")).Project;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;

const async = require('async');
const _ = require('underscore');

exports.descriptors_autocomplete = function(req, res) {

    if(!isNull(req.params.requestedResource))
    {
        Descriptor.findByLabelOrComment(
            req.query.descriptor_autocomplete,
            Config.recommendation.max_autocomplete_results,
            function(err, descriptors)
            {
                if(!err)
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
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        if (typeof req.query.project_handle !== "undefined")
        {
            const project_handle = req.query.project_handle;

            if(typeof req.params.ontology_prefix !== "undefined")
            {
                var prefix = req.params.ontology_prefix;

                if(!isNull(prefix))
                {
                    var prefix = req.params.ontology_prefix;
                    Ontology.findByPrefix(prefix, function (err, ontology)
                    {
                        if (!err)
                        {
                            if (!isNull(ontology))
                            {
                                if (!ontology.private)
                                {
                                    Descriptor.all_in_ontology(ontology.uri, function (err, descriptors)
                                    {
                                        if (!err)
                                        {
                                            /**
                                             * Get User's favorite descriptors
                                             * @param callback
                                             */
                                            const getUsersFavoriteDescriptors = function (userUri, callback) {
                                                User.findByUri(userUri, function (err, user) {
                                                    if (!err) {
                                                        user.favoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites) {
                                                            callback(error, favorites);
                                                        }, [ontology]);
                                                    }
                                                    else {
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
                                            const getProjectsFavoriteDescriptors = function (projectHandle, callback) {
                                                Project.findByHandle(projectHandle, function (err, project) {
                                                    if (!err && !isNull(project)) {
                                                        project.getFavoriteDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites) {
                                                            callback(error, favorites);
                                                        }, [ontology]);
                                                    }
                                                    else {
                                                        var error = "Error fetching project : " + project + " : " + err;
                                                        console.error(error);
                                                        callback(1, error);
                                                    }
                                                });
                                            };

                                            /**
                                             * Get User's favorite descriptors
                                             * @param callback
                                             */
                                            const getUsersHiddenDescriptors = function (userUri, callback) {
                                                User.findByUri(userUri, function (err, user) {
                                                    if (!err) {
                                                        user.hiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, favorites) {
                                                            callback(error, favorites);
                                                        }, [ontology]);
                                                    }
                                                    else {
                                                        var error = "Error fetching user : " + user + " : " + err;
                                                        console.error(error);
                                                        callback(1, error);
                                                    }
                                                });
                                            };

                                            const getProjectsHiddenDescriptors = function (projectHandle, callback) {
                                                Project.findByHandle(projectHandle, function (err, project) {
                                                    if (!err) {
                                                        project.getHiddenDescriptors(Config.recommendation.max_suggestions_of_each_type, function (error, hidden) {
                                                            callback(error, hidden);
                                                        }, [ontology]);
                                                    }
                                                    else {
                                                        var error = "Error fetching project : " + project + " : " + err;
                                                        console.error(error);
                                                        callback(1, error);
                                                    }
                                                });
                                            };

                                            const getDCTermsDescriptors = function (callback) {
                                                Descriptor.DCElements(function (error, dcElementsDescriptors) {
                                                    if (!err) {
                                                        callback(error, dcElementsDescriptors);
                                                    }
                                                    else {
                                                        var error = "Error fetching DC Elements Descriptors : " + err;
                                                        console.error(error);
                                                        callback(1, error);
                                                    }
                                                });
                                            };

                                            async.series(
                                                [
                                                    function (callback)
                                                    {
                                                        if (isNull(req.user))
                                                        {
                                                            callback(null, []);
                                                        }
                                                        else
                                                        {
                                                            getUsersFavoriteDescriptors(req.user.uri, callback);
                                                        }
                                                    },
                                                    function (callback)
                                                    {
                                                        if (typeof project_handle === "undefined")
                                                        {
                                                            callback(null, []);
                                                        }
                                                        else
                                                        {
                                                            getProjectsFavoriteDescriptors(project_handle, callback);
                                                        }
                                                    },
                                                    function (callback)
                                                    {
                                                        if (isNull(req.user))
                                                        {
                                                            callback(null, []);
                                                        }
                                                        else
                                                        {
                                                            getUsersHiddenDescriptors(req.user.uri, callback);
                                                        }
                                                    },
                                                    function (callback)
                                                    {
                                                        if (typeof project_handle === "undefined")
                                                        {
                                                            callback(null, []);
                                                        }
                                                        else
                                                        {
                                                            getProjectsHiddenDescriptors(project_handle, callback);
                                                        }
                                                    },
                                                    function(callback)
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
                                                    if (!err)
                                                    {
                                                        for (var i = 0; i < descriptors.length; i++)
                                                        {
                                                            descriptors[i]["recommendation_types"] = {};

                                                            if (_.find(results[0], function (userFavoriteDescriptor)
                                                                {
                                                                    return userFavoriteDescriptor.uri === descriptors[i].uri
                                                                }))
                                                            {
                                                                descriptors[i]["recommendation_types"][Descriptor.recommendation_types.user_favorite.key] = true;
                                                            }

                                                            if (_.find(results[1], function (projectFavoriteDescriptor)
                                                                {
                                                                    return projectFavoriteDescriptor.uri === descriptors[i].uri
                                                                }))
                                                            {
                                                                descriptors[i]["recommendation_types"][Descriptor.recommendation_types.project_favorite.key] = true;
                                                            }

                                                            if (_.find(results[2], function (usersHiddenDescriptor)
                                                                {
                                                                    return usersHiddenDescriptor.uri === descriptors[i].uri
                                                                }))
                                                            {
                                                                descriptors[i]["recommendation_types"][Descriptor.recommendation_types.user_hidden.key] = true;
                                                            }

                                                            if (_.find(results[3], function (projectHiddenDescriptor)
                                                                {
                                                                    return projectHiddenDescriptor.uri === descriptors[i].uri
                                                                }))
                                                            {
                                                                descriptors[i]["recommendation_types"][Descriptor.recommendation_types.project_hidden.key] = true;
                                                            }

                                                            if (_.find(results[4], function (dcElementDescriptor)
                                                                {
                                                                    return dcElementDescriptor.uri === descriptors[i].uri
                                                                }))
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


                                                        descriptors = removeDuplicates(descriptors);
                                                        descriptors = removeLockedAndPrivate(descriptors);

                                                        const uuid = require('uuid');
                                                        const recommendation_call_id = uuid.v4();
                                                        const recommendation_call_timestamp = new Date().toISOString();

                                                        for(let i = 0; i < descriptors.length; i++)
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
                                            error_messages: "Unauthorized. Ontology with prefix " + prefix + " is not public."
                                        }
                                    );
                                }
                            }
                            else
                            {
                                res.status(404).json(
                                    {
                                        result: "error",
                                        error_messages: "Ontology with prefix " + prefix + " does not exist in this Dendro instance."
                                    }
                                );
                            }
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    result: "error",
                                    error_messages: "Error retrieving ontology with prefix " + prefix + " Error reported : " + ontology
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
                            error_messages: "URL is incorrect. Should be /descriptors/from_ontology/<<existing ontology prefix>>"
                        }
                    );
                }
            }
            else
            {
                res.status(400).json({
                    result: "error",
                    message : "Ontology prefix was not specified!"
                })
            }
        }
        else
        {
            res.status(400).json({
                result: "error",
                message : "Project handle was not specified!"
            })
        }
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