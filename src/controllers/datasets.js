const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const ExternalRepository = require(Pathfinder.absPathInSrcFolder("/models/harvesting/external_repository.js")).ExternalRepository;
const RepositoryPlatform = require(Pathfinder.absPathInSrcFolder("/models/harvesting/repo_platform")).RepositoryPlatform;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const records = require(Pathfinder.absPathInSrcFolder("/controllers/records.js"));
const Serializers = require(Pathfinder.absPathInSrcFolder("/utils/serializers.js"));
const swordConnection = require(Pathfinder.absPathInSrcFolder("/export_libs/sword-connection/index.js"));
const Figshare = require(Pathfinder.absPathInSrcFolder("/export_libs/figshare/figshare.js"));
const B2ShareClient = require('node-b2share-v2');
const Zenodo = require(Pathfinder.absPathInSrcFolder("/export_libs/zenodo/zenodo.js"));
const Utils = require(Pathfinder.absPathInPublicFolder("/js/utils.js")).Utils;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const CKAN = require("ckan");
const CkanUtils = require(Pathfinder.absPathInSrcFolder("/utils/datasets/ckanUtils.js"));
const generalDatasetUtils = require(Pathfinder.absPathInSrcFolder("/utils/datasets/generalDatasetUtils.js"));

const async = require("async");
const nodemailer = require("nodemailer");
const flash = require("connect-flash");
const _ = require("underscore");
const fs = require("fs");

export_to_repository_sword = function (req, res) {
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri)) {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
    else {
        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (isNull(err)) {
                if (!isNull(folder)) {
                    if (isNull(folder.dcterms.title)) {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (isNull(err)) {
                                generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files) {
                                    if (isNull(err)) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        let serviceDocumentRef = null;

                                        if (targetRepository.ddr.hasPlatform.foaf.nick === "dspace") {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.DSpaceServiceDocument;
                                        }
                                        else if (targetRepository.ddr.hasPlatform.foaf.nick === "eprints") {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.EprintsServiceDocument;
                                        }
                                        const options = {
                                            files: files,
                                            collectionRef: targetRepository.ddr.hasSwordCollectionUri,
                                            repositoryType: targetRepository.ddr.hasPlatform.foaf.nick,
                                            user: targetRepository.ddr.hasUsername,
                                            password: targetRepository.ddr.hasPassword,
                                            serviceDocRef: serviceDocumentRef
                                        };

                                        swordConnection.sendFiles(options, function (err, message) {
                                            if (isNull(err)) {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. " + message;
                                                console.log(msg);
                                                res.json(
                                                    {
                                                        "result": "OK",
                                                        "message": msg
                                                    }
                                                );
                                            }
                                            else {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                const msg = "Error exporting folder '" + folder.nie.title + "' from the Dendro platform. " + message;
                                                console.error(msg);
                                                res.status(500).json(
                                                    {
                                                        "result": "error",
                                                        "message": msg
                                                    }
                                                );
                                            }
                                        });
                                    }
                                    else {
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        console.error(msg);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": msg
                                            }
                                        );
                                    }
                                })
                            }
                            else {
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result": "error",
                                        "message": msg
                                    }
                                );
                            }
                        });
                    }
                }
                else {
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
            }
            else {
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                console.error(msg);
                res.status(500).json(
                    {
                        "result": "error",
                        "message": msg
                    }
                );
            }
        });
    }
};

