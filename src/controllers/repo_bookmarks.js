const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Descriptor = require(Pathfinder.absPathInSrcFolder('/models/meta/descriptor.js')).Descriptor;
const ExternalRepository = require(Pathfinder.absPathInSrcFolder('/models/harvesting/external_repository.js')).ExternalRepository;
const RepositoryPlatform = require(Pathfinder.absPathInSrcFolder('/models/harvesting/repo_platform')).RepositoryPlatform;
const Resource = require(Pathfinder.absPathInSrcFolder('/models/resource.js')).Resource;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;

const async = require('async');
const _ = require('underscore');

const validateNewBookmarkRequest = function (req, res)
{
    const validator = require('validator');
    const regex = Resource.getResourceRegex('repo_platform');

    if (isNull(req.body.dcterms.title))
    {
        res.status(400).json({
            result: 'error',
            message: 'No bookmark title specified.'
        });
        return false;
    }
    else if (isNull(req.body.ddr.hasUsername) && req.body.ddr.hasPlatform.foaf.nick !== 'figshare' && req.body.ddr.hasPlatform.foaf.nick !== 'zenodo' && req.body.ddr.hasPlatform.foaf.nick !== 'b2share')
    {
        res.status(400).json({
            result: 'error',
            message: 'No repository username specified.'
        });

        return false;
    }
    else if (isNull(req.body.ddr.hasPlatform))
    {
        res.status(400).json({
            result: 'error',
            message: 'No repository type specified.'
        });

        return false;
    }
    else if (isNull(req.body.ddr.hasPlatform.uri))
    {
        res.status(400).json({
            result: 'error',
            message: 'Platform field does not have a valid uri field.'
        });

        return false;
    }
    else if (!regex.test(req.body.ddr.hasPlatform.uri))
    {
        res.status(400).json({
            result: 'error',
            message: 'Invalid platform URI specified. '
        });

        return false;
    }
    else if (isNull(req.body.ddr.hasExternalUrl))
    {
        res.status(400).json({
            result: 'error',
            message: 'You must specify the url of the bookmarked repository'
        });

        return false;
    }
    else if (!validator.isURL(req.body.ddr.hasExternalUrl))
    {
        res.status(400).json({
            result: 'error',
            message: 'Invalid url for the repository bookmark'
        });

        return false;
    }
    else if (req.body.ddr.hasPlatform.foaf.nick === 'dspace' || req.body.ddr.hasPlatform.foaf.nick === 'eprints')
    {
        if (isNull(req.body.ddr.hasSwordCollectionUri) || isNull(req.body.ddr.hasSwordCollectionLabel))
        {
            res.status(400).json({
                result: 'error',
                message: 'No collection specified'
            });

            return false;
        }
    }
    else if (req.body.ddr.hasPlatform.foaf.nick === 'ckan')
    {
        if (isNull(req.body.ddr.hasAPIKey))
        {
            res.status(400).json({
                result: 'error',
                message: 'No API Key specified'
            });

            return false;
        }
    }
    else if (req.body.ddr.hasPlatform.foaf.nick === 'figshare')
    {
        if (isNull(req.body.ddr.hasConsumerKey))
        {
            res.status(400).json({
                result: 'error',
                message: 'No consumer key specified'
            });

            return false;
        }
        else if (isNull(req.body.ddr.hasConsumerSecret))
        {
            res.status(400).json({
                result: 'error',
                message: 'No consumer secret specified'
            });

            return false;
        }
        else if (isNull(req.body.ddr.hasAccessToken))
        {
            res.status(400).json({
                result: 'error',
                message: 'No access token specified'
            });

            return false;
        }
        else if (isNull(req.body.ddr.hasAccessTokenSecret))
        {
            res.status(400).json({
                result: 'error',
                message: 'No access token secret specified'
            });

            return false;
        }
    }

    return true;
};

/*
expected format :
    {
        uri : "http://dendro.fe.up.pt/bookmark1",
        dcterms : {
            title : "CKAN Demo Repository"
        },
        ddr: {
            hasPassword : "DVet1658",
            hasUsername : "ricardoamorim",
            hasExternalUrl : "http://demo.ckan.org",
            hasPlatform : {
                uri : "http://dendro.fe.up.pt/repository_platforms/ckan",
                dcterms : {
                    title : "CKAN"
                },
                foaf: {
                    nick : "ckan",
                    homepage : "http://ckan.org"
                }
            }
        }
    }
 */
