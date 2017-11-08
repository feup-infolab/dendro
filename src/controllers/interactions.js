const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

const async = require("async");
const needle = require("needle");
const _ = require("underscore");

const addOntologyToListOfActiveOntologiesInSession = function (ontology, req)
{
    if (isNull(req.user.recommendations))
    {
        req.user.recommendations = {};
    }

    if (isNull(req.user.recommendations.ontologies))
    {
        req.user.recommendations.ontologies = {};
    }

    if (isNull(req.user.recommendations.ontologies.accepted))
    {
        req.user.recommendations.ontologies.accepted = {};
    }

    req.user.recommendations.ontologies.accepted[ontology.prefix] = ontology;

    return req;
};

// TODO resource has to be generic, and project has to be the project of the currently selected resource
const recordInteractionOverAResource = function (user, resource, req, res)
{
    if (!isNull(user) && !isNull(resource.uri))
    {
        if (!isNull(resource.recommendedFor) && typeof resource.recommendedFor === "string")
        {
            InformationElement.findByUri(resource.recommendedFor, function (err, ie)
            {
                if (!err)
                {
                    if (!isNull(ie))
                    {
                        ie.getOwnerProject(function (err, project)
                        {
                            if (isNull(err))
                            {
                                if (!isNull(project))
                                {
                                    project.getCreatorsAndContributors(function (err, contributors)
                                    {
                                        if (isNull(err) && !isNull(contributors) && contributors instanceof Array)
                                        {
                                            const createInteraction = function ()
                                            {
                                                Interaction.create({
                                                    ddr: {
                                                        performedBy: user.uri,
                                                        interactionType: req.body.interactionType,
                                                        executedOver: resource.uri,
                                                        originallyRecommendedFor: req.body.recommendedFor,
                                                        rankingPosition: req.body.rankingPosition,
                                                        pageNumber: req.body.pageNumber,
                                                        recommendationCallId: req.body.recommendationCallId,
                                                        recommendationCallTimeStamp: req.body.recommendationCallTimeStamp
                                                    }
                                                }, function (err, interaction)
                                                {
                                                    interaction.save(
                                                        function (err, result)
                                                        {
                                                            if (isNull(err))
                                                            {
                                                                interaction.saveToMySQL(function (err, result)
                                                                {
                                                                    if (isNull(err))
                                                                    {
                                                                        const msg = "Interaction of type " + req.body.interactionType + " over resource " + resource.uri + " in the context of resource " + req.body.recommendedFor + " recorded successfully";
                                                                        console.log(msg);
                                                                        return res.json({
                                                                            result: "OK",
                                                                            message: msg
                                                                        });
                                                                    }
                                                                    const msg = "Error saving interaction of type " + req.body.interactionType + " over resource " + resource.uri + " in the context of resource " + req.body.recommendedFor + " to MYSQL. Error reported: " + result;
                                                                    console.log(msg);
                                                                    return res.json({
                                                                        result: "OK",
                                                                        message: msg
                                                                    });
                                                                });
                                                            }
                                                            else
                                                            {
                                                                const msg = "Error recording interaction over resource " + resource.uri + " in the context of resource " + req.body.recommendedFor + " : " + result;
                                                                console.error(msg);
                                                                return res.status(500).json({
                                                                    result: "Error",
                                                                    message: msg
                                                                });
                                                            }
                                                        });
                                                });
                                            };

                                            for (let i = 0; i < contributors.length; i++)
                                            {
                                                if (contributors[i].uri === user.uri)
                                                {
                                                    createInteraction();
                                                    return;
                                                }
                                            }

                                            const msg = "Unable to record interactions for resources of projects of which you are not a creator or contributor. User uri:  " + user.uri + ". Resource in question" + resource.uri + ". Owner project " + project.uri;
                                            console.error(msg);
                                            res.status(400).json({
                                                result: "Error",
                                                message: msg
                                            });
                                        }
                                        else
                                        {
                                            const msg = "Unable to retrieve creators and contributors of parent project " + project.uri + " of resource " + resource.uri;
                                            console.error(msg);
                                            res.status(500).json({
                                                result: "Error",
                                                message: msg
                                            });
                                        }
                                    });
                                }
                            }
                            else
                            {
                                const msg = "Unable to retrieve parent project of resource " + resource.uri;
                                console.error(msg);
                                res.status(404).json({
                                    result: "Error",
                                    message: msg
                                });
                            }
                        });
                    }
                    else
                    {
                        const msg = "Resource with uri " + resource.recommendedFor + " not found in this system.";
                        console.error(JSON.stringify(resource));
                        console.error(msg);
                        res.status(404).json({
                            result: "Error",
                            message: msg
                        });
                    }
                }
                else
                {
                    const msg = "Error retriving resource " + resource.recommendedFor;
                    console.error(JSON.stringify(resource));
                    console.error(msg);
                    res.status(500).json({
                        result: "Error",
                        message: msg
                    });
                }
            });
        }
        else
        {
            const msg = "Request Body JSON is invalid since it has no 'recommendedFor' field, which should contain the current URL when the interaction took place. Either that, or the field is not a string as it should be.";
            console.error(JSON.stringify(resource));
            console.error(msg);
            res.status(400).json({
                result: "Error",
                message: msg
            });
        }
    }
    else
    {
        const msg = "Error recording interaction over resource " + resource.uri + " : No user is currently authenticated!";
        console.error(msg);
        res.status(500).json({
            result: "Error",
            message: msg
        });
    }
};