exports.calculate_ckan_repository_diffs = function (req, res) {
    try {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        CkanUtils.calculateCkanRepositoryDiffs(requestedResourceUri, targetRepository, function (err, diffs) {
            if(isNull(err))
            {
                res.json(diffs);
            }
            else
            {
                res.status(diffs.error.statusCode).json(
                    {
                        "result": "error",
                        "message": diffs.error.message
                    }
                );
            }
        });
    }
    catch (e)
    {
        const msg = "Error when checking if ckan package has diffs with Dendro: " + e.message;
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
};

export_to_repository_ckan = function (req, res) {
    try {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        let overwrite = false;
        let deleteChangesOriginatedFromCkan = false;
        let propagateDendroChangesIntoCkan = false;
        try {
            overwrite = JSON.parse(req.body.overwrite);
        }
        catch (e)
        {
            console.error("Invalid value supplied to overwrite parameter. Not overwriting by default.");
        }

        try {
            deleteChangesOriginatedFromCkan = JSON.parse(req.body.deleteChangesOriginatedFromCkan);
        }
        catch (e)
        {
            console.error("Invalid value supplied to deleteChangesOriginatedFromCkan parameter. Not overwriting by default.");
        }

        try {
            propagateDendroChangesIntoCkan = JSON.parse(req.body.propagateDendroChangesIntoCkan);
        }
        catch (e)
        {
            console.error("Invalid value supplied to propagateDendroChangesIntoCkan parameter. Not overwriting by default.");
        }

        const checkPermissionsDictionary = {
            "dendroDiffs" : propagateDendroChangesIntoCkan,
            "ckanDiffs" : deleteChangesOriginatedFromCkan
        };

        if (!isNull(req.body.repository) && !isNull(req.body.repository.ddr)) {
            const organization = req.body.repository.ddr.hasOrganization;

            async.waterfall([
                function (callback) {
                    CkanUtils.checkResourceTypeAndChildren(requestedResourceUri, callback);
                },
                function (childrenInfo, callback) {
                   CkanUtils.buildPermissionsToBeCheck(requestedResourceUri, targetRepository, callback);
                },
                function (toCheck, callback) {
                    CkanUtils.validateChangesPermissions(checkPermissionsDictionary, toCheck, callback);
                },
                function (resultOfPermissions, callback) {
                    CkanUtils.checkIfFolderAndTargetRepositoryHaveRequiredMetadata(requestedResourceUri, targetRepository, callback);
                },
                function (folder, callback) {
                    CkanUtils.buildExtrasJSONArray(folder, callback);
                },
                function (folder, extrasJSONArray, callback) {
                    //construir o client e fazer o resto das funções
                    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
                    CkanUtils.buildPackageForCkanExport(client, organization, targetRepository, extrasJSONArray, folder, callback);
                },
                function (result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents, callback) {
                    //parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents
                    //dataset was found, do we want to update or not?
                    CkanUtils.exportPackageToCkan(overwrite, requestedResourceUri, targetRepository, result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents, callback);
                }
            ], function (err, result, resultInfo) {
                if (!isNull(err)) {
                    res.status(resultInfo.statusCode).json({
                        "result": "error",
                        "message": resultInfo.message
                    });
                }
                else {
                    //The success case
                    //Update the exportedAt property in the ckan package
                    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
                    let packageId = CkanUtils.createPackageID(requestedResourceUri);
                    CkanUtils.updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                        res.json({
                            "result": resultInfo.result,
                            "message": resultInfo.message
                        });
                    });
                }
            });
        }
        else {
            const message = "Request body must contain the organization to which the user wants to submit the datataset in the field \"repository.ddr.hasOrganization\"";
            console.error(message);
            res.status(400).json(
                {
                    "result": "error",
                    "message": message
                }
            );
        }
    }
    catch (e) {
        const message = "Error exporting to repository: " + e.message;
        console.error(message);
        res.status(500).json(
            {
                "result": "error",
                "message": message
            }
        );
    }
};


export_to_repository_figshare = function (req, res) {
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri)) {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
    else {
        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (isNull(err)) {
                if (!isNull(folder)) {
                    if (isNull(folder.dcterms.title)) {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (isNull(err)) {
                                generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files) {
                                    if (isNull(err)) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        try {
                                            const accessCodes = {
                                                consumer_key: targetRepository.ddr.hasConsumerKey,
                                                consumer_secret: targetRepository.ddr.hasConsumerSecret,
                                                access_token: targetRepository.ddr.hasAccessToken,
                                                access_token_secret: targetRepository.ddr.hasAccessTokenSecret
                                            };

                                            let title;
                                            if (Array.isArray(folder.dcterms.title)) {
                                                title = folder.dcterms.title[0]
                                            }
                                            else {
                                                title = folder.dcterms.title;
                                            }
                                            let description;
                                            if (Array.isArray(folder.dcterms.description)) {
                                                description = folder.dcterms.description[0]
                                            }
                                            else {
                                                description = folder.dcterms.description;
                                            }

                                            const article_data = {
                                                title: title,
                                                description: description
                                            };

                                            const figshare = new Figshare(accessCodes);
                                            figshare.createArticle(article_data, function (err, article) {
                                                if (err) {
                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Error creating article on figshare";
                                                    console.error(msg);
                                                    res.status(500).json(
                                                        {
                                                            "result": "error",
                                                            "message": msg
                                                        }
                                                    );
                                                }
                                                else {
                                                    figshare.addMultipleFilesToArticle(article.article_id, files, function (err) {
                                                        if (err) {
                                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Error adding files to article on figshare";
                                                            console.error(msg);
                                                            res.status(500).json(
                                                                {
                                                                    "result": "error",
                                                                    "message": msg
                                                                }
                                                            );
                                                        }
                                                        else {
                                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
                                                            console.log(msg);
                                                            res.json(
                                                                {
                                                                    "result": "OK",
                                                                    "message": msg
                                                                }
                                                            );
                                                        }
                                                    });


                                                }
                                            });

                                        }
                                        catch (err) {
                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                            console.error(err);
                                            res.status(500).json(
                                                {
                                                    "result": "error",
                                                    "message": err
                                                }
                                            );
                                        }
                                    }
                                    else {
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        console.error(msg);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": msg
                                            }
                                        );
                                    }
                                })
                            }
                            else {
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result": "error",
                                        "message": msg
                                    }
                                );
                            }
                        });
                    }
                }
                else {
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
            }
            else {
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                console.error(msg);
                res.status(500).json(
                    {
                        "result": "error",
                        "message": msg
                    }
                );
            }
        });
    }
};

