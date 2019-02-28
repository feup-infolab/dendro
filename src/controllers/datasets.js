const rlequire = require("rlequire");
const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
const B2ShareClient = require("@feup-infolab/node-b2share-v2");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;
const File = rlequire("dendro", "src/models/directory_structure/file.js").File;
const RepositoryPlatform = rlequire("dendro", "src/models/harvesting/repo_platform").RepositoryPlatform;
const swordConnection = rlequire("dendro", "src/export_libs/sword-connection/index.js");
const Figshare = rlequire("dendro", "src/export_libs/figshare/figshare.js");
const Zenodo = rlequire("dendro", "src/export_libs/zenodo/zenodo.js");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const CkanUtils = rlequire("dendro", "src/utils/datasets/ckanUtils.js");
const generalDatasetUtils = rlequire("dendro", "src/utils/datasets/generalDatasetUtils.js");

const async = require("async");
const _ = require("underscore");
const fs = require("fs");

let exportToRepositorySword = function (req, res)
{
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri))
    {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        Logger.log("error", msg);
        res.status(500).json(
            {
                result: "error",
                message: msg
            }
        );
    }
    else
    {
        Folder.findByUri(requestedResourceUri, function (err, folder)
        {
            if (isNull(err))
            {
                if (!isNull(folder))
                {
                    if (isNull(folder.dcterms.title))
                    {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        Logger.log("error", msg);
                        res.status(400).json(
                            {
                                result: "error",
                                message: msg
                            }
                        );
                    }
                    else
                    {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                        {
                            if (isNull(err))
                            {
                                generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files)
                                {
                                    if (isNull(err))
                                    {
                                        Logger.log("Package for export " + requestedResourceUri + " created.");

                                        let serviceDocumentRef = null;

                                        if (targetRepository.ddr.hasPlatform.foaf.nick === "dspace")
                                        {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.DSpaceServiceDocument;
                                        }
                                        else if (targetRepository.ddr.hasPlatform.foaf.nick === "eprints")
                                        {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.EprintsServiceDocument;
                                        }
                                        const options = {
                                            files: files,
                                            collectionRef: targetRepository.ddr.hasSwordCollectionUri,
                                            repositoryType: targetRepository.ddr.hasPlatform.foaf.nick,
                                            user: targetRepository.ddr.username,
                                            password: targetRepository.ddr.password,
                                            serviceDocRef: serviceDocumentRef
                                        };

                                        swordConnection.sendFiles(options, function (err, message)
                                        {
                                            if (isNull(err))
                                            {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. " + message;
                                                Logger.log(msg);
                                                res.json(
                                                    {
                                                        result: "OK",
                                                        message: msg
                                                    }
                                                );
                                            }
                                            else
                                            {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                const msg = "Error exporting folder '" + folder.nie.title + "' from the Dendro platform. " + message;
                                                Logger.log("error", msg);
                                                res.status(500).json(
                                                    {
                                                        result: "error",
                                                        message: msg
                                                    }
                                                );
                                            }
                                        });
                                    }
                                    else
                                    {
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        Logger.log("error", msg);
                                        res.status(500).json(
                                            {
                                                result: "error",
                                                message: msg
                                            }
                                        );
                                    }
                                });
                            }
                            else
                            {
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                Logger.log("error", msg);
                                res.status(500).json(
                                    {
                                        result: "error",
                                        message: msg
                                    }
                                );
                            }
                        });
                    }
                }
                else
                {
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    Logger.log("error", msg);
                    res.status(400).json(
                        {
                            result: "error",
                            message: msg
                        }
                    );
                }
            }
            else
            {
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                Logger.log("error", msg);
                res.status(500).json(
                    {
                        result: "error",
                        message: msg
                    }
                );
            }
        });
    }
};

