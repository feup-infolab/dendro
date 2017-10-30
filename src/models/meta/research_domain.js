const async = require("async");

const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const db = Config.getGFSByID();

function ResearchDomain (object)
{
    const self = this;
    self.addURIAndRDFType(object, "research_domain", ResearchDomain);
    ResearchDomain.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    return self;
}

ResearchDomain.create = function(object, callback)
{
    const self = new ResearchDomain(object);

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
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        }
    ];

    if(typeof max_results !== "undefined" && typeof max_results === "number")
    {
        query = query + "LIMIT [1]";

        queryArguments.push({
            type : Elements.types.int,
            value : max_results
        })
    }

    db.connection.executeViaJDBC(query,
        queryArguments,
        function(err, results)
        {
            if (isNull(err))
            {
                const fetchResearchDomain = function (result, callback) {
                    ResearchDomain.findByUri(result.uri, function (err, domain) {
                        return callback(err, domain);
                    });
                };

                async.mapSeries(results, fetchResearchDomain, function(err, researchDomains){
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