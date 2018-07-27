const async = require("async");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const db = Config.getDBByID();

function ResearchDomain (object)
{
    const self = this;
    self.addURIAndRDFType(object, "research_domain", ResearchDomain);
    ResearchDomain.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    return self;
}

ResearchDomain.create = function (object, callback)
{
    const self = new ResearchDomain(object);
    self.getHumanReadableUri(function (err, uri)
    {
        self.ddr.humanReadableURI = uri;
        return callback(null, self);
    });
};
ResearchDomain.findByTitleOrDescription = function (query, callback, maxResults)
{
    query =
        "SELECT DISTINCT (?uri) \n" +
        "WHERE \n" +
        "{ \n" +
        "   GRAPH [0] \n" +
        "   { \n" +
        "       {\n" +
        "           ?uri rdf:type ddr:ResearchDomain . \n" +
        "           ?uri dcterms:title ?title .\n" +
        "           FILTER regex(?title, \"" + query + "\", \"i\")  \n" +
        "       }\n" +
        "       UNION \n" +
        "       {\n" +
        "           ?uri rdf:type ddr:ResearchDomain . \n" +
        "           ?uri dcterms:description ?description .\n" +
        "           FILTER regex(?description, \"" + query + "\", \"i\")  \n" +
        "       } \n" +
        "   } \n" +
        "} \n";

    const queryArguments = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        }
    ];

    if (typeof maxResults !== "undefined" && typeof maxResults === "number")
    {
        query = query + "LIMIT [1]";

        queryArguments.push({
            type: Elements.types.int,
            value: maxResults
        });
    }

    db.connection.execute(query,
        queryArguments,
        function (err, results)
        {
            if (isNull(err))
            {
                const fetchResearchDomain = function (result, callback)
                {
                    ResearchDomain.findByUri(result.uri, function (err, domain)
                    {
                        return callback(err, domain);
                    });
                };

                async.mapSeries(results, fetchResearchDomain, function (err, researchDomains)
                {
                    return callback(err, researchDomains);
                });
            }
            else
            {
                return callback(err, results);
            }
        });
};

ResearchDomain.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (!isNull(self.ddr))
    {
        if (typeof self.dcterms.title === "string")
        {
            const slug = rlequire("dendro", "src/utils/slugifier.js");
            const slugifiedTitle = slug(self.dcterms.title);
            callback(null, "/research_domains/" + slugifiedTitle);
        }
        else
        {
            callback(1, "Unable to get human readable uri for " + self.uri + " because it has no ddr.title property.");
        }
    }
    else
    {
        callback(1, "Unable to get human readable uri for " + self.uri + " because it has no ddr property.");
    }
};

ResearchDomain = Class.extend(ResearchDomain, Resource, "ddr:ResearchDomain");

module.exports.ResearchDomain = ResearchDomain;