exports.calculate_ckan_repository_diffs = function (req, res)
{
    try
    {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        CkanUtils.calculateCkanRepositoryDiffs(requestedResourceUri, targetRepository, function (err, diffs)
        {
            if (isNull(err))
            {
                res.json(diffs);
            }
            else
            {
                Logger.log("error", "calculate_ckan_repository_diffs error: " + diffs.error.message);
                res.status(diffs.error.statusCode).json(
                    {
                        result: "error",
                        message: diffs.error.message
                    }
                );
            }
        });
    }
    catch (e)
    {
        const msg = "Error when checking if ckan package has diffs with Dendro: " + e.message;
        Logger.log("error", msg);
        res.status(500).json(
            {
                result: "error",
                message: msg
            }
        );
    }
};

export_to_repository_ckan = function (req, res)
{
    try
    {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;
        const privacy = req.body.publicDeposit;

        let overwrite = false;
        let deleteChangesOriginatedFromCkan = false;
        let propagateDendroChangesIntoCkan = false;
        try
        {
            overwrite = JSON.parse(req.body.overwrite);
        }
        catch (e)
        {
            Logger.log("error", "Invalid value supplied to overwrite parameter. Not overwriting by default.");
        }

        try
        {
            deleteChangesOriginatedFromCkan = JSON.parse(req.body.deleteChangesOriginatedFromCkan);
        }
        catch (e)
        {
            Logger.log("error", "Invalid value supplied to deleteChangesOriginatedFromCkan parameter. Not overwriting by default.");
        }

        try
        {
            propagateDendroChangesIntoCkan = JSON.parse(req.body.propagateDendroChangesIntoCkan);
        }
        catch (e)
        {
            Logger.log("error", "Invalid value supplied to propagateDendroChangesIntoCkan parameter. Not overwriting by default.");
        }

        const checkPermissionsDictionary = {
            dendroDiffs: propagateDendroChangesIntoCkan,
            ckanDiffs: deleteChangesOriginatedFromCkan
        };

        if (!isNull(req.body.repository) && !isNull(req.body.repository.ddr))
        {
            const organization = req.body.repository.ddr.hasOrganization;

            async.waterfall([
                function (callback)
                {
                    CkanUtils.checkResourceTypeAndChildren(requestedResourceUri, callback);
                },
                function (childrenInfo, callback)
                {
                    CkanUtils.buildPermissionsToBeCheck(requestedResourceUri, targetRepository, callback);
                },
                function (toCheck, callback)
                {
                    CkanUtils.validateChangesPermissions(checkPermissionsDictionary, toCheck, callback);
                },
                function (resultOfPermissions, callback)
                {
                    CkanUtils.checkIfFolderAndTargetRepositoryHaveRequiredMetadata(requestedResourceUri, targetRepository, callback);
                },
                function (folder, callback)
                {
                    CkanUtils.buildExtrasJSONArray(folder, callback);
                },
                function (folder, extrasJSONArray, callback)
                {
                    // construir o client e fazer o resto das funções
                    const CKAN = require("ckan");
                    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
                    CkanUtils.buildPackageForCkanExport(client, organization, targetRepository, extrasJSONArray, folder, callback);
                },
                function (result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents, callback)
                {
                    // parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents
                    // dataset was found, do we want to update or not?
                    CkanUtils.exportPackageToCkan(overwrite, requestedResourceUri, targetRepository, result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents, callback);
                }
            ], function (err, result, resultInfo)
            {
                if (!isNull(err))
                {
                    Logger.log("error", "export_to_repository_ckan error: " + resultInfo.message);
                    res.status(resultInfo.statusCode).json({
                        result: "error",
                        message: resultInfo.message
                    });
                }
                else
                {
                    // The success case
                    // Update the exportedAt property in the ckan package
                    const CKAN = require("ckan");
                    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
                    let packageId = CkanUtils.createPackageID(requestedResourceUri);

                    const user = req.user;
                    let registryData = {
                        dcterms: {
                            title: targetRepository.dcterms.title,
                            creator: user,
                            identifier: result
                        },
                        ddr: {
                            // exportedFromProject: project.uri,
                            exportedFromFolder: requestedResourceUri,
                            privacyStatus: isNull(privacy) || privacy === false ? "private" : "public",
                            hasOrganization: organization,
                            exportedToRepository: targetRepository.ddr.hasExternalUri,
                            exportedToPlatform: "CKAN"
                        }
                    };
                    CkanUtils.updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result)
                    {
                        Folder.findByUri(requestedResourceUri, function (err, folder)
                        {
                            folder.getOwnerProject(function (err, project)
                            {
                                registryData.ddr.exportedFromProject = project.uri;
                                Deposit.createDeposit(registryData, function (err, deposit)
                                {
                                    res.json({
                                        result: resultInfo.result,
                                        message: resultInfo.message
                                    });
                                });
                            });
                        });
                    });
                }
            });
        }
        else
        {
            const message = "Request body must contain the organization to which the user wants to submit the datataset in the field \"repository.ddr.hasOrganization\"";
            Logger.log("error", message);
            res.status(400).json(
                {
                    result: "error",
                    message: message
                }
            );
        }
    }
    catch (e)
    {
        const message = "Error exporting to repository: " + e.message;
        Logger.log("error", message);
        res.status(500).json(
            {
                result: "error",
                message: message
            }
        );
    }
};

