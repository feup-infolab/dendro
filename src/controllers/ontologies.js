var Config = function() { return GLOBAL.Config; }();

var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;

var async = require('async');

exports.recommend = function(req, res) {

    if(req.params.requestedResource != null)
    {
        Ontology.previouslyUsed(req.session.user, function(error, previouslyUsedOntologies){
            if(!err)
            {
                res.json(previouslyUsedOntologies)
            }
            else
            {
                res.status(500).json(previouslyUsedOntologies)
            }
        });
    }
};

exports.get_recommendation_ontologies = function(req, res) {
    if(req.params.requestedResource != null)
    {
        if(req.session.user != null)
        {
            var user = req.session.user;

            if( user.recommendations != null &&
                user.recommendations.ontologies.accepted != null &&
                user.recommendations.ontologies.accepted instanceof Object)
            {
                var ontologiesToReturn = [];

                for(var prefix in user.recommendations.ontologies.accepted)
                {
                    if(user.recommendations.ontologies.accepted.hasOwnProperty(prefix))
                    {
                        var ontologyToReturn = user.recommendations.ontologies.accepted[prefix];

                        /**hide elements**/
                        delete ontologyToReturn.elements;

                        var label = Ontology.allOntologies[prefix].label;
                        var description = Ontology.allOntologies[prefix].description;

                        ontologyToReturn.label = label;
                        ontologyToReturn.description = description;

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
    }
    else
    {
        res.status(500).json({
            result : "Error",
            message : "No/invalid requested resource"
        });
    }
};

exports.ontologies_autocomplete = function(req, res) {

    var query = req.query.ontology_autocomplete;

    if(query != null)
    {
        Ontology.findByResearchDomainPrefixOrComment(
            query,
            Config.recommendation.max_autocomplete_results,
            function(err, ontologies)
            {
                if(!err)
                {
                    res.json(
                        ontologies
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            error_messages : [ontologies]
                        }
                    );
                }
            });
    }
    else
    {
        res.status(400).json(
            {
                error_messages : ["You did not send the autocomplete query. The request should be something like /ontologies/autocomplete?query=dummy_query_string."]
            }
        );
    }
};

exports.public = function(req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var publicOntologies = Ontology.getPublicOntologies();
        res.json(publicOntologies);
    }
    else
    {
        res.render('ontologies/public');
    }
};

exports.all = function(req, res) {
    //TODO JROCHA 24-11-2014
    // Remove attributes that should not be seen by external systems

    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var allOntologies = Ontology.getAllOntologiesArray();

        res.json(allOntologies);
    }
    else
    {
        res.render('ontologies/all');
    }
};

exports.show = function(req, res){
    var prefix = req.params["prefix"];

    Ontology.findByPrefix(prefix, function(err, ontology)
    {
        if(err == null)
        {
            res.render('ontologies/show',
                {
                    title : "Viewing ontology " + prefix,
                    ontology : ontology
                }
            )
        }
        else
        {
            res.render('ontologies/all',
                {
                    title : "Ontologies",
                    error_messages :
                        [
                                "Unable to retrieve ontology with prefix " + prefix,
                            err
                        ]
                }
            );
        }
    });
};

exports.edit = function(req, res) {
    var newOntologyData = req.body;

    if(newOntologyData instanceof Object)
    {
        var newOntology = new Ontology(newOntologyData);

        newOntology.save(function(err, result){
            if(!err)
            {
                Ontology.initAllFromDatabase(function(err, result){
                    if(!err)
                    {
                        res.json({
                            result : "ok",
                            ontologies: Ontology.publicOntologies
                        });
                    }
                    else
                    {
                        res.status(500).json({
                            result : "error",
                            message : "Error reloading ontologies after updating : " + JSON.stringify(result)
                        });
                    }
                });
            }
            else
            {
                res.status(500).json({
                    result : "error",
                    message : "Error editing ontologies : " + JSON.stringify(result)
                })
            }
        });
    }
    else
    {
        res.status(400).json({
            result : "error",
            message : "Invalid JSON sent. The JSON should be an Array containing the new attributes of the ontologies."
        })
    }

};