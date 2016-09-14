var async = require('async');

var Config = require("../meta/config.js").Config;
var DbConnection = require(Config.absPathInProject("/kb/db.js")).DbConnection;
var Class = require(Config.absPathInProject("/models/meta/class.js")).Class;
var Resource = require(Config.absPathInProject("/models/resource.js")).Resource;

var db = function() { return GLOBAL.db.default; }();

function ResearchDomain (object, callback)
{
    ResearchDomain.baseConstructor.call(this, object);
    var self = this;

    self.rdf.type = ResearchDomain.prefixedRDFType;

    var now = new Date();

    if(object.dcterms == null)
    {
        self.dcterms = {
            created : now.toISOString()
        }
    }
    else
    {
        if(object.dcterms.created == null)
        {
            self.dcterms.created = now.toISOString();
        }
        else
        {
            self.dcterms.created = object.dcterms.created;
        }
    }

    if(self.uri == null)
    {
        if(typeof self.dcterms.title === "string")
        {
            var slug = require('slug');
            var slugified_title = slug(self.dcterms.title);
            self.uri = db.baseURI+"/research_domains/"+slugified_title;
            callback(null, self);
        }
        else
        {
            callback(1, "No URI *nor dcterms:title* specified for research domain. Object sent for research domain creation: " + JSON.stringify(object));
        }
    }
    else
    {
        callback(0, self);
    }
};

ResearchDomain.findByTitleOrDescription  = function(query, callback, max_results)
{
    var query =
        "WITH [0] \n" +
        "SELECT DISTINCT (?uri) \n" +
        "WHERE \n" +
        "{ \n" +
        "   {\n" +
        "      ?uri rdf:type ddr:ResearchDomain . \n" +
        "      ?uri dcterms:title ?title .\n" +
        "      FILTER regex(?title, \"" + query +"\", \"i\")  \n" +
        "   }\n" +
        "   UNION \n" +
        "   {\n" +
        "       ?uri rdf:type ddr:ResearchDomain . \n" +
        "       ?uri dcterms:description ?description .\n" +
        "       FILTER regex(?description, \"" + query +"\", \"i\")  \n" +
        "   } \n" +
        "} \n";

    var arguments = [
        {
            type : DbConnection.resourceNoEscape,
            value : db.graphUri
        }
    ];

    if(max_results != null && typeof max_results === "number")
    {
        query = query + "LIMIT [1]";

        arguments.push({
            type : DbConnection.int,
            value : max_results
        })
    }

    db.connection.execute(query,
        arguments,
        function(err, results)
        {
            if (!err)
            {
                var fetchResearchDomain = function(result, callback)
                {
                   ResearchDomain.findByUri(result.uri, function(err, domain){
                       callback(err, domain);
                   });
                };

                async.map(results, fetchResearchDomain, function(err, researchDomains){
                    callback(err, researchDomains);
                });
            }
            else
            {
                callback(err, results);
            }
        });
};

ResearchDomain.prefixedRDFType = "ddr:ResearchDomain";

ResearchDomain = Class.extend(ResearchDomain, Resource);

module.exports.ResearchDomain = ResearchDomain;