var Config = require('../models/meta/config.js').Config;

var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var ExternalRepository = require(Config.absPathInSrcFolder("/models/harvesting/external_repository.js")).ExternalRepository;
var RepositoryPlatform = require(Config.absPathInSrcFolder("/models/harvesting/repo_platform")).RepositoryPlatform;

var async = require('async');
var _ = require('underscore');

var validateNewBookmarkRequest = function(req, res)
{
    var validator = require('validator');

    if(req.body.dcterms.title == null)
    {
        res.status(400).json({
            result : "error",
            message : "No bookmark title specified."
        });
        return false;
    }
    else if(req.body.ddr.hasUsername == null && req.body.ddr.hasPlatform.foaf.nick != 'figshare' && req.body.ddr.hasPlatform.foaf.nick != 'zenodo' && req.body.ddr.hasPlatform.foaf.nick != 'b2share')
    {
        res.status(400).json({
            result : "error",
            message : "No repository username specified."
        });

        return false;
    }
    else if(req.body.ddr.hasPlatform == null)
    {
        res.status(400).json({
            result : "error",
            message : "No repository type specified."
        });

        return false;
    }
    else if(req.body.ddr.hasPlatform.uri == null)
    {
        res.status(400).json({
            result : "error",
            message : "Platform field does not have a valid uri field."
        });

        return false;
    }
    else if(!validator.isURL(req.body.ddr.hasPlatform.uri))
    {
        res.status(400).json({
            result : "error",
            message : "Invalid platform URI specified. "
        });

        return false;
    }
    else if(req.body.ddr.hasExternalUrl == null)
    {
        res.status(400).json({
            result : "error",
            message : "You must specify the url of the bookmarked repository"
        });

        return false;
    }
    else if(!validator.isURL(req.body.ddr.hasExternalUrl))
    {
        res.status(400).json({
            result : "error",
            message : "Invalid url for the repository bookmark"
        });

        return false;
    }
    else if(req.body.ddr.hasPlatform.foaf.nick == 'dspace' || req.body.ddr.hasPlatform.foaf.nick == 'eprints' )
    {
        if(req.body.ddr.hasSwordCollectionUri == null || req.body.ddr.hasSwordCollectionLabel == null)
        {
            res.status(400).json({
                result : "error",
                message : "No collection specified"
            });

            return false;
        }
    }
    else if(req.body.ddr.hasPlatform.foaf.nick == 'figshare' )
    {
        if(req.body.ddr.hasConsumerKey == null)
        {
            res.status(400).json({
                result : "error",
                message : "No consumer key specified"
            });

            return false;
        }
        else if(req.body.ddr.hasConsumerSecret == null)
        {
            res.status(400).json({
                result : "error",
                message : "No consumer secret specified"
            });

            return false;
        }
        else if(req.body.ddr.hasAccessToken == null)
        {
            res.status(400).json({
                result : "error",
                message : "No access token specified"
            });

            return false;
        }
        else if(req.body.ddr.hasAccessTokenSecret == null)
        {
            res.status(400).json({
                result : "error",
                message : "No access token secret specified"
            });

            return false;
        }
    }

    return true;
}

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
exports.new = function(req, res) {

    if(!req.body)
    {
        return res.status(400).json({
                result : "error",
                message : "HTTP Body of the request was null."
        });
    }
    else if(req.session.user == null)
    {
        return res.status(401).json({
            result : "error",
            message : "You are not logged in the system."
        });
    }
    else if (req.originalMethod == "POST")
    {
        try{
            if(req.body.ddr.hasPlatform.foaf.nick == 'eprints' )
            {
                req.body.ddr.hasSwordCollectionUri = req.body.ddr.hasExternalUrl + Config.swordConnection.EprintsCollectionRef;
                req.body.ddr.hasSwordCollectionLabel = "EPrints";

            }
            else if(req.body.ddr.hasPlatform.foaf.nick == 'b2share'){
                if(req.body.ddr.hasAccessToken == null){
                    req.body.ddr.hasAccessToken = Config.eudatToken;
                }
            }


            if(validateNewBookmarkRequest(req, res)) {
                var newBookmark = new ExternalRepository({
                    dcterms: {
                        title: req.body.dcterms.title,
                        creator: req.session.user.uri
                    },
                    ddr: {
                        hasUsername: req.body.ddr.hasUsername,
                        hasPlatform: req.body.ddr.hasPlatform.uri,
                        hasExternalUri: req.body.ddr.hasExternalUrl,
                        hasSwordCollectionLabel: req.body.ddr.hasSwordCollectionLabel,
                        hasSwordCollectionUri: req.body.ddr.hasSwordCollectionUri,
                        hasConsumerKey: req.body.ddr.hasConsumerKey,
                        hasConsumerSecret: req.body.ddr.hasConsumerSecret,
                        hasAccessToken: req.body.ddr.hasAccessToken,
                        hasAccessTokenSecret: req.body.ddr.hasAccessTokenSecret,
                        hasOrganization: req.body.ddr.hasOrganization
                    }
                }, req.session.user.ddr.username);

                if (newBookmark instanceof ExternalRepository) {
                    newBookmark.save(function (err, result) {
                        if (!err) {
                            res.json({
                                result: "ok",
                                message: "New bookmark saved as " + newBookmark.dcterms.title
                            });
                        }
                        else {
                            res.status(500).json({
                                result: "error",
                                message: "Error saving new bookmark . " + result
                            });
                        }
                    });
                }
                else {
                    res.status(500).json({
                        result: "error",
                        message: "Error saving the new bookmark. Error reported: " + newBookmark.error
                    });
                }
            }
        }
        catch(e)
        {
            res.status(400).json({
                result : "error",
                message : "Invalid HTTP Body : " + e.message
            });
        }
    }
    else
    {
        res.status(400).json({
            result : "error",
            message : "Invalid HTTP Method. Only POST requests are allowed."
        });
    }
}

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