exports.new = function (req, res)
{
    if (!req.body)
    {
        return res.status(400).json({
            result: 'error',
            message: 'HTTP Body of the request was null.'
        });
    }
    else if (isNull(req.user))
    {
        return res.status(401).json({
            result: 'error',
            message: 'You are not logged in the system.'
        });
    }
    else if (req.originalMethod === 'POST')
    {
        try
        {
            if (req.body.ddr.hasPlatform.foaf.nick === 'eprints')
            {
                req.body.ddr.hasSwordCollectionUri = req.body.ddr.hasExternalUrl + Config.swordConnection.EprintsCollectionRef;
                req.body.ddr.hasSwordCollectionLabel = 'EPrints';
            }
            else if (req.body.ddr.hasPlatform.foaf.nick === 'b2share')
            {
                if (isNull(req.body.ddr.hasAccessToken))
                {
                    req.body.ddr.hasAccessToken = Config.eudatToken;
                }
            }

            if (validateNewBookmarkRequest(req, res))
            {
                let hasPlatformUri;
                RepositoryPlatform.findByPropertyValue(new Descriptor(
                    {
                        value: req.body.ddr.hasPlatform.ddr.handle,
                        prefixedForm: 'ddr:handle'
                    }), function (err, repo_platform)
                {
                    if (isNull(err))
                    {
                        if (repo_platform instanceof RepositoryPlatform)
                        {
                            const newBookmark = new ExternalRepository({
                                dcterms: {
                                    title: req.body.dcterms.title,
                                    creator: req.user.uri
                                },
                                ddr: {
                                    hasUsername: req.body.ddr.hasUsername,
                                    hasPlatform: repo_platform.uri,
                                    hasExternalUri: req.body.ddr.hasExternalUrl,
                                    hasSwordCollectionLabel: req.body.ddr.hasSwordCollectionLabel,
                                    hasSwordCollectionUri: req.body.ddr.hasSwordCollectionUri,
                                    hasConsumerKey: req.body.ddr.hasConsumerKey,
                                    hasConsumerSecret: req.body.ddr.hasConsumerSecret,
                                    hasAccessToken: req.body.ddr.hasAccessToken,
                                    hasAccessTokenSecret: req.body.ddr.hasAccessTokenSecret,
                                    hasOrganization: req.body.ddr.hasOrganization,
                                    hasAPIKey: req.body.ddr.hasAPIKey
                                }
                            });

                            if (newBookmark instanceof ExternalRepository)
                            {
                                newBookmark.save(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        res.json({
                                            result: 'ok',
                                            message: 'New bookmark saved as ' + newBookmark.dcterms.title
                                        });
                                    }
                                    else
                                    {
                                        res.status(500).json({
                                            result: 'error',
                                            message: 'Error saving new bookmark . ' + result
                                        });
                                    }
                                });
                            }
                            else
                            {
                                res.status(500).json({
                                    result: 'error',
                                    message: 'Error saving the new bookmark. Error reported: ' + newBookmark.error
                                });
                            }
                        }
                        else
                        {
                            res.status(500).json({
                                result: 'error',
                                message: 'Error fetching repo_platform handle for the new bookmark. Error reported: ' + JSON.stringify(repo_platform)
                            });
                        }
                    }
                    else
                    {
                        res.status(500).json({
                            result: 'error',
                            message: 'Error fetching repo_platform handle for the new bookmark. Error reported: ' + JSON.stringify(repo_platform)
                        });
                    }
                });
            }
        }
        catch (e)
        {
            res.status(400).json({
                result: 'error',
                message: 'Invalid HTTP Body : ' + e.message
            });
        }
    }
    else
    {
        res.status(400).json({
            result: 'error',
            message: 'Invalid HTTP Method. Only POST requests are allowed.'
        });
    }
};

/*
returned format :
    {
        uri : "http://dendro.fe.up.pt/bookmark1",
        dcterms : {
            title : "CKAN Demo Repository"
        },
        ddr: {
            hasUsername : "ricardoamorim",
            hasExternalUrl : "http://demo.ckan.org",
            hasPlatform : {
                uri : "http://dendro.fe.up.pt/repository_platforms/ckan",
                dcterms : {
                    title : "CKAN"
                },
                foaf: {
                    nick : "ckan",
                    homepage : "http://ckan.org"
                }
            }
        }
    }
 */

