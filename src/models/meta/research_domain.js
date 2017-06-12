const async = require('async');

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

const db = function () {
    return GLOBAL.db.default;
}();

function ResearchDomain (object, callback)
{
    ResearchDomain.baseConstructor.call(this, object);
    const self = this;

    self.rdf.type = ResearchDomain.prefixedRDFType;

    const now = new Date();

    if(isNull(object.dcterms))
    {
        self.dcterms = {
            created : now.toISOString()
        }
    }
    else
    {
        if(isNull(object.dcterms.created))
        {
            self.dcterms.created = now.toISOString();
        }
        else
        {
            self.dcterms.created = object.dcterms.created;
        }
    }

    if(isNull(self.uri))
    {
        if(typeof self.dcterms.title === "string")
        {
            const slug = require('slug');
            const slugified_title = slug(self.dcterms.title);
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
}
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

    const arguments = [
        {
            type: DbConnection.resourceNoEscape,
            value: db.graphUri
        }
    ];

    if(typeof max_results !== "undefined" && typeof max_results === "number")
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
                const fetchResearchDomain = function (result, callback) {
                    ResearchDomain.findByUri(result.uri, function (err, domain) {
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