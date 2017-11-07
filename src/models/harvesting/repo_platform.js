const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Class = require(Pathfinder.absPathInSrcFolder('/models/meta/class.js')).Class;
const Resource = require(Pathfinder.absPathInSrcFolder('/models/resource.js')).Resource;

const async = require('async');

function RepositoryPlatform (object)
{
    const self = this;
    self.addURIAndRDFType(object, 'repo_platform', RepositoryPlatform);
    RepositoryPlatform.baseConstructor.call(this, object);

    if (isNull(self.ddr.humanReadableURI))
    {
        const slug = require('slug');

        if (!isNull(object.ddr))
        {
            if (isNull(object.ddr.humanReadableURI))
            {
                if (!isNull(self.ddr.handle) && !isNull(self.dcterms.title))
                {
                    self.ddr.humanReadableURI = Config.baseUri + '/repository_platform/' + object.ddr.handle;
                }
                else
                {
                    const error = 'Unable to create an external repository resource without specifying its ddr:handle and its dcterms:title';
                    console.error(error);
                    return {error: error};
                }
            }
        }
    }

    return self;
}

/** TODO replace this with fetching from the database.
 * Beware that it needs initialization during initial setup of the repository
 **/
/* RepositoryPlatform.findByUri = function(uri, callback)
{
    RepositoryPlatform.all(function(err, platformTypes){
        for(let i = 0; i < platformTypes.length; i++)
        {
            if(platformTypes[i].uri === uri)
            {
                return callback(null, platformTypes[i]);
            }
        }

        return callback(null, null);
    });
}; */

/* RepositoryPlatform.all = function(callback){
    return callback(null, [
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
        },
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
        },
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
                title : "EUDAT B2Share",
                description : "A EUDAT B2Share deposition"
            },
            foaf :
            {
                nick : "b2share",
                homepage : "https://b2share.eudat.eu/"
            }
        }

    ]);
}; */

RepositoryPlatform = Class.extend(RepositoryPlatform, Resource, 'ddr:RepositoryPlatform');

module.exports.RepositoryPlatform = RepositoryPlatform;