exports.my = function (req, res)
{
    ExternalRepository.findByCreator(req.user.uri, function (err, myRepositoryBookmarks)
    {
        if (isNull(err))
        {
            const getPlatformDetails = function (myRepositoryBookmark, callback)
            {
                RepositoryPlatform.findByUri(myRepositoryBookmark.ddr.hasPlatform, function (err, platform)
                {
                    if (isNull(err))
                    {
                        if (!isNull(platform))
                        {
                            myRepositoryBookmark.ddr.hasPlatform = platform;
                        }

                        return callback(null, myRepositoryBookmark);
                    }
                    return callback(err, platform);
                });
            };

            async.mapSeries(myRepositoryBookmarks, getPlatformDetails, function (err, bookmarksWithPlatforms)
            {
                if (isNull(err))
                {
                    res.json(bookmarksWithPlatforms);
                }
                else
                {
                    const msg = 'Error fetching repository platforms for your bookmarks.';

                    res.status(500).json({
                        result: 'error',
                        message: msg
                    });
                }
            });
        }
        else
        {
            const msg = 'Unable to find repository bookmarks created by ' + req.user.uri + ' . Error returned : ' + myRepositoryBookmarks;

            res.status(500).json({
                result: 'error',
                message: msg
            });
        }
    });
};

exports.all = function (req, res)
{
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if (!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: 'error',
            message: 'HTML Request not valid for this route.'
        });
    }
    else
    {
        ExternalRepository.all(function (err, externalRepositories)
        {
            if (isNull(err))
            {
                for (let i = 0; i < externalRepositories.length; i++)
                {
                    Descriptor.removeUnauthorizedFromObject(externalRepositories[i], [Elements.access_types.private, Elements.access_types.audit], [Elements.access_types.api_readable]);
                }

                res.json(externalRepositories);
            }
            else
            {
                const msg = 'Unable to retrieve all instances of external repositories';
                res.status(500).json({
                    result: 'error',
                    message: msg
                });
            }
        });
    }
};

exports.delete = function (req, res)
{
    const requestedResourceUri = Config.baseUri + req.originalUrl;

    if (req.originalMethod === 'DELETE')
    {
        ExternalRepository.findByUri(requestedResourceUri, function (err, bookmark)
        {
            if (isNull(err))
            {
                if (!bookmark)
                {
                    const msg = 'Unable to retrieve the requested bookmark for deletion.';
                    res.status(400).json({
                        result: 'error',
                        message: msg
                    });
                }
                else
                {
                    bookmark.deleteAllMyTriples(function (err, result)
                    {
                        if (isNull(err))
                        {
                            const msg = 'Bookmark ' + bookmark.dcterms.title + ' successfully deleted. ';
                            res.json({
                                result: 'ok',
                                message: msg
                            });
                        }
                        else
                        {
                            const msg = 'Error deleting bookmark ' + requestedResourceUri + '. Error reported: ' + result;
                            res.status(500).json({
                                result: 'error',
                                message: msg
                            });
                        }
                    });
                }
            }
            else
            {
                const msg = 'Unable to retrieve types of external repository platforms for this Dendro instance.';
                res.status(500).json({
                    result: 'error',
                    message: msg
                });
            }
        });
    }
};

/**
 * Returned format
 $scope.repository_types = [
 {
     uri : "http://dendro.fe.up.pt/repository_platforms/ckan",
     dcterms : {
         title : "CKAN Demo Repository"
     },
     foaf: {
         nick : "ckan",
         homepage : "http://ckan.org"
     },
     ddr: {
         hasPassword : "DVet1658",
         hasUsername : "ricardoamorim",
         hasExternalUrl : "http://demo.ckan.org",
         hasPlatform : {
             uri : "http://dendro.fe.up.pt/repository_platforms/ckan",
             dcterms : {
                 title : "CKAN"
             },
             foaf: {
                 nick : "ckan",
                 homepage : "http://ckan.org"
             }
         }
     }
 }
 ];
 */
exports.repository_types = function (req, res)
{
    RepositoryPlatform.all(function (err, types)
    {
        if (isNull(err))
        {
            res.json(types);
        }
        else
        {
            const msg = 'Unable to retrieve types of external repository platforms for this Dendro instance.';
            res.status(500).json({
                result: 'error',
                message: msg
            });
        }
    });
};
