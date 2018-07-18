const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const Ontology = rlequire("dendro", "src/models/meta/ontology.js").Ontology;

const _ = require("underscore");

exports.recommend = function (req, res)
{
    if (!isNull(req.params.requestedResourceUri))
    {
        Ontology.previouslyUsed(req.user, function (err, previouslyUsedOntologies)
        {
            if (isNull(err))
            {
                res.json(previouslyUsedOntologies);
            }
            else
            {
                res.status(500).json(previouslyUsedOntologies);
            }
        });
    }
};

exports.get_recommendation_ontologies = function (req, res)
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
        if (!isNull(req.params.requestedResourceUri))
        {
            if (!isNull(req.user))
            {
                const user = req.user;

                if (!isNull(user.recommendations) &&
                    !isNull(user.recommendations.ontologies.accepted) &&
                    user.recommendations.ontologies.accepted instanceof Object)
                {
                    const ontologiesToReturn = [];

                    for (let prefix in user.recommendations.ontologies.accepted)
                    {
                        if (user.recommendations.ontologies.accepted.hasOwnProperty(prefix))
                        {
                            const ontologyToReturn = user.recommendations.ontologies.accepted[prefix];

                            /** hide elements**/
                            delete ontologyToReturn.elements;
                            ontologyToReturn.dcterms.title = Elements.ontologies[prefix].label;
                            ontologyToReturn.dcterms.description = Elements.ontologies[prefix].description;

                            ontologiesToReturn.push(ontologyToReturn);
                        }
                    }

                    res.json(ontologiesToReturn);
                }
                else
                {
                    res.json([]);
                }
            }
            else
            {
                res.status(401).json({
                    result: "Error",
                    message: "Error detected. You are not authorized to perform this operation. You must be signed into Dendro."
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "No/invalid requested resource"
            });
        }
    }
};

exports.ontologies_autocomplete = function (req, res)
{
    const query = req.query.ontology_autocomplete;

    if (!isNull(query))
    {
        Ontology.findByResearchDomainPrefixOrComment(
            query,
            Config.recommendation.max_autocomplete_results,
            function (err, ontologies)
            {
                if (isNull(err))
                {
                    res.json(
                        ontologies
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            error_messages: [ontologies]
                        }
                    );
                }
            });
    }
    else
    {
        res.status(400).json(
            {
                error_messages: ["You did not send the autocomplete query. The request should be something like /ontologies/autocomplete?query=dummy_query_string."]
            }
        );
    }
};

const addTitlesAndDescriptions = function (ontologies)
{
    _.map(ontologies, function (ontology)
    {
        let prefix = ontology.prefix;
        if (!isNull(ontology.dcterms))
        {
            if (isNull(ontology.dcterms.title))
            {
                ontology.dcterms.title = Elements.ontologies[prefix].label;
            }

            if (isNull(ontology.dcterms.description))
            {
                ontology.dcterms.description = Elements.ontologies[prefix].description;
            }
        }
    });

    return ontologies;
};

exports.public = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        let publicOntologies = Ontology.getPublicOntologies();
        publicOntologies = addTitlesAndDescriptions(publicOntologies);

        res.json(publicOntologies);
    }
    else
    {
        res.render("ontologies/public");
    }
};

exports.all = function (req, res)
{
    // TODO JROCHA 24-11-2014
    // Remove attributes that should not be seen by external systems

    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        Ontology.all(function (err, ontologies)
        {
            if (isNull(err))
            {
                ontologies = addTitlesAndDescriptions(ontologies);
                res.json(ontologies);
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "Error retrieving all ontologies from the system.",
                    error: ontologies
                });
            }
        });
    }
    else
    {
        res.render("ontologies/all");
    }
};

exports.show = function (req, res)
{
    const prefix = req.params.prefix;

    Ontology.findByPrefix(prefix, function (err, ontology)
    {
        if (isNull(err))
        {
            res.render("ontologies/show",
                {
                    title: "Viewing ontology " + prefix,
                    ontology: ontology
                }
            );
        }
        else
        {
            res.render("ontologies/all",
                {
                    title: "Ontologies",
                    error_messages:
          [
              "Unable to retrieve ontology with prefix " + prefix,
              err
          ]
                }
            );
        }
    });
};

exports.edit = function (req, res)
{
    const newOntologyData = req.body;

    if (newOntologyData instanceof Object)
    {
        Ontology.findByUri(newOntologyData.uri, function (err, ontologyBeingEdited)
        {
            if (isNull(err))
            {
                if (!isNull(ontologyBeingEdited))
                {
                    ontologyBeingEdited.ddr.hasResearchDomain = newOntologyData.ddr.hasResearchDomain;
                    ontologyBeingEdited.dcterms.description = newOntologyData.description;

                    ontologyBeingEdited.save(function (err, result)
                    {
                        if (isNull(err))
                        {
                            Ontology.initAllFromDatabase(function (err, result)
                            {
                                if (isNull(err))
                                {
                                    res.json({
                                        result: "ok",
                                        ontologies: Ontology.publicOntologies
                                    });
                                }
                                else
                                {
                                    res.status(500).json({
                                        result: "error",
                                        message: "Error reloading ontologies after updating : " + JSON.stringify(result)
                                    });
                                }
                            });
                        }
                        else
                        {
                            res.status(500).json({
                                result: "error",
                                message: "Error editing ontologies : " + JSON.stringify(result)
                            });
                        }
                    });
                }
                else
                {
                    res.status(404).json({
                        result: "error",
                        message: "Ontology " + newOntologyData.uri + " does not exist while trying to edit ontology.",
                        error: err
                    });
                }
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "Error fetching ontology " + newOntologyData.uri,
                    error: err
                });
            }
        });
    }
    else
    {
        res.status(400).json({
            result: "error",
            message: "Invalid JSON sent. The JSON should be an Array containing the new attributes of the ontologies."
        });
    }
};