exports.my = function(req, res) {
    ExternalRepository.findByCreator(req.session.user.uri, function(err, myRepositoryBookmarks){
        if(!err)
        {
            var getPlatformDetails = function(myRepositoryBookmark, callback)
            {
                RepositoryPlatform.findByUri(myRepositoryBookmark.ddr.hasPlatform, function(err, platform){
                    if(!err)
                    {
                        if(platform != null)
                        {
                            myRepositoryBookmark.ddr.hasPlatform = platform;
                        }

                        callback(null, myRepositoryBookmark);
                    }
                    else
                    {
                        callback(err, platform);
                    }
                });
            }

            async.map(myRepositoryBookmarks, getPlatformDetails, function(err, bookmarksWithPlatforms){
                if(!err)
                {
                    res.json(bookmarksWithPlatforms);
                }
                else
                {
                    var msg = "Error fetching repository platforms for your bookmarks.";

                    res.status(500).json({
                        result : "error",
                        message : msg
                    });
                }
            });
        }
        else
        {
            var msg = "Unable to find repository bookmarks created by " + req.session.user.uri + " . Error returned : " + myRepositoryBookmarks;

            res.status(500).json({
                result : "error",
                message : msg
            });
        }
    });
}

exports.all = function(req, res) {
    ExternalRepository.all(function(err, externalRepositories){

        if(!err)
        {
            for(var i = 0; i < externalRepositories.length; i++)
            {
                Descriptor.removeUnauthorizedFromObject([Config.types.private, Config.types.audit], [Config.types.api_readable]);
            }

            res.json(externalRepositories);
        }
        else
        {
            var msg = "Unable to retrieve all instances of external repositories";
            res.status(500).json({
                result : "error",
                message : msg
            });
        }
    });
};

exports.delete = function(req, res){
    var requestedResourceUri = Config.baseUri + req.originalUrl;

    if(req.originalMethod == "DELETE")
    {
        ExternalRepository.findByUri(requestedResourceUri, function(err, bookmark){
            if(!err)
            {
                if(!bookmark)
                {
                    var msg = "Unable to retrieve the requested bookmark for deletion.";
                    res.status(400).json({
                        result : "error",
                        message : msg
                    });
                }
                else
                {
                    bookmark.deleteAllMyTriples(function(err, result){
                        if(!err)
                        {
                            var msg = "Bookmark " + bookmark.dcterms.title + " successfully deleted. ";
                            res.json({
                                result : "ok",
                                message : msg
                            });
                        }
                        else
                        {
                            var msg = "Error deleting bookmark " + requestedResourceUri + ". Error reported: " + result;
                            res.status(500).json({
                                result : "error",
                                message : msg
                            });
                        }
                    });
                }
            }
            else
            {
                var msg = "Unable to retrieve types of external repository platforms for this Dendro instance.";
                res.status(500).json({
                    result : "error",
                    message : msg
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
exports.repository_types = function(req, res){

    RepositoryPlatform.all(function(err, types){
        if(!err)
        {
            res.json(types);
        }
        else
        {
            var msg = "Unable to retrieve types of external repository platforms for this Dendro instance.";
            res.status(500).json({
                result : "error",
                message : msg
            });
        }
    });
};

