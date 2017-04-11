var Config = function() { return GLOBAL.Config; }();

var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;

var async = require('async');
var path = require('path');
var needle = require('needle');
var _ = require('underscore');

var addOntologyToListOfActiveOntologiesInSession = function(ontology, req)
{
    if(req.session.user.recommendations == null)
    {
        req.session.user.recommendations = {};
    }

    if(req.session.user.recommendations.ontologies == null)
    {
        req.session.user.recommendations.ontologies = {};
    }

    if(req.session.user.recommendations.ontologies.accepted == null)
    {
        req.session.user.recommendations.ontologies.accepted = {};
    }

    req.session.user.recommendations.ontologies.accepted[ontology.prefix] = ontology;

    return req;
};

var recordInteractionOverAResource = function(user, resource, req, res)
{
    if(user != null && resource.uri != null)
    {
        if(resource.recommendedFor != null && typeof resource.recommendedFor === "string")
        {
            var ie = new InformationElement({
                uri : resource.recommendedFor
            });

            var projectUri = ie.getOwnerProjectFromUri();

            Project.findByUri(projectUri, function(err, project){
                if(!err)
                {
                    if(project != null)
                    {
                        project.getCreatorsAndContributors(function(err, contributors){
                            if(!err && contributors != null && contributors instanceof Array)
                            {
                                for(var i = 0 ; i < contributors.length; i++)
                                {
                                    if(contributors[i].uri == user.uri)
                                    {
                                        const interaction = new Interaction({
                                            ddr : {
                                                performedBy : user.uri,
                                                interactionType : req.body.interactionType,
                                                executedOver : resource.uri,
                                                originallyRecommendedFor : req.body.recommendedFor,
                                                rankingPosition : req.body.rankingPosition,
                                                pageNumber : req.body.pageNumber,
                                                recommendationCallId : req.body.recommendationCallId,
                                                recommendationCallTimeStamp : req.body.recommendationCallTimeStamp
                                            }
                                        }, function(err, interaction){
                                            interaction.save(
                                                function(err, result)
                                                {
                                                    if(!err)
                                                    {
                                                        interaction.saveToMySQL(function(err, result)
                                                        {
                                                            if(!err)
                                                            {
                                                                var msg = "Interaction of type " + req.body.interactionType + " over resource " + resource.uri + " in the context of resource "+ req.body.recommendedFor + " recorded successfully";
                                                                console.log(msg);
                                                                res.json({
                                                                    result : "OK",
                                                                    message : msg
                                                                });
                                                            }
                                                            else
                                                            {
                                                                var msg = "Error saving interaction of type " + req.body.interactionType + " over resource " + resource.uri + " in the context of resource "+ req.body.recommendedFor + " to MYSQL. Error reported: " + result;
                                                                console.log(msg);
                                                                res.json({
                                                                    result : "OK",
                                                                    message : msg
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else
                                                    {
                                                        var msg = "Error recording interaction over resource " + resource.uri + " in the context of resource "+ req.body.recommendedFor + " : " + result;
                                                        console.error(msg);
                                                        res.status(500).json({
                                                            result : "Error",
                                                            message : msg
                                                        });
                                                    }
                                                });
                                        });

                                        return;
                                    }
                                }

                                var msg = "Unable to record interactions for resources of projects of which you are not a creator or contributor. User uri:  "+ user.uri +". Resource in question" + resource.uri + ". Owner project " + projectUri;
                                console.error(msg);
                                res.status(400).json({
                                    result : "Error",
                                    message : msg
                                });
                            }
                            else
                            {
                                var msg = "Unable to retrieve creators and contributors of parent project "+ projectUri +" of resource " + resource.uri;
                                console.error(msg);
                                res.status(500).json({
                                    result : "Error",
                                    message : msg
                                });
                            }
                        });
                    }
                }
                else
                {
                    var msg = "Unable to retrieve parent project of resource " + resource.uri;
                    console.error(msg);
                    res.status(404).json({
                        result : "Error",
                        message : msg
                    });
                }
            });
        }
        else
        {
            var msg = "Request Body JSON is invalid since it has no 'recommendedFor' field, which should contain the current URL when the interaction took place. Either that, or the field is not a string as it should be.";
            console.error(JSON.stringify(resource));
            console.error(msg);
            res.status(400).json({
                result : "Error",
                message : msg
            });
        }
    }
    else
    {
        var msg = "Error recording interaction over resource " + resource.uri + " : No user is currently authenticated!";
        console.error(msg);
        res.status(500).json({
            result : "Error",
            message : msg
        });
    }
};

exports.accept_descriptor_from_quick_list = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_quick_list.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_manual_list.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list_while_it_was_a_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list_while_it_was_a_user_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_quick_list_while_it_was_a_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting descriptor from quick list while ie was a project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_quick_list_while_it_was_a_user_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting descriptor from quick list while ie was a user favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting descriptor from quick list while ie was a user and project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.hide_descriptor_from_quick_list_for_project = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.hide_descriptor_from_quick_list_for_project.key)
        {

            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when hiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unhide_descriptor_from_quick_list_for_project = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.unhide_descriptor_from_quick_list_for_project.key)
        {

            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when unhiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.hide_descriptor_from_quick_list_for_user = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.hide_descriptor_from_quick_list_for_user.key)
        {

            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when hiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unhide_descriptor_from_quick_list_for_user = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.unhide_descriptor_from_quick_list_for_user.key)
        {

            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when unhiding descriptor. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.favorite_descriptor_from_quick_list_for_project = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.favorite_descriptor_from_quick_list_for_project.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.favorite_descriptor_from_quick_list_for_user = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.favorite_descriptor_from_quick_list_for_user.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unfavorite_descriptor_from_quick_list_for_project = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.unfavorite_descriptor_from_quick_list_for_project.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.unfavorite_descriptor_from_quick_list_for_user = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.unfavorite_descriptor_from_quick_list_for_user.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_descriptor_from_autocomplete = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_descriptor_from_autocomplete.key)
        {
            var descriptor = new Descriptor({
                uri: req.body.uri
            });

            if (descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri: descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_smart_descriptor_in_metadata_editor = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_smart_descriptor_in_metadata_editor.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                //req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting descriptor in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.accept_favorite_descriptor_in_metadata_editor = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.accept_favorite_descriptor_in_metadata_editor.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                //req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting favorite descriptor in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.delete_descriptor_in_metadata_editor = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.delete_descriptor_in_metadata_editor.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                //req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when deleting descriptor in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_in_metadata_editor = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_manual_list_in_metadata_editor.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                //req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when filling in descriptor from manual list in metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_in_metadata_editor = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_quick_list_in_metadata_editor.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                //req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list metadata editor area. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list while it was a project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list while it was a user favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite = function(req, res) {
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite.key)
        {
            var descriptor = new Descriptor({
                uri : req.body.uri
            });

            if(descriptor instanceof Descriptor)
            {
                var ontology = new Ontology({
                    uri : descriptor.ontology
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Requested Descriptor " + descriptor.uri + " is unknown / not parametrized in this Dendro instance."
                })
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when filling in descriptor from quick list while it was a user and project favorite. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.select_ontology_manually = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.select_ontology_manually.key)
        {
            if(req.session.user != null)
            {
                var ontology = new Ontology({
                    uri : req.body.uri
                });

                req = addOntologyToListOfActiveOntologiesInSession(ontology, req);

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting ontology manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.select_descriptor_manually = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.select_descriptor_from_manual_list.key)
        {
            if (req.session.user != null)
            {
                var descriptor = new Descriptor({
                    uri: req.body.uri
                });

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting a descriptor manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.reject_ontology_from_quick_list = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.reject_ontology_from_quick_list.key)
        {
            if(req.session.user != null)
            {
                var ontology = new Ontology({
                    uri : req.body.uri
                });

                if(req.session.user.recommendations.ontologies.accepted != null)
                {
                    delete req.session.user.recommendations.ontologies.accepted[ontology.prefix];

                    recordInteractionOverAResource(req.session.user, req.body, req, res);

                    res.json({
                        result : "OK",
                        message : "Ontology " + ontology.uri + " removed successfully"
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON"
        });
    }
};

exports.fill_in_inherited_descriptor = function(req, res)
{
    if(req.body instanceof Object)
    {
        if(req.body.interactionType == Interaction.types.fill_in_inherited_descriptor.key)
        {
            if (req.session.user != null)
            {
                var descriptor = new Descriptor({
                    uri: req.body.uri
                });

                recordInteractionOverAResource(req.session.user, req.body, req, res);
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
            result : "Error",
            message : "Invalid request. Body contents is not a valid JSON when accepting a descriptor manually. Request body is : " + JSON.stringify(req.body)
        });
    }
};

exports.delete_all_interactions = function(req, res)
{
    Interaction.deleteAllOfMyTypeAndTheirOutgoingTriples(function(err, result){
        if(!err)
        {
            res.json({
                result : "OK",
                message : "All interactions successfully deleted."
            });
        }
        else
        {
            res.status(500).json({
                result : "Error",
                message : "There was an error deleting all the interactions recorded by the system : " + result
            });
        }
    });
};