exports.accept_descriptor_from_quick_list = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_quick_list.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_quick_list.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_manual_list.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_manual_list.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list_while_it_was_a_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list_while_it_was_a_user_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_quick_list_while_it_was_a_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting descriptor from quick list while ie was a project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_quick_list_while_it_was_a_user_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting descriptor from quick list while ie was a user favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting descriptor from quick list while ie was a user and project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.hide_descriptor_from_quick_list_for_project = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.hide_descriptor_from_quick_list_for_project.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.hide_descriptor_from_quick_list_for_project.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when hiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unhide_descriptor_from_quick_list_for_project = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.unhide_descriptor_from_quick_list_for_project.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.unhide_descriptor_from_quick_list_for_project.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when unhiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.hide_descriptor_from_quick_list_for_user = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.hide_descriptor_from_quick_list_for_user.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.hide_descriptor_from_quick_list_for_user.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when hiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unhide_descriptor_from_quick_list_for_user = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.unhide_descriptor_from_quick_list_for_user.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.unhide_descriptor_from_quick_list_for_user.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when unhiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.favorite_descriptor_from_quick_list_for_project = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.favorite_descriptor_from_quick_list_for_project.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.favorite_descriptor_from_quick_list_for_project.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.favorite_descriptor_from_quick_list_for_user = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.favorite_descriptor_from_quick_list_for_user.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.favorite_descriptor_from_quick_list_for_user.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unfavorite_descriptor_from_quick_list_for_project = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.unfavorite_descriptor_from_quick_list_for_project.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.unfavorite_descriptor_from_quick_list_for_project.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unfavorite_descriptor_from_quick_list_for_user = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.unfavorite_descriptor_from_quick_list_for_user.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.unfavorite_descriptor_from_quick_list_for_user.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_autocomplete = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_descriptor_from_autocomplete.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_autocomplete.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_smart_descriptor_in_metadata_editor = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_smart_descriptor_in_metadata_editor.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                // req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_smart_descriptor_in_metadata_editor.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting descriptor in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_favorite_descriptor_in_metadata_editor = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.accept_favorite_descriptor_in_metadata_editor.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                // req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_favorite_descriptor_in_metadata_editor.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting favorite descriptor in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.delete_descriptor_in_metadata_editor = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.delete_descriptor_in_metadata_editor.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                // req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.delete_descriptor_in_metadata_editor.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when deleting descriptor in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_in_metadata_editor = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_manual_list_in_metadata_editor.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                // req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_descriptor_from_manual_list_in_metadata_editor.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when filling in descriptor from manual list in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_in_metadata_editor = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_quick_list_in_metadata_editor.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                // req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_descriptor_from_quick_list_in_metadata_editor.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list while it was a project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list while it was a user favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite.key)
        {
            const descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                const ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list while it was a user and project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.select_ontology_manually = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.select_ontology_manually.key)
        {
            if (!isNull(req.user))
            {
                const ontology = new Ontology({
                    uri: req.body.uri
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.select_ontology_manually.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.select_descriptor_manually = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (typeof req.body.interactionType === Interaction.types.select_descriptor_from_manual_list.key)
        {
            if (!isNull(req.user))
            {
                const descriptor = new Descriptor({
                    uri: req.body.uri
                });

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.select_descriptor_from_manual_list.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting a descriptor manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.reject_ontology_from_quick_list = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.reject_ontology_from_quick_list.key)
        {
            if (!isNull(req.user))
            {
                const ontology = new Ontology({
                    uri: req.body.uri
                });

                if (!isNull(req.user.recommendations.ontologies.accepted))
                {
                    delete req.user.recommendations.ontologies.accepted[ontology.prefix];

                    recordInteractionOverAResource(req.user, req.body, req, res);

                    res.json({
                        result: "OK",
                        message: "Ontology " + ontology.uri + " removed successfully"
                    });
                }
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.reject_ontology_from_quick_list.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON"
        });
    }
};

exports.fill_in_inherited_descriptor = function (req, res)
{
    if (req.body instanceof Object)
    {
        if (req.body.interactionType === Interaction.types.fill_in_inherited_descriptor.key)
        {
            if (!isNull(req.user))
            {
                const descriptor = new Descriptor({
                    uri: req.body.uri
                });

                recordInteractionOverAResource(req.user, req.body, req, res);
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Invalid interaction type in the request's body. It should be : " + Interaction.types.fill_in_inherited_descriptor.key
            });
        }
    }
    else
    {
        res.status(500).json({
            result: "Error",
            message: "Invalid request. Body contents is not a valid JSON when accepting a descriptor manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.delete_all_interactions = function (req, res)
{
    Interaction.deleteAllOfMyTypeAndTheirOutgoingTriples(function (err, result)
    {
        if (isNull(err))
        {
            res.json({
                result: "OK",
                message: "All interactions successfully deleted."
            });
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "There was an error deleting all the interactions recorded by the system : " + result
            });
        }
    });
};