const export_to_repository_zenodo = function (req, res) {
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri)) {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
    else {
        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (isNull(err)) {
                if (!isNull(folder)) {
                    if (isNull(folder.dcterms.title)) {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (isNull(err)) {
                                generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files) {
                                    if (isNull(err)) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        try {
                                            const accessTocken = targetRepository.ddr.hasAccessToken;


                                            let title;
                                            if (Array.isArray(folder.dcterms.title)) {
                                                title = folder.dcterms.title[0]
                                            }
                                            else {
                                                title = folder.dcterms.title;
                                            }
                                            let description;
                                            if (Array.isArray(folder.dcterms.description)) {
                                                description = folder.dcterms.description[0]
                                            }
                                            else {
                                                description = folder.dcterms.description;
                                            }

                                            const data = {
                                                title: title,
                                                description: description,
                                                creator: folder.dcterms.creator
                                            };

                                            const zenodo = new Zenodo(accessTocken);
                                            zenodo.createDeposition(data, function (err, deposition) {
                                                if (err) {
                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Error creating new deposition resource in Zenodo";
                                                    console.error(msg);
                                                    res.status(500).json(
                                                        {
                                                            "result": "error",
                                                            "message": msg
                                                        }
                                                    );
                                                }
                                                else {
                                                    const depositionID = deposition.id;

                                                    zenodo.uploadMultipleFilesToDeposition(depositionID, files, function (err) {
                                                        if (err) {
                                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Error uploading multiple files to deposition in Zenodo";
                                                            console.error(msg);
                                                            res.status(500).json(
                                                                {
                                                                    "result": "error",
                                                                    "message": msg
                                                                }
                                                            );
                                                        }
                                                        else {
                                                            zenodo.depositionPublish(depositionID, function (err) {
                                                                if (err) {
                                                                    const msg = "Error publishing a deposition in Zenodo";
                                                                    console.error(msg);
                                                                    res.status(500).json(
                                                                        {
                                                                            "result": "error",
                                                                            "message": msg
                                                                        }
                                                                    );
                                                                }
                                                                else {
                                                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                                    const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
                                                                    console.log(msg);
                                                                    res.json(
                                                                        {
                                                                            "result": "OK",
                                                                            "message": msg
                                                                        }
                                                                    );
                                                                }
                                                            })
                                                        }
                                                    });
                                                }


                                            })

                                        }
                                        catch (err) {
                                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                            console.error(err);
                                            res.status(500).json(
                                                {
                                                    "result": "error",
                                                    "message": err
                                                }
                                            );
                                        }
                                    }
                                    else {
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        console.error(msg);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": msg
                                            }
                                        );
                                    }
                                })
                            }
                            else {
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result": "error",
                                        "message": msg
                                    }
                                );
                            }
                        });
                    }
                }
                else {
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
            }
            else {
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                console.error(msg);
                res.status(500).json(
                    {
                        "result": "error",
                        "message": msg
                    }
                );
            }
        });
    }
};

