const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const ArchivedResource = require(Pathfinder.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const _ = require('underscore');
const request = require('request');

exports.show_deep = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
    else
    {
        if(!req.params.showing_project_root)
        {
            InformationElement.findByUri(req.params.requestedResourceUri, function(err, resource){
                if(!err)
                {
                    if(!isNull(resource))
                    {
                        requestedResource.findMetadataRecursive(function(err, result){
                            if(isNull(err)){

                                const accept = req.header('Accept');
                                let serializer = null;
                                let contentType = null;
                                if(isNull(accept) || accept in Config.metadataSerializers === false)
                                {
                                    serializer = Config.defaultMetadataSerializer;
                                    contentType = Config.defaultMetadataContentType;
                                }
                                else{
                                    serializer = Config.metadataSerializers[accept];
                                    contentType = Config.metadataContentTypes[accept];
                                }

                                result.is_project_root = false;

                                res.set('Content-Type', contentType);
                                res.send(serializer(result));

                            }
                            else{
                                res.status(500).json({
                                    error_messages : "Error finding metadata from " + requestedResource.uri + "\n" + result
                                });
                            }
                        }, true);
                    }
                    else
                    {
                        res.status(404).json({
                            result: "error",
                            message : "Resource " + req.params.requestedResourceUri + " not found.",
                            error : resource
                        });
                    }
                }
                else
                {
                    res.status(500).json({
                        result: "error",
                        message : "Error fetching resource " + req.params.requestedResourceUri,
                        error: resource
                    });
                }

            });
        }
        else
        {
            res.status(400).json({
                result: "error",
                message : "This is not the root of a project"
            });
        }
    }
};

exports.show = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
    else
    {
        if(!req.params.showing_project_root)
        {
            InformationElement.findByUri(req.params.requestedResourceUri, function(err, requestedResource){
                if(!err)
                {
                    if(!isNull(requestedResource))
                    {
                        requestedResource.findMetadataRecursive(function(err, result){
                            if(isNull(err))
                            {
                                const accept = req.header('Accept');
                                let serializer = null;
                                let contentType = null;
                                if(isNull(accept) || accept in Config.metadataSerializers === false)
                                {
                                    serializer = Config.defaultMetadataSerializer;
                                    contentType = Config.defaultMetadataContentType;
                                }
                                else{
                                    serializer = Config.metadataSerializers[accept];
                                    contentType = Config.metadataContentTypes[accept];
                                }

                                result.is_project_root = false;

                                res.set('Content-Type', contentType);
                                res.send(serializer(result));

                            }
                            else{
                                res.status(500).json({
                                    error_messages : "Error finding metadata from " + requestedResource.uri + "\n" + result
                                });
                            }
                        }, true);
                    }
                    else
                    {
                        res.status(404).json({
                            result: "error",
                            message : "Resource " + req.params.requestedResourceUri + " not found.",
                            error : resource
                        });
                    }
                }
                else
                {
                    res.status(400).json({
                        result: "error",
                        message : "This is not the root of a project"
                    });
                }
            });
        }
    }
};

exports.show_parent = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
    else
    {
        if(!isNull(req.params.filepath))
        {
            const requestedResourceURI = req.params.requestedResourceUri;

            InformationElement.findByUri(requestedResourceURI, function(err, ie){
                if(isNull(err))
                {
                    if(!isNull(ie))
                    {
                        ie.getParent(function(err, parent){
                            if(isNull(err))
                            {
                                if(!isNull(parent) && parent instanceof Object)
                                {
                                    const descriptors = parent.getDescriptors([Config.types.private, Config.types.locked], [Config.types.api_readable]);

                                    if(!isNull(projectDescriptors) && projectDescriptors instanceof Array)
                                    {
                                        res.json({
                                            result : "ok",
                                            descriptors : descriptors
                                        });
                                    }
                                    else
                                    {
                                        res.status(500).json({
                                            error_messages : [descriptors]
                                        });
                                    }
                                }
                                else
                                {
                                    res.status(404).json({
                                        result : "error",
                                        message : "Unable to retrieve parent of " + requestedResourceURI + " .",
                                        error : parent
                                    });
                                }
                            }
                            else
                            {
                                res.status(500).json({
                                    result : "error",
                                    message : "Error retrieving resource " + requestedResourceURI + " . Error reported " + parent
                                });
                            }
                        });
                    }
                    else
                    {
                        res.status(404).json({
                            result : "error",
                            message : "Unable to retrieve resource " + requestedResourceURI + " ."
                        });
                    }
                }
                else
                {
                    res.status(500).json({
                        result : "error",
                        message : "Unable to get metadata for " + requestedResourceURI
                    });
                }
            });
        }
    }
};

