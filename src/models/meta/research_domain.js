const async = require('async');

const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

const db = function () {
    return global.db.default;
}();

function ResearchDomain (object, callback)
{
    ResearchDomain.baseConstructor.call(this, object, ResearchDomain);
    const self = this;

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
        if(!isNull(object.uri))
        {
            self.uri = object.uri;
        }
        else
        {
            const uuid = require('uuid');
            self.uri = "/r/research_domains/" + uuid.v4();
        }
    }

    if(!isNull(self.ddr) && isNull(self.ddr.humanReadableName))
    {
        if(!isNull(object.ddr) && !isNull(object.ddr.humanReadableURI))
        {
            self.ddr.humanReadableURI = object.ddr.humanReadableURI;
        }
        else
        {
            if(typeof self.dcterms.title === "string")
            {
                const slug = require('slug');
                const slugified_title = slug(self.dcterms.title);
                self.ddr.humanReadableURI = Config.baseUri +"/research_domains/"+slugified_title;
            }
            else
            {
                return callback(1, "No URI *nor dcterms:title* specified for research domain. Object sent for research domain creation: " + JSON.stringify(object));
            }
        }
    }

    return callback(null, self);
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

    const queryArguments = [
        {
            type: DbConnection.resourceNoEscape,
            value: db.graphUri
        }
    ];

    if(typeof max_results !== "undefined" && typeof max_results === "number")
    {
        query = query + "LIMIT [1]";

        queryArguments.push({
            type : DbConnection.int,
            value : max_results
        })
    }

    db.connection.execute(query,
        queryArguments,
        function(err, results)
        {
            if (!err)
            {
                const fetchResearchDomain = function (result, callback) {
                    ResearchDomain.findByUri(result.uri, function (err, domain) {
                        return callback(err, domain);
                    });
                };

                async.map(results, fetchResearchDomain, function(err, researchDomains){
                    return callback(err, researchDomains);
                });
            }
            else
            {
                return callback(err, results);
            }
        });
};

ResearchDomain = Class.extend(ResearchDomain, Resource, "ddr:ResearchDomain");

module.exports.ResearchDomain = ResearchDomain;