export_to_repository_b2share = function (req, res) {
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;
    //targetRepository.ddr.hasExternalUri -> the b2share host url

    Folder.findByUri(requestedResourceUri, function (err, folder) {
        if (isNull(err)) {
            if (!isNull(folder)) {
                if (isNull(folder.dcterms.title) || isNull(folder.dcterms.creator)) {
                    const msg = "Folder " + folder.uri + " has no title or creator! Please set these properties (from the dcterms metadata schema) and try the exporting process again.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
                else {
                    folder.getOwnerProject(function (err, project) {
                        if (isNull(err)) {
                            folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                                if (isNull(err)) {
                                    generalDatasetUtils.createPackage(parentFolderPath, folder, function (err, files) {
                                        if (isNull(err)) {
                                            console.log("Package for export " + requestedResourceUri + " created.");

                                            try {
                                                const accessToken = targetRepository.ddr.hasAccessToken;

                                                let title;

                                                if (Array.isArray(folder.dcterms.title)) {
                                                    title = folder.dcterms.title[0]
                                                }
                                                else {
                                                    title = folder.dcterms.title;
                                                }
                                                let description;
                                                if (Array.isArray(folder.dcterms.description)) {
                                                    description = folder.dcterms.description[0]
                                                }
                                                else {
                                                    description = folder.dcterms.description;
                                                }

                                                const draftData = {
                                                    "titles": [{"title": title}],
                                                    "community": Config.eudatCommunityId,
                                                    "open_access": true,
                                                    "community_specific": {},
                                                    "creators": [{"creator_name": folder.dcterms.creator}]
                                                };

                                                if (folder.dcterms.contributor) {
                                                    if (Array.isArray(folder.dcterms.contributor)) {
                                                        _.map(folder.dcterms.contributor, function (contributor) {
                                                            let newCreator = {
                                                                creator_name: contributor
                                                            };
                                                            draftData["creators"].push(newCreator);
                                                            return draftData;
                                                        });
                                                    }
                                                    else {
                                                        let newCreator = {
                                                            creator_name: folder.dcterms.contributor
                                                        };
                                                        draftData["creators"].push(newCreator);
                                                    }
                                                }

                                                if (folder.dcterms.publisher) {
                                                    draftData["publisher"] = folder.dcterms.publisher;
                                                }
                                                else if (!isNull(project.dcterms.publisher)) {
                                                    draftData["publisher"] = project.dcterms.publisher;
                                                }
                                                else {
                                                    draftData["publisher"] = "http://dendro.fe.up.pt";
                                                }

                                                if (folder.dcterms.subject) {
                                                    if (Array.isArray(folder.dcterms.subject)) {
                                                        draftData["keywords"] = folder.dcterms.subject
                                                    }
                                                    else {
                                                        let keywords = [];
                                                        keywords.push(folder.dcterms.subject);
                                                        draftData["keywords"] = keywords;
                                                    }
                                                }

                                                if (folder.dcterms.language) {
                                                    draftData["language"] = folder.dcterms.language;
                                                }
                                                else if (!isNull(project.dcterms.language)) {
                                                    draftData["language"] = project.dcterms.language;
                                                }
                                                else {
                                                    draftData["language"] = "en";
                                                }

                                                const b2shareClient = new B2ShareClient(targetRepository.ddr.hasExternalUri, accessToken);
                                                b2shareClient.createADraftRecord(draftData, function (err, body) {
                                                    if (err) {
                                                        generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                        const msg = "Error creating new draft resource in B2Share";
                                                        console.error(msg);
                                                        res.status(500).json(
                                                            {
                                                                "result": "error",
                                                                "message": msg
                                                            }
                                                        );
                                                    }
                                                    else {
                                                        //TODO send email
                                                        const recordIDToUpdate = body.data.id;
                                                        const bucketUrlToListFiles = body.data.links.files;
                                                        const fileBucketID = bucketUrlToListFiles.split('/').pop();

                                                        prepareFilesForUploadToB2share(files, fileBucketID, b2shareClient, function (error, result) {
                                                            if (error) {
                                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                                const msg = "Error uploading a file into a draft in B2Share";
                                                                res.status(500).json(
                                                                    {
                                                                        "result": "error",
                                                                        "message": msg
                                                                    }
                                                                );
                                                            }
                                                            else {
                                                                //TODO send email
                                                                b2shareClient.submitDraftRecordForPublication(recordIDToUpdate, function (err, body) {
                                                                    if (err) {
                                                                        const msg = "Error publishing a draft in B2Share";
                                                                        console.error(msg);
                                                                        res.status(500).json(
                                                                            {
                                                                                "result": "error",
                                                                                "message": msg
                                                                            }
                                                                        );
                                                                    }
                                                                    else {
                                                                        generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                                        let msg = "Folder " + folder.nie.title + " successfully exported from Dendro";

                                                                        if (!isNull(body.data) && !isNull(body.data.metadata) && typeof body.data.metadata.ePIC_PID !== "undefined") {
                                                                            msg = msg + "<br/><br/><a href='" + body.data.metadata.ePIC_PID + "'>Click to see your published dataset<\/a>"
                                                                        }

                                                                        /*
                                                                         const msg = "Folder " + folder.nie.title + " successfully exported from Dendro" ;
                                                                         var recordURL = B2Share.recordPath + "/" + data.body.record_id;

                                                                         var client = nodemailer.createTransport("SMTP", {
                                                                         service: 'SendGrid',
                                                                         auth: {
                                                                         user: Config.sendGridUser,
                                                                         pass: Config.sendGridPassword
                                                                         }
                                                                         });

                                                                         var email = {
                                                                         from: 'support@dendro.fe.up.pt',
                                                                         to: req.user.foaf.mbox,
                                                                         subject: requestedResourceUri + ' exported',
                                                                         text: requestedResourceUri + ' was deposited in B2Share. The URL is ' + recordURL
                                                                         };

                                                                         client.sendMail(email, function(err, info){
                                                                         if(err)
                                                                         {
                                                                         console.log("[NODEMAILER] " + err);
                                                                         flash('error', "Error sending request to user. Please try again later");
                                                                         }
                                                                         else
                                                                         {
                                                                         console.log("[NODEMAILER] email sent: " + info);
                                                                         flash('success', "Sent request to project's owner");
                                                                         }
                                                                         });
                                                                         */
                                                                        /*
                                                                         res.json(
                                                                         {
                                                                         "result": "OK",
                                                                         "message": msg,
                                                                         "recordURL": recordURL
                                                                         }
                                                                         );*/
                                                                        res.json(
                                                                            {
                                                                                "result": "OK",
                                                                                "message": msg
                                                                            }
                                                                        );
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });


                                                /*
                                                 var b2share = new B2Share(accessToken);

                                                 b2share.createDeposition(function(error, deposition){
                                                 if (error) {
                                                 generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                 const msg = "Error creating new deposition resource in B2Share";
                                                 console.error(msg);
                                                 res.status(500).json(
                                                 {
                                                 "result": "error",
                                                 "message": msg
                                                 }
                                                 );
                                                 }
                                                 else{
                                                 var depositionID = JSON.parse(deposition).deposit_id;

                                                 b2share.uploadMultipleFilesToDeposition(depositionID, files, function(error){
                                                 if (error) {
                                                 generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                 const msg = "Error uploading multiple files to deposition in Zenodo";
                                                 console.error(msg);
                                                 res.status(500).json(
                                                 {
                                                 "result": "error",
                                                 "message": msg
                                                 }
                                                 );
                                                 }
                                                 else{
                                                 b2share.depositionPublish(depositionID, data, function(error, data){
                                                 if (error) {
                                                 const msg = "Error publishing a deposition in Zenodo";
                                                 console.error(msg);
                                                 res.status(500).json(
                                                 {
                                                 "result": "error",
                                                 "message": msg
                                                 }
                                                 );
                                                 }
                                                 else{
                                                 generalDatasetUtils.deleteFolderRecursive(parentFolderPath);

                                                 const msg = "Folder " + folder.nie.title + " successfully exported from Dendro" ;
                                                 var recordURL = B2Share.recordPath + "/" + data.body.record_id;

                                                 var client = nodemailer.createTransport("SMTP", {
                                                 service: 'SendGrid',
                                                 auth: {
                                                 user: Config.sendGridUser,
                                                 pass: Config.sendGridPassword
                                                 }
                                                 });

                                                 var email = {
                                                 from: 'support@dendro.fe.up.pt',
                                                 to: req.user.foaf.mbox,
                                                 subject: requestedResourceUri + ' exported',
                                                 text: requestedResourceUri + ' was deposited in B2Share. The URL is ' + recordURL
                                                 };

                                                 client.sendMail(email, function(err, info){
                                                 if(err)
                                                 {
                                                 console.log("[NODEMAILER] " + err);
                                                 flash('error', "Error sending request to user. Please try again later");
                                                 }
                                                 else
                                                 {
                                                 console.log("[NODEMAILER] email sent: " + info);
                                                 flash('success', "Sent request to project's owner");
                                                 }
                                                 });

                                                 res.json(
                                                 {
                                                 "result": "OK",
                                                 "message": msg,
                                                 "recordURL": recordURL
                                                 }
                                                 );
                                                 }
                                                 });
                                                 }
                                                 });
                                                 }
                                                 });*/
                                            }
                                            catch (err) {
                                                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                                console.error(err);
                                                res.status(500).json(
                                                    {
                                                        "result": "error",
                                                        "message": err
                                                    }
                                                );
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            res.status(500).json(
                                {
                                    "result": "error",
                                    "message": "Unable to get owner project of " + requestedResourceUri,
                                    "error": project
                                }
                            )
                        }
                    });
                }
            }
            else {
                res.status(404).json(
                    {
                        "result": "error",
                        "message": "Folder identified by " + requestedResourceUri + " does not exist"
                    }
                )
            }
        }
        else {
            res.status(500).json(
                {
                    "result": "error",
                    "message": "Error finding" + requestedResourceUri
                }
            )
        }
    });
};

exports.export_to_repository = function (req, res) {
    let nick;
    try {

        const targetRepository = req.body.repository;

        async.waterfall([
            function (callback) {
                if (typeof targetRepository.ddr.hasPlatform === "string") {
                    RepositoryPlatform.findByUri(targetRepository.ddr.hasPlatform, function (err, repositoryPlatform) {
                        if (isNull(err)) {
                            nick = repositoryPlatform.foaf.nick;
                            callback(null, nick);
                        }
                        else {
                            const msg = "Invalid repository platform: " + JSON.stringify(repositoryPlatform);
                            console.error(msg);
                            callback(true, msg);
                        }
                    });
                }
                else {
                    nick = targetRepository.ddr.hasPlatform.foaf.nick;
                    callback(null, nick);
                }
            }
        ], function (err, results) {

            if (nick === 'ckan') {
                export_to_repository_ckan(req, res);
            }
            else if (nick === 'dspace' || nick === 'eprints') {
                export_to_repository_sword(req, res);
            }
            else if (nick === 'figshare') {
                export_to_repository_figshare(req, res);
            }
            else if (nick === 'zenodo') {
                export_to_repository_zenodo(req, res);
            }
            else if (nick === 'b2share') {
                export_to_repository_b2share(req, res);
            }
            else {
                const msg = "Invalid target repository";
                console.error(msg);
                res.status(500).json(
                    {
                        "result": "error",
                        "message": msg
                    }
                );
            }
        });
    }
    catch (e) {
        const msg = "Error exporting to repository: " + e.message;
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
};

exports.sword_collections = function (req, res) {
    const targetRepository = req.body.repository;
    let serviceDocumentRef = null;
    if (targetRepository.ddr.hasPlatform.foaf.nick === "dspace") {
        serviceDocumentRef = targetRepository.ddr.hasExternalUrl + Config.swordConnection.DSpaceServiceDocument;
    }
    else if (targetRepository.ddr.hasPlatform.foaf.nick === "eprints") {
        serviceDocumentRef = targetRepository.ddr.hasExternalUrl + Config.swordConnection.EprintsServiceDocument;
    }
    const options = {
        user: targetRepository.ddr.hasUsername,
        password: targetRepository.ddr.hasPassword,
        serviceDocRef: serviceDocumentRef
    };
    swordConnection.listCollections(options, function (err, message, collections) {
        if (isNull(err)) {
            console.log(message);
            res.json(collections)
        }
        else {
            console.error(message);
            res.status(500).json(
                {
                    "result": "error",
                    "message": message
                }
            );
        }
    });
};

prepareFilesForUploadToB2share = function (files, fileBucketID, b2shareClient, cb) {
    async.each(files, function (file, callback) {
        const info = {"fileBucketID": fileBucketID, "fileNameWithExt": file.split('/').pop()};
        fs.readFile(file, function (err, buffer) {
            if (err) {
                const msg = 'There was an error reading a file';
                return callback(err, msg);
            }
            else {
                b2shareClient.uploadFileIntoDraftRecord(info, buffer, function (err, data) {
                    return callback(err, data);
                });
            }
        });
    }, function (error, data) {
        cb(error, data);
    });
};