export_to_repository_figshare = function (req, res)
{
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri))
    {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        Logger.log("error", msg);
        res.status(500).json(
            {
                result: "error",
                message: msg
            }
        );
    }
    else
    {
        Folder.findByUri(requestedResourceUri, function (err, folder)
        {
            if (isNull(err))
            {
                if (!isNull(folder))
                {
                    if (isNull(folder.dcterms.title))
                    {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        Logger.log("error", msg);
                        res.status(400).json(
                            {
                                result: "error",
                                message: msg
                            }
                        );
                    }
                    else
                    {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                        {
                            if (isNull(err))
                            {
                                generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files)
                                {
                                    if (isNull(err))
                                    {
                                        Logger.log("Package for export " + requestedResourceUri + " created.");

                                        try
                                        {
                                            const accessCodes = {
                                                consumer_key: targetRepository.ddr.hasConsumerKey,
                                                consumer_secret: targetRepository.ddr.hasConsumerSecret,
                                                access_token: targetRepository.ddr.hasAccessToken,
                                                access_token_secret: targetRepository.ddr.hasAccessTokenSecret
                                            };

                                            let title;
                                            if (Array.isArray(folder.dcterms.title))
                                            {
                                                title = folder.dcterms.title[0];
                                            }
                                            else
                                            {
                                                title = folder.dcterms.title;
                                            }
                                            let description;
                                            if (Array.isArray(folder.dcterms.description))
                                            {
                                                description = folder.dcterms.description[0];
                                            }
                                            else
                                            {
                                                description = folder.dcterms.description;
                                            }

                                            const article_data = {
                                                title: title,
                                                description: description
                                            };

                                            const figshare = new Figshare(accessCodes);
                                            figshare.createArticle(article_data, function (err, article)
                                            {
                                                if (err)
                                                {
                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Error creating article on figshare";
                                                    Logger.log("error", msg);
                                                    res.status(500).json(
                                                        {
                                                            result: "error",
                                                            message: msg
                                                        }
                                                    );
                                                }
                                                else
                                                {
                                                    figshare.addMultipleFilesToArticle(article.article_id, files, function (err)
                                                    {
                                                        if (err)
                                                        {
                                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Error adding files to article on figshare";
                                                            Logger.log("error", msg);
                                                            res.status(500).json(
                                                                {
                                                                    result: "error",
                                                                    message: msg
                                                                }
                                                            );
                                                        }
                                                        else
                                                        {
                                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
                                                            Logger.log(msg);
                                                            res.json(
                                                                {
                                                                    result: "OK",
                                                                    message: msg
                                                                }
                                                            );
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        catch (err)
                                        {
                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                            Logger.log("error", err);
                                            res.status(500).json(
                                                {
                                                    result: "error",
                                                    message: err
                                                }
                                            );
                                        }
                                    }
                                    else
                                    {
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        Logger.log("error", msg);
                                        res.status(500).json(
                                            {
                                                result: "error",
                                                message: msg
                                            }
                                        );
                                    }
                                });
                            }
                            else
                            {
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                Logger.log("error", msg);
                                res.status(500).json(
                                    {
                                        result: "error",
                                        message: msg
                                    }
                                );
                            }
                        });
                    }
                }
                else
                {
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    Logger.log("error", msg);
                    res.status(400).json(
                        {
                            result: "error",
                            message: msg
                        }
                    );
                }
            }
            else
            {
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                Logger.log("error", msg);
                res.status(500).json(
                    {
                        result: "error",
                        message: msg
                    }
                );
            }
        });
    }
};

const export_to_repository_zenodo = function (req, res)
{
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri))
    {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        Logger.log("error", msg);
        res.status(500).json(
            {
                result: "error",
                message: msg
            }
        );
    }
    else
    {
        Folder.findByUri(requestedResourceUri, function (err, folder)
        {
            if (isNull(err))
            {
                if (!isNull(folder))
                {
                    if (isNull(folder.dcterms.title))
                    {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        Logger.log("error", msg);
                        res.status(400).json(
                            {
                                result: "error",
                                message: msg
                            }
                        );
                    }
                    else
                    {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                        {
                            if (isNull(err))
                            {
                                generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files)
                                {
                                    if (isNull(err))
                                    {
                                        Logger.log("Package for export " + requestedResourceUri + " created.");

                                        try
                                        {
                                            const accessToken = targetRepository.ddr.hasAccessToken;
                                            const hasExternalUri = targetRepository.ddr.hasExternalUri;

                                            let title;
                                            if (Array.isArray(folder.dcterms.title))
                                            {
                                                title = folder.dcterms.title[0];
                                            }
                                            else
                                            {
                                                title = folder.dcterms.title;
                                            }
                                            let description;
                                            if (Array.isArray(folder.dcterms.description))
                                            {
                                                description = folder.dcterms.description[0];
                                            }
                                            else
                                            {
                                                description = folder.dcterms.description;
                                            }

                                            const data = {
                                                title: title,
                                                description: description,
                                                creator: folder.dcterms.creator
                                            };

                                            let zenodo = null;
                                            try
                                            {
                                                zenodo = new Zenodo(accessToken, hasExternalUri);
                                            }
                                            catch (error)
                                            {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                const msg = "Error creating Zenodo client, error: " + error.message;
                                                Logger.log("error", msg);
                                                return res.status(500).json(
                                                    {
                                                        result: "error",
                                                        message: msg
                                                    }
                                                );
                                            }

                                            zenodo.createDeposition(data, function (err, deposition)
                                            {
                                                if (err)
                                                {
                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Error creating new deposition resource in Zenodo";
                                                    Logger.log("error", msg);
                                                    res.status(500).json(
                                                        {
                                                            result: "error",
                                                            message: msg
                                                        }
                                                    );
                                                }
                                                else
                                                {
                                                    const depositionID = deposition.id;

                                                    zenodo.uploadMultipleFilesToDeposition(depositionID, files, function (err)
                                                    {
                                                        if (err)
                                                        {
                                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Error uploading multiple files to deposition in Zenodo, error: " + JSON.stringify(err);
                                                            Logger.log("error", msg);
                                                            res.status(500).json(
                                                                {
                                                                    result: "error",
                                                                    message: msg
                                                                }
                                                            );
                                                        }
                                                        else
                                                        {
                                                            zenodo.depositionPublish(depositionID, function (err, data)
                                                            {
                                                                if (err)
                                                                {
                                                                    const msg = "Error publishing a deposition in Zenodo";
                                                                    Logger.log("error", msg);
                                                                    res.status(500).json(
                                                                        {
                                                                            result: "error",
                                                                            message: msg
                                                                        }
                                                                    );
                                                                }
                                                                else
                                                                {
                                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                                    let msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
                                                                    msg = msg + "<br/><br/><a href='" + data.links.record_html + "'>Click to see your published dataset<\/a>";
                                                                    Logger.log(msg);
                                                                    res.json(
                                                                        {
                                                                            result: "OK",
                                                                            message: msg,
                                                                            data: data
                                                                        }
                                                                    );
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        catch (err)
                                        {
                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                            Logger.log("error", err);
                                            res.status(500).json(
                                                {
                                                    result: "error",
                                                    message: err
                                                }
                                            );
                                        }
                                    }
                                    else
                                    {
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        Logger.log("error", msg);
                                        res.status(500).json(
                                            {
                                                result: "error",
                                                message: msg
                                            }
                                        );
                                    }
                                });
                            }
                            else
                            {
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                Logger.log("error", msg);
                                res.status(500).json(
                                    {
                                        result: "error",
                                        message: msg
                                    }
                                );
                            }
                        });
                    }
                }
                else
                {
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    Logger.log("error", msg);
                    res.status(400).json(
                        {
                            result: "error",
                            message: msg
                        }
                    );
                }
            }
            else
            {
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                Logger.log("error", msg);
                res.status(500).json(
                    {
                        result: "error",
                        message: msg
                    }
                );
            }
        });
    }
};

export_to_repository_b2share = function (req, res)
{
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;
    const privacy = req.body.publicDeposit;
    // targetRepository.ddr.hasExternalUri -> the b2share host url

    Folder.findByUri(requestedResourceUri, function (err, folder)
    {
        if (isNull(err))
        {
            if (!isNull(folder))
            {
                if (isNull(folder.dcterms.title) || isNull(folder.dcterms.creator))
                {
                    const msg = "Folder " + folder.uri + " has no title or creator! Please set these properties (from the dcterms metadata schema) and try the exporting process again.";
                    Logger.log("error", msg);
                    res.status(400).json(
                        {
                            result: "error",
                            message: msg
                        }
                    );
                }
                else
                {
                    folder.getOwnerProject(function (err, project)
                    {
                        if (isNull(err))
                        {
                            folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                            {
                                if (isNull(err))
                                {
                                    generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files)
                                    {
                                        if (isNull(err))
                                        {
                                            Logger.log("Package for export " + requestedResourceUri + " created.");

                                            try
                                            {
                                                const accessToken = targetRepository.ddr.hasAccessToken;
                                                let title, description, abstract, publisher, language;
                                                title = generalDatasetUtils.parseDescriptorValue(folder.dcterms.title);
                                                description = generalDatasetUtils.parseDescriptorValue(folder.dcterms.description);
                                                abstract = generalDatasetUtils.parseDescriptorValue(folder.dcterms.abstract);
                                                publisher = generalDatasetUtils.parseDescriptorValue(folder.dcterms.publisher) || generalDatasetUtils.parseDescriptorValue(project.dcterms.publisher) || "http://dendro.fe.up.pt";
                                                language = generalDatasetUtils.parseDescriptorValue(folder.dcterms.language) || generalDatasetUtils.parseDescriptorValue(project.dcterms.language) || "en";

                                                let creators = [];
                                                if (Array.isArray(folder.dcterms.creator))
                                                {
                                                    for (let i = 0; i != folder.dcterms.creator.length; ++i)
                                                    {
                                                        creators.push({creator_name: folder.dcterms.creator[i]});
                                                    }
                                                }
                                                else
                                                {
                                                    creators.push({creator_name: folder.dcterms.creator});
                                                }
                                                const draftData = {
                                                    titles: [{title: title}],
                                                    community: Config.eudatCommunityId,
                                                    open_access: true,
                                                    community_specific: {},
                                                    creators: creators
                                                };

                                                // "descriptions":[{"description":"The abstract of the harem dataset","description_type":"Abstract"}]
                                                if (!isNull(abstract))
                                                {
                                                    if (isNull(draftData.descriptions))
                                                    {
                                                        draftData.descriptions = [
                                                            {
                                                                description: abstract,
                                                                description_type: "Abstract"
                                                            }
                                                        ];
                                                    }
                                                    else
                                                    {
                                                        draftData.descriptions.push({
                                                            description: abstract,
                                                            description_type: "Abstract"
                                                        });
                                                    }
                                                }

                                                if (!isNull(description))
                                                {
                                                    if (isNull(draftData.descriptions))
                                                    {
                                                        draftData.descriptions = [
                                                            {
                                                                description: description,
                                                                description_type: "Other"
                                                            }
                                                        ];
                                                    }
                                                    else
                                                    {
                                                        draftData.descriptions.push({
                                                            description: description,
                                                            description_type: "Other"
                                                        });
                                                    }
                                                }

                                                if (folder.dcterms.contributor)
                                                {
                                                    if (Array.isArray(folder.dcterms.contributor))
                                                    {
                                                        _.map(folder.dcterms.contributor, function (contributor)
                                                        {
                                                            let newCreator = {
                                                                creator_name: contributor
                                                            };
                                                            draftData.creators.push(newCreator);
                                                            return draftData;
                                                        });
                                                    }
                                                    else
                                                    {
                                                        let newCreator = {
                                                            creator_name: folder.dcterms.contributor
                                                        };
                                                        draftData.creators.push(newCreator);
                                                    }
                                                }

                                                if (!isNull(publisher))
                                                {
                                                    draftData.publisher = publisher;
                                                }

                                                if (folder.dcterms.subject)
                                                {
                                                    if (Array.isArray(folder.dcterms.subject))
                                                    {
                                                        draftData.keywords = folder.dcterms.subject;
                                                    }
                                                    else
                                                    {
                                                        let keywords = [];
                                                        keywords.push(folder.dcterms.subject);
                                                        draftData.keywords = keywords;
                                                    }
                                                }

                                                if (!isNull(language))
                                                {
                                                    draftData.language = language;
                                                }

                                                let b2shareClient;
                                                try
                                                {
                                                    b2shareClient = new B2ShareClient(targetRepository.ddr.hasExternalUri, accessToken);
                                                }
                                                catch (err)
                                                {
                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Invalid B2SHARE host or user access token";
                                                    Logger.log("error", msg);
                                                    return res.status(500).json(
                                                        {
                                                            result: "error",
                                                            message: msg
                                                        }
                                                    );
                                                }
                                                b2shareClient.createADraftRecord(draftData, function (err, body)
                                                {
                                                    if (!isNull(err))
                                                    {
                                                        generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                        const msg = "Error creating new draft resource in B2Share";
                                                        Logger.log("error", msg);
                                                        res.status(500).json(
                                                            {
                                                                result: "error",
                                                                message: msg
                                                            }
                                                        );
                                                    }
                                                    else
                                                    {
                                                        // TODO send email
                                                        const recordIDToUpdate = body.data.id;
                                                        const bucketUrlToListFiles = body.data.links.files;
                                                        const fileBucketID = bucketUrlToListFiles.split("/").pop();
                                                        prepareFilesForUploadToB2share(files, fileBucketID, b2shareClient, function (error, result)
                                                        {
                                                            if (!isNull(error))
                                                            {
                                                                Logger.log("error", "Error at export_to_repository_b2share: " + JSON.stringify(result));
                                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                                const msg = "Error uploading a file into a draft in B2Share";
                                                                res.status(500).json(
                                                                    {
                                                                        result: "error",
                                                                        message: msg
                                                                    }
                                                                );
                                                            }
                                                            else
                                                            {
                                                                b2shareClient.listUploadedFilesInRecord(fileBucketID, function (err, info)
                                                                {
                                                                    if (!isNull(err))
                                                                    {
                                                                        const msg = "Could not compare the Number of files uploaded to B2SHARE with files in Dendro, will not publish the draft!";
                                                                        Logger.log("error", msg);
                                                                        res.status(500).json(
                                                                            {
                                                                                result: "error",
                                                                                message: msg
                                                                            }
                                                                        );
                                                                    }
                                                                    else
                                                                    {
                                                                        // TODO send email
                                                                        if (isNull(info) || isNull(info.data) || isNull(info.data.contents) || !(info.data.contents instanceof Array))
                                                                        {
                                                                            const msg = "Could not compare the Number of files uploaded to B2SHARE with files in Dendro, will not publish the draft!";
                                                                            Logger.log("error", msg);
                                                                            res.status(500).json(
                                                                                {
                                                                                    result: "error",
                                                                                    message: msg
                                                                                }
                                                                            );
                                                                        }
                                                                        else if (info.data.contents.length === files.length)
                                                                        {
                                                                            b2shareClient.submitDraftRecordForPublication(recordIDToUpdate, function (err, body)
                                                                            {
                                                                                if (!isNull(err))
                                                                                {
                                                                                    const msg = "Error publishing a draft in B2Share";
                                                                                    Logger.log("error", msg);
                                                                                    res.status(500).json(
                                                                                        {
                                                                                            result: "error",
                                                                                            message: msg
                                                                                        }
                                                                                    );
                                                                                }
                                                                                else
                                                                                {
                                                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                                                    let msg = "Folder " + folder.nie.title + " successfully exported from Dendro";
                                                                                    if (!isNull(body.data) && !isNull(body.data.metadata) && typeof body.data.metadata.ePIC_PID !== "undefined")
                                                                                    {
                                                                                        msg = msg + "<br/><br/><a href='" + body.data.metadata.ePIC_PID + "'>Click to see your published dataset<\/a>";
                                                                                    }
                                                                                    res.json(
                                                                                        {
                                                                                            result: "OK",
                                                                                            message: msg
                                                                                        }
                                                                                    );
                                                                                }
                                                                            });
                                                                        }
                                                                        else
                                                                        {
                                                                            const msg = "Number of files uploaded to B2SHARE do not match with files in Dendro, will not publish the draft!";
                                                                            Logger.log("error", msg);
                                                                            res.status(500).json(
                                                                                {
                                                                                    result: "error",
                                                                                    message: msg
                                                                                }
                                                                            );
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                            catch (err)
                                            {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                Logger.log("error", err);
                                                res.status(500).json(
                                                    {
                                                        result: "error",
                                                        message: err
                                                    }
                                                );
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    result: "error",
                                    message: "Unable to get owner project of " + requestedResourceUri,
                                    error: project
                                }
                            );
                        }
                    });
                }
            }
            else
            {
                res.status(404).json(
                    {
                        result: "error",
                        message: "Folder identified by " + requestedResourceUri + " does not exist"
                    }
                );
            }
        }
        else
        {
            res.status(500).json(
                {
                    result: "error",
                    message: "Error finding" + requestedResourceUri
                }
            );
        }
    });
};

export_to_dendro = function (req, res)
{
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;
    const privacy = req.body.publicDeposit;

    File.findByUri(requestedResourceUri, function (err, file)
    {
        if (isNull(err))
        {
            if (!isNull(file))
            {
                file.getOwnerProject(function (err, project)
                {
                    if (isNull(err))
                    {
                        const registryData = {
                            dcterms: {
                                title: project.dcterms.title,
                                creator: req.user.uri,
                                identifier: "123456789"
                            },
                            ddr: {
                                exportedFromProject: project.uri,
                                exportedFromFolder: file.uri,
                                privacyStatus: isNull(privacy) || privacy === false ? "private" : "public",
                                exportedToRepository: "Dendro",
                                exportedToPlatform: "Dendro"
                            }

                        };
                        Deposit.createDeposit({registryData: registryData, requestedResource: file, user: req.user}, function (err2, registry)
                        {
                            /* file.copyPaste({destinationFolder: "Home"}, function (err3, writtenPath)
                            {
                                const a = 1;
                            }); */
                            let msg = "<br/><br/>Deposited successfully to Dendro. Check deposit <a href='" + registry.uri + "'>here</a>";
                            res.json(
                                {
                                    result: "OK",
                                    message: msg
                                }
                            );
                        });
                    }
                });
            }
            else
            {
                Folder.findByUri(requestedResourceUri, function (err, folder)
                {
                    if (isNull(err))
                    {
                        if (!isNull(folder))
                        {
                            folder.getOwnerProject(function (err, project)
                            {
                                if (isNull(err))
                                {
                                    const registryData = {
                                        dcterms: {
                                            title: folder.dcterms.title,
                                            creator: req.user.uri,
                                            identifier: "123456789"
                                        },
                                        ddr: {
                                            exportedFromProject: project.uri,
                                            exportedFromFolder: folder.uri,
                                            privacyStatus: isNull(privacy) || privacy === false ? "private" : "public",
                                            exportedToRepository: "Dendro",
                                            exportedToPlatform: "Dendro"
                                        }

                                    };
                                    Folder.copyPaste({user: registryData.dcterms.creator, includeMetadata: true, destinationFolder: "/Home"}, function (err, writtenPath)
                                    {
                                        const a = writtenPath;
                                    });
                                    Deposit.createDeposit({
                                        registryData: registryData,
                                        requestedResource: folder,
                                        user: req.user
                                    }, function (err, registry)
                                    {
                                        let msg = "<br/><br/>Deposited successfully to Dendro. Check deposit <a href='" + registry.uri + "'>here</a>";
                                        res.json(
                                            {
                                                result: "OK",
                                                message: msg
                                            }
                                        );
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
};

exports.export_to_repository = function (req, res)
{
    let nick;
    try
    {
        const targetRepository = req.body.repository;

        async.waterfall([
            function (callback)
            {
                if (typeof targetRepository.ddr.hasPlatform === "string")
                {
                    RepositoryPlatform.findByUri(targetRepository.ddr.hasPlatform, function (err, repositoryPlatform)
                    {
                        if (isNull(err))
                        {
                            nick = repositoryPlatform.foaf.nick;
                            callback(null, nick);
                        }
                        else
                        {
                            const msg = "Invalid repository platform: " + JSON.stringify(repositoryPlatform);
                            Logger.log("error", msg);
                            callback(true, msg);
                        }
                    });
                }
                else
                {
                    nick = targetRepository.ddr.hasPlatform.foaf.nick;
                    callback(null, nick);
                }
            }
        ], function (err, results)
        {
            if (nick === "ckan")
            {
                export_to_repository_ckan(req, res);
            }
            else if (nick === "dspace" || nick === "eprints")
            {
                exportToRepositorySword(req, res);
            }
            else if (nick === "figshare")
            {
                export_to_repository_figshare(req, res);
            }
            else if (nick === "zenodo")
            {
                export_to_repository_zenodo(req, res);
            }
            else if (nick === "b2share")
            {
                export_to_repository_b2share(req, res);
            }
            else if (nick === "dendro")
            {
                export_to_dendro(req, res);
            }
            else if (nick === "local")
            {
                export_to_dendro(req, res);
            }
            else
            {
                const msg = "Invalid target repository";
                Logger.log("error", msg);
                res.status(500).json(
                    {
                        result: "error",
                        message: msg
                    }
                );
            }
        });
    }
    catch (e)
    {
        const msg = "Error exporting to repository: " + e.message;
        Logger.log("error", msg);
        res.status(500).json(
            {
                result: "error",
                message: msg
            }
        );
    }
};

exports.sword_collections = function (req, res)
{
    const targetRepository = req.body.repository;
    let serviceDocumentRef = null;
    if (targetRepository.ddr.hasPlatform.foaf.nick === "dspace")
    {
        serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.DSpaceServiceDocument;
    }
    else if (targetRepository.ddr.hasPlatform.foaf.nick === "eprints")
    {
        serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.EprintsServiceDocument;
    }
    const options = {
        user: targetRepository.ddr.username,
        password: targetRepository.ddr.password,
        serviceDocRef: serviceDocumentRef
    };
    swordConnection.listCollections(options, function (err, message, collections)
    {
        if (isNull(err))
        {
            Logger.log(message);
            res.json(collections);
        }
        else
        {
            Logger.log("error", message);
            res.status(500).json(
                {
                    result: "error",
                    message: message
                }
            );
        }
    });
};

prepareFilesForUploadToB2share = function (files, fileBucketID, b2shareClient, cb)
{
    async.each(files, function (file, callback)
    {
        const info = {fileBucketID: fileBucketID, fileNameWithExt: file.split("/").pop()};
        fs.readFile(file, function (err, buffer)
        {
            if (err)
            {
                const msg = "There was an error reading a file";
                return callback(err, msg);
            }
            b2shareClient.uploadFileIntoDraftRecord(info, buffer, function (err, data)
            {
                return callback(err, data);
            });
        });
    }, function (error, data)
    {
        cb(error, data);
    });
};