exports.update = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        })
    }
    else
    {
        const requestedResourceURI = req.params.requestedResourceUri;

        InformationElement.findByUri(requestedResourceURI, function(err, resource)
        {
            if(isNull(err))
            {
                if(!isNull(resource))
                {
                    const descriptors = [];

                    if(req.body instanceof Array)
                    {
                        for(let i = 0; i < req.body.length; i++)
                        {
                            const rawDescriptor = req.body[i];

                            const descriptor = new Descriptor({
                                prefix: rawDescriptor.prefix,
                                shortName: rawDescriptor.shortName,
                                value: rawDescriptor.value,
                                uri: rawDescriptor.uri,
                                prefixedForm: rawDescriptor.prefixedForm
                            });

                            if(!(descriptor instanceof Descriptor) && !isNull(descriptor.error))
                            {
                                res.status(400).json({
                                    result : "Error",
                                    message : descriptor.error
                                });

                                return;
                            }
                            else
                            {
                                //prevent changes on non-public/non-changeable descriptors
                                if(!descriptor.private && !descriptor.locked)
                                {
                                    descriptors.push(descriptor);
                                }
                            }
                        }

                        Descriptor.mergeDescriptors(descriptors, function(err, fusedDescriptors)
                        {
                            if(isNull(err))
                            {
                                let changeAuthor;
                                if(!isNull(req.user))
                                {
                                     changeAuthor = req.user.uri;
                                }

                                resource.replaceDescriptors(fusedDescriptors, [Config.types.locked, Config.types.private], []);

                                resource.save(function(err, record)
                                {
                                    if(isNull(err))
                                    {
                                        record.reindex(req.index, function(err, result)
                                        {
                                            if(isNull(err))
                                            {
                                                //Refresh metadata evaluation
                                                require(Pathfinder.absPathInSrcFolder("/controllers/evaluation.js")).shared.evaluate_metadata(req, function(err, evaluation)
                                                {
                                                    if (evaluation.metadata_evaluation !== resource.ddr.metadataQuality)
                                                    {

                                                        resource.ddr.metadataQuality = evaluation.metadata_evaluation;
                                                        resource.save(function (err, result)
                                                        {
                                                            if (isNull(err))
                                                            {
                                                                res.json({
                                                                    result: "OK",
                                                                    message: "Updated successfully.",
                                                                    new_metadata_quality_assessment: evaluation
                                                                });
                                                            }
                                                            else
                                                            {
                                                                res.status(500).json({
                                                                    result: "Error",
                                                                    message: "Unable to retrieve metadata recommendations for uri: " + requestedResourceURI + ". Error reported : " + error + " Response : " + JSON.stringify(response) + " Body : " + JSON.stringify(body)
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            result: "OK",
                                                            message: "Updated successfully.",
                                                            new_metadata_quality_assessment: evaluation
                                                        });
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                res.status(500).json({
                                                    result : "Error",
                                                    message : "Error updating resource : unable to reindex new values. Error reported : " + result
                                                });
                                            }
                                        });
                                    }
                                    else
                                    {
                                        res.status(500).json({
                                            result: "Error saving new record",
                                            message : record
                                        })
                                    }
                                }, true, changeAuthor, [Config.types.locked], [], [Config.types.audit]);
                            }
                            else
                            {
                                res.status(500).json({
                                    result: "Error merging descriptors",
                                    message : fusedDescriptors
                                })
                            }
                        });
                    }
                    else
                    {
                        const error = "Unable to update metadata for : " + req.params.requestedResourceUri + ". JSON metadata must be sent in the body of the POST request and the Content-Type header should be set to 'application/json'";
                        console.error(error);
                        res.status(400).json({
                            result : "Error",
                            message : error
                        });
                    }
                }
                else
                {
                    const error = "Resource with uri : " + req.params.requestedResourceUri + " is not present in the system. Error retrieved : " + resource;
                    res.status(404).json({
                        result : "Error",
                        message : error
                    });
                }
            }
            else
            {
                const error = "Unable to retrieve resource with uri : " + req.params.requestedResourceUri + ". Error retrieved : " + resource;
                console.error(error);
                res.status(500).json({
                    result : "Error",
                    message : error
                });
            }
        });
    }
};

exports.show_version = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
    else
    {
        const requestedResourceURI = req.params.requestedResourceUri;

        let requestedVersion;
        try{
             requestedVersion = parseInt(req.query.version);
             if(isNaN(requestedVersion))
             {
                 throw "Invalid Integer";
             }
        }
        catch(e)
        {
            return res.status(405).json({
                result: "error",
                message: "Revision must be an integer"
            });
        }

        ArchivedResource.findByResourceAndVersionNumber(requestedResourceURI, requestedVersion, function (err, version)
        {
            if (err)
            {
                const error = "Unable to retrieve Archived resource with uri : " + requestedResourceURI + ". Error retrieved : " + version;
                console.error(error);
                res.status(500).json({
                    result: "Error",
                    message: error
                });
            }
            else
            {
                if (!isNull(version))
                {
                    let descriptors = version.getPublicDescriptorsForAPICalls();
                    res.json({
                        descriptors: descriptors
                    });
                }
                else
                {
                    const error = "Unable to retrieve Archived resource with uri : " + requestedResourceURI;
                    console.error(error);
                    res.status(404).json({
                        result: "Error",
                        message: error
                    });
                }

            }
        });
    }
};

exports.restore_metadata_version = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        })
    }
    else
    {
        const requestedResourceURI = req.params.requestedResourceUri;
        const requestedVersion = req.body.version;

        Resource.findByUri(requestedResourceURI, function(err, resource)
        {
            if(isNull(err))
            {
                //if resource exists
                if(!isNull(resource))
                {
                    if(!isNull(requestedVersion) && typeof requestedVersion === 'number' && requestedVersion%1 === 0)
                    {
                        ArchivedResource.findByResourceAndVersionNumber(requestedResourceURI, requestedVersion, function(err, version){
                            if(isNull(err))
                            {
                                if(!isNull(version))
                                {
                                    const user = req.user;
                                    let userUri;

                                    if(user)
                                    {
                                        userUri = user.uri;
                                    }
                                    else
                                    {
                                        userUri = null;
                                    }

                                    resource.restoreFromArchivedVersion(version, function(err, result){
                                        if(isNull(err))
                                        {
                                            res.status(200).json({
                                                result : "OK",
                                                message : "Resource " + requestedResourceURI + " succesfully restored to version " + requestedVersion
                                            });
                                        }
                                        else
                                        {
                                            const error = "Error restoring version  " + requestedVersion + "  of resource : " + requestedResourceURI + ". Error retrieved : " + JSON.stringify(result);
                                            console.error(error);
                                            res.status(500).json({
                                                result : "Error",
                                                message : error
                                            });
                                        }
                                    }, userUri);
                                }
                                else
                                {
                                    const error = "Version  " + requestedVersion +"  of resource : " + requestedResourceURI + " does not exist.";
                                    console.error(error);
                                    res.status(404).json({
                                        result : "Not Found",
                                        message : error
                                    });
                                }
                            }
                            else
                            {
                                const error = "Unable to retrieve version  " + requestedVersion +"  of resource : " + requestedResourceURI + ". Error retrieved : " + JSON.stringify(resource);
                                console.error(error);
                                res.status(500).json({
                                    result : "Error",
                                    message : error
                                });
                            }
                        });
                    }
                    else
                    {
                        const error = "Unable to retrieve version  " + requestedVersion +"  of resource : " + requestedResourceURI + ". " + requestedVersion + " is not a valid integer and version number, which ranges from 0 to +inf";
                        console.error(error);
                        res.status(405).json({
                            result : "Error",
                            message : error
                        });
                    }
                }
                else
                {
                    const error = "Unable to retrieve version  " + requestedVersion +"  of resource : " + requestedResourceURI + ". Error retrieved : " + JSON.stringify(resource);
                    console.error(error);
                    res.status(500).json({
                        result : "Error",
                        message : error
                    });
                }
            }
            else
            {
                const error = "Unable to retrieve resource with uri : " + req.params.requestedResourceUri + ". Error retrieved : " + resource;
                console.error(error);
                res.status(500).json({
                    result : "Error",
                    message : error
                });
            }
        });
    }
};



