//DCTerms ontology : "http://purl.org/dc/elements/1.1/"

var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInProject("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInProject("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInProject("/models/resource.js")).Resource;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var async = require('async');

function RepositoryPlatform(object)
{
    RepositoryPlatform.baseConstructor.call(this, object);
    var self = this;

    self.rdf.type = "ddr:RepositoryPlatform";

    var slug = require('slug');

    if(object.uri == null)
    {
        if(self.ddr.handle != null && self.dcterms.title != null)
        {
            self.uri = Config.baseUri + "/repository_platform/" + object.ddr.handle;
        }
        else
        {
            var error = "Unable to create an external repository resource without specifying its ddr:handle and its dcterms:title";
            console.error(error);
            return {error : error};
        }
    }

    return self;
}


/**TODO replace this with fetching from the database.
 * Beware that it needs initialization during initial setup of the repository
 **/
RepositoryPlatform.findByUri = function(uri, callback)
{
    RepositoryPlatform.all(function(err, platformTypes){
        for(var i = 0; i < platformTypes.length; i++)
        {
            if(platformTypes[i].uri == uri)
            {
                return callback(null, platformTypes[i]);
            }
        }

        return callback(null, null);
    });
};

RepositoryPlatform.all = function(callback){
    callback(null, [
        {
            uri : Config.baseUri + "/repository_platform/ckan",
            dcterms :
            {
                title : "CKAN"
            },
            foaf:
            {
                nick : "ckan",
                homepage : "http://ckan.org"
            }
        },
        {
            uri : Config.baseUri + "/repository_platform/dspace",
            dcterms :
            {
                title : "DSpace"
            },
            foaf:
            {
                nick : "dspace",
                homepage : "http://www.dspace.org/"
            }
        }
        ,
        {
            uri : Config.baseUri + "/repository_platform/eprints",
            dcterms :
            {
                title : "EPrints"
            },
            foaf:
            {
                nick : "eprints",
                homepage : "http://www.eprints.org/"
            }
        }
        ,
        {
            uri : Config.baseUri + "/repository_platform/figshare",
            dcterms :
            {
                title : "Figshare"
            },
            foaf:
            {
                nick : "figshare",
                homepage : "http://www.figshare.com/"
            }
        },
        {
            uri : Config.baseUri + "/repository_platform/zenodo",
            dcterms :
            {
                title : "Zenodo"
            },
            foaf:
            {
                nick : "zenodo",
                homepage : "http://www.zenodo.org/"
            }
        },
        {
            uri : Config.baseUri + "/repository_platform/b2share",
            dcterms :
            {
                title : "B2Share",
                description : "A B2Share deposition"
            },
            foaf :
            {
                nick : "b2share",
                homepage : "https://b2share.eudat.eu/"
            }
        }

    ]);
};

RepositoryPlatform = Class.extend(RepositoryPlatform, Resource);

module.exports.RepositoryPlatform = RepositoryPlatform;
