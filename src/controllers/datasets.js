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
/*const CKAN = require("ckan.js");*/
/*const CKAN = require("ckan");*/
//const CKAN = require("C:\\Users\\Utilizador\\Desktop\\InfoLab\\ckanModuleRepo\\ckan.js");

const async = require("async");
const nodemailer = require("nodemailer");
const flash = require("connect-flash");
const _ = require("underscore");
const fs = require("fs");

const createPackage = function (parentFolderPath, folder, callback) {

    const folderToZip = path.join(parentFolderPath, folder.nie.title);
    const outputFilenameZip = path.join(parentFolderPath, folder.nie.title + ".zip");
    const outputFilenameRDF = path.join(parentFolderPath, folder.nie.title + ".rdf");
    const outputFilenameTXT = path.join(parentFolderPath, folder.nie.title + ".txt");
    const outputFilenameJSON = path.join(parentFolderPath, folder.nie.title + ".json");

    const filesToIncludeInPackage = [];
    const extraFiles = [];

    async.series([
            function (cb) {
                fs.readdir(folderToZip, function (err, files) {
                    if (isNull(err)) {
                        async.map(files, function (file, callback) {
                            const absPathToChild = path.join(folderToZip, file);
                            fs.stat(absPathToChild, function (err, stats) {
                                if (!stats.isDirectory()) {
                                    filesToIncludeInPackage.push(absPathToChild);
                                }
                                return callback(err, stats);
                            });
                        }, function (err, results) {
                            cb(err);
                        })
                    }
                    else {
                        cb(err, files);
                    }
                })
            },
            function (cb) {
                const archiver = require('archiver');

                const output = fs.createWriteStream(outputFilenameZip);

                const zipArchive = archiver('zip', {
                    zlib: {level: 9} // Sets the compression level.
                });

                //const zipArchive = archiver('zip');

                zipArchive.pipe(output);

                /*zipArchive.bulk([
                 {expand: true, src: ["**"], cwd: folderToZip}
                 ]);*/

                //TODO
                zipArchive.directory(folderToZip, outputFilenameZip);

                zipArchive.finalize(function (err, bytes) {

                    if (err) {
                        throw err;
                    }
                });

                output.on('close', function () {
                    console.log('Done with the zip', folderToZip);
                    filesToIncludeInPackage.push(outputFilenameZip);
                    extraFiles.push(outputFilenameZip);

                    folder.findMetadataRecursive(function (err, result) {
                        if (isNull(err)) {
                            const metadataRDF = require('pretty-data').pd.xml(Serializers.metadataToRDF(result));

                            fs.writeFile(outputFilenameRDF, metadataRDF, function (err) {
                                if (isNull(err)) {
                                    console.log("The file " + outputFilenameRDF + " was saved!");
                                    filesToIncludeInPackage.push(outputFilenameRDF);
                                    extraFiles.push(outputFilenameRDF);

                                    const metadataTXT = Serializers.metadataToText(result);

                                    fs.writeFile(outputFilenameTXT, metadataTXT, function (err) {
                                        if (isNull(err)) {
                                            console.log("The file " + outputFilenameTXT + " was saved!");
                                            filesToIncludeInPackage.push(outputFilenameTXT);
                                            extraFiles.push(outputFilenameTXT);

                                            const metadataJSON = require('pretty-data').pd.json(JSON.stringify(result));

                                            fs.writeFile(outputFilenameJSON, metadataJSON, function (err) {
                                                if (isNull(err)) {
                                                    console.log("The file " + outputFilenameJSON + " was saved!");
                                                    filesToIncludeInPackage.push(outputFilenameJSON);
                                                    extraFiles.push(outputFilenameJSON);

                                                    cb(null, null);
                                                } else {
                                                    console.log(err);
                                                    cb(true, null);
                                                }
                                            });

                                        } else {
                                            console.log(err);
                                            cb(true, null);
                                        }

                                    });

                                } else {
                                    console.log(err);
                                    cb(true, null);
                                }

                            });
                        }
                        else {
                            const msg = "Error finding metadata in " + folder.uri;
                            console.error(msg);
                            cb(true, null);

                        }
                    });
                });
            }
        ],
        function (err, results) {
            if (isNull(err)) {
                return callback(err, filesToIncludeInPackage, extraFiles);
            }
            else {
                return callback(err, results);
            }
        });
};

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
                                createPackage(parentFolderPath, folder, function (err, files) {
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
                                                deleteFolderRecursive(parentFolderPath);
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
                                                deleteFolderRecursive(parentFolderPath);
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


const calculateDiffsBetweenDendroCkan = function (requestedResourceUri, targetRepository, callback) {
    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
    let exportedAtDate = null;
    let changedResourcesInCkan = [];

    Folder.findByUri(requestedResourceUri, function (err, folder) {
        if (isNull(err)) {
            if (!isNull(folder)) {
                const slug = require('slug');
                let packageId = slug(folder.uri, "-");
                packageId = packageId.replace(/[^A-Za-z0-9-]/g, "-").replace(/\./g, "-").toLowerCase();
                client.action("package_show",
                    {
                        id: packageId
                    },
                    function (err, result) {
                        if (!isNull(err) && isNull(result)) {
                            const msg = "[ERROR] invalid ckan uri or api key";
                            console.error(JSON.stringify(err));
                            let info = {
                                error : {
                                    message: msg,
                                    statusCode: 400
                                }
                            };
                            callback(true, info);
                        }
                        else
                        {
                            if (result.success) {
                                getExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                                    if (isNull(err)) {
                                        //package exists and was exported by Dendro before
                                        exportedAtDate = result;
                                        client.getChangesInDatasetAfterDate(exportedAtDate, packageId, function (err, result) {
                                            if(result.success) {
                                                /*if (result.result.changedResources) {
                                                    changedResourcesInCkan = result.result.changedResources;
                                                }*/
                                                changedResourcesInCkan = result.result.changedResources;
                                                compareDendroPackageWithCkanPackage(folder, packageId, client, function (err, diffs) {
                                                    if (isNull(err)) {
                                                        callback(err, {
                                                            dendroDiffs: diffs,
                                                            ckanDiffs: changedResourcesInCkan
                                                        });
                                                    }
                                                    else {
                                                        let msg = "Error comparing a dendro package with a ckan package";
                                                        console.error(msg);
                                                        callback(err, diffs);
                                                    }
                                                });
                                            }
                                            else {
                                                let msg = "Error getting changedResources from ckan repository";
                                                console.error(msg);
                                                callback(err, result);
                                            }
                                        });
                                    }
                                    else {
                                        let msg = "Error getting the exportedAt property from ckan";
                                        console.error(msg);
                                        callback(err, result);
                                    }
                                });
                            }
                            else {
                                let msg = "The ckan package to export does not exist";
                                console.log(msg);
                                callback(err, result);
                            }
                        }
                    });
            }
            else {
                let msg = "The folder to export to ckan does not exist";
                console.error(msg);
                callback(true, msg);
            }
        }
        else {
            let msg = "Error when looking for the folder to export to ckan";
            console.error(msg);
            callback(true, msg);
        }
    });
};

const calculateCkanRepositoryDiffs = function (requestedResourceUri, targetRepository, callback) {
    //HERE CALCULATE CKAN REPOSITORY DIFFS AUX FUNCTION
    const checkIfResourceHasTheRequiredMetadataForExport = function (requestedResourceUri, callback) {
        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (!isNull(err)) {
                let errorInfo = {
                    error : {
                        message: "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder,
                        statusCode: 500
                    }
                };
                console.error(JSON.stringify(errorInfo));
                callback(err, errorInfo);
            }
            else if (isNull(folder)) {
                let errorInfo = {
                    error: {
                        message: requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.",
                        statusCode: 404
                    }
                };
                console.error(JSON.stringify(errorInfo));
                callback(true, errorInfo);
            }
            else {
                //A folder existe, verificar os descritores
                if (isNull(folder.dcterms.title)) {
                    let errorInfo = {
                        error: {
                            message: "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.",
                            statusCode: 400
                        }
                    };
                    console.error(JSON.stringify(errorInfo));
                    callback(true, errorInfo);
                }
                else if (isNull(folder.dcterms.description)) {
                    let errorInfo = {
                        error: {
                            message: "Folder " + folder.uri + " has no description! Please set the Description property (from the dcterms metadata schema) and try the exporting process again.",
                            statusCode: 400
                        }
                    };
                    console.error(JSON.stringify(errorInfo));
                    callback(true, errorInfo);
                }
                else {
                    callback(null, folder, null);
                }
            }
        });
    };

    async.waterfall([
        function(callback) {
            checkIfResourceHasTheRequiredMetadataForExport(requestedResourceUri, function(err, folder) {
                callback(err, folder);
            });
        },
        function(folder, callback) {
            calculateDiffsBetweenDendroCkan(requestedResourceUri, targetRepository, function (err, diffs) {
                callback(err, diffs);
            });
        }
    ],function(err, diffs)
    {
        if (isNull(err)) {
            /*res.json(diffs);*/
            callback(err, diffs);
        }
        else {
            let msg = "";
            if (!isNull(diffs.error)&& !isNull(diffs.error.message) && diffs.error.message === "Not found") {
                //There are no diffs because the package was not exported previously
                //res.json([]);
                /*res.status(200).json(
                    {
                        "result": "Info",
                        "message": "Package was not previously exported"
                    }
                );*/
                callback(null, "Package was not previously exported");
            }
            else {
                msg = "Error when calculating diffs between Dendro and Ckan: " + JSON.stringify(diffs);
                let errorInfo = {
                    error : {
                        message: msg,
                        statusCode: 500
                    }
                };
                console.error(JSON.stringify(errorInfo));
                callback(true, errorInfo);
            }
        }
    });
    //END CALCULATE CKAN REPOSITORY DIFFS AUX FUNCTION
};

exports.calculate_ckan_repository_diffs = function (req, res) {
    /*const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;*/

    try {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        calculateCkanRepositoryDiffs(requestedResourceUri, targetRepository, function (err, diffs) {
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
    /*const checkIfResourceHasTheRequiredMetadataForExport = function (requestedResourceUri, callback) {
        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (!isNull(err)) {
                let errorInfo = {
                    error : {
                        message: "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder,
                        statusCode: 500
                    }
                };
                console.error(JSON.stringify(errorInfo));
                //callback(err, folder, errorInfo);
                callback(err, errorInfo);
            }
            else if (isNull(folder)) {
                let errorInfo = {
                    error: {
                        message: requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.",
                        statusCode: 404
                    }
                };
                console.error(JSON.stringify(errorInfo));
                //callback(true, folder, errorInfo);
                callback(true, errorInfo);
            }
            else {
                //A folder existe, verificar os descritores
                if (isNull(folder.dcterms.title)) {
                    let errorInfo = {
                        error: {
                            message: "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.",
                            statusCode: 400
                        }
                    };
                    console.error(JSON.stringify(errorInfo));
                    //callback(true, folder, errorInfo);
                    callback(true, errorInfo);
                }
                else if (isNull(folder.dcterms.description)) {
                    let errorInfo = {
                        error: {
                            message: "Folder " + folder.uri + " has no description! Please set the Description property (from the dcterms metadata schema) and try the exporting process again.",
                            statusCode: 400
                        }
                    };
                    console.error(JSON.stringify(errorInfo));
                    //callback(true, folder, errorInfo);
                    callback(true, errorInfo);
                }
                else {
                    callback(null, folder, null);
                }
            }
        });
    };
    try {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        async.waterfall([
            function(callback) {
                checkIfResourceHasTheRequiredMetadataForExport(requestedResourceUri, function(err, folder) {
                    callback(err, folder);
                });
            },
            function(folder, callback) {
                calculateDiffsBetweenDendroCkan(requestedResourceUri, targetRepository, function (err, diffs) {
                    callback(err, diffs);
                });
            }
        ],function(err, diffs)
        {
            if (isNull(err)) {
                res.json(diffs);
            }
            else {
                let msg = "";
                if (!isNull(diffs.error.message) && diffs.error.message === "Not found") {
                    //There are no diffs because the package was not exported previously
                    //res.json([]);
                    res.status(200).json(
                        {
                            "result": "Info",
                            "message": "Package was not previously exported"
                        }
                    );
                }
                else {
                    msg = "Error when calculating diffs between Dendro and Ckan: " + JSON.stringify(diffs);
                    res.status(500).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
            }
        });
    }
    catch (e) {
        const msg = "Error when checking if ckan package has diffs with Dendro: " + e.message;
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }*/
};


const compareDendroPackageWithCkanPackage = function (folder, packageId, client, callback) {
    let lastExportedAtDate = null;
    let folderResourcesInDendro = null;
    let folderResourcesInCkan = null;
    let dendroDiffs = [];
    let createdInLocal = [];
    let deletedInLocal = [];
    let includeSoftDeletedChildren = false;
    getExportedAtByDendroForCkanDataset(packageId, client, function (err, exportedAtDate) {
        if (isNull(err)) {
            lastExportedAtDate = exportedAtDate;
            client.action("package_show",
                {
                    id: packageId
                },
                function (err, result) {
                    if (result.success) {
                        folderResourcesInCkan = result.result.resources;
                        folder.getChildrenRecursive(function (err, children) {
                            if (isNull(err)) {
                                folderResourcesInDendro = children;
                                let namesOfResourcesInDendro = _.pluck(folderResourcesInDendro, 'name');
                                let dendroMetadataFiles = [folder.nie.title + ".zip", folder.nie.title + ".rdf", folder.nie.title + ".txt", folder.nie.title + ".json"];
                                namesOfResourcesInDendro = namesOfResourcesInDendro.concat(dendroMetadataFiles);
                                let namesOfResourcesInCkan = _.pluck(folderResourcesInCkan, 'id');
                                let dendroIsMissing = _.difference(namesOfResourcesInCkan, namesOfResourcesInDendro);
                                let ckanIsMissing = _.difference(namesOfResourcesInDendro, namesOfResourcesInCkan);

                                async.parallel([
                                        function (callback) {
                                            if (dendroIsMissing.length > 0) {
                                                async.map(dendroIsMissing, function (missingFile, callback) {
                                                    let ckanFile = _.find(folderResourcesInCkan, function (folderResourcesInCkan) {
                                                        return folderResourcesInCkan.id === missingFile;
                                                    });

                                                    if (ckanFile.last_modified < exportedAtDate) {
                                                        //it was deleted in dendro
                                                        //delete in ckan
                                                        let ckanfileEvent = {
                                                            id: ckanFile.id,
                                                            event: "deleted_in_local"
                                                        };
                                                        //dendroDiffs.push(ckanfileEvent);
                                                        deletedInLocal.push(ckanfileEvent);
                                                        callback(err, ckanfileEvent);
                                                    }
                                                    else {
                                                        callback(err, null);
                                                    }
                                                }, function (err, results) {
                                                    callback(err, results);
                                                });
                                            }
                                            else {
                                                callback(err, null);
                                            }
                                        },
                                        function (callback) {
                                            if (ckanIsMissing.length > 0) {
                                                async.map(ckanIsMissing, function (missingFile, callback) {
                                                    let ckanfileEvent = {
                                                        id: missingFile,
                                                        event: "created_in_local"
                                                    };
                                                    //dendroDiffs.push(ckanfileEvent);
                                                    createdInLocal.push(ckanfileEvent);
                                                    callback(err, ckanfileEvent);
                                                }, function (err, results) {
                                                    callback(err, results);
                                                });
                                            }
                                            else {
                                                callback(err, null);
                                            }
                                        }
                                    ],
                                    function (err, results) {
                                        //callback(err, results);
                                        dendroDiffs = createdInLocal.concat(deletedInLocal);
                                        callback(err, dendroDiffs);
                                    });
                            }
                            else {
                                callback(err, children);
                            }
                        }, includeSoftDeletedChildren);
                    }
                    else {
                        callback(err, result);
                    }
                });
        }
        else {
            callback(err, exportedAtDate);
        }
    });
};

const getExportedAtByDendroForCkanDataset = function (packageID, client, callback) {
    client.action("package_show",
        {
            id: packageID
        },
        function (err, result) {
            if (result.success) {
                let exportedAtDate = _.filter(result.result.extras, function (extra) {
                    return extra.key == Elements.ddr.exportedAt.uri + "exportedAt";
                });
                if (isNull(exportedAtDate) || exportedAtDate.length != 1) {
                    callback(true, "There is no property exportedAt for this ckan dataset: packageID : " + packageID);
                }
                else {
                    callback(err, exportedAtDate[0].value);
                }
            }
            else {
                callback(err, result);
            }
        });
};

export_to_repository_ckan = function (req, res) {
    try {
        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        let overwrite = false;
        let deleteChangesOriginatedFromCkan = false;
        let propagateDendroChangesIntoCkan = false;
        let checksNeeded = [];

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

        const createOrUpdateFilesInPackage = function (datasetFolderMetadata, packageId, client, callback, overwrite, extraFiles) {
            const files = [];
            const locations = [];


            for (var i = 0; i < datasetFolderMetadata.original_node.nie.hasLogicalPart.length; i++) {
                const child = datasetFolderMetadata.children[i];
                if (!isNull(child)) {
                    if (child.original_node instanceof File) {
                        files.push(child.original_node);
                        locations.push(datasetFolderMetadata.children[i].temp_location);
                    }
                    else {
                        return callback(1, "There was an error preparing a file in the server: " + JSON.stringify(child));
                    }
                }
            }

            const resources = [];
            const path = require("path");

            for (var i = 0; i < files.length; i++) {
                const file = files[i];
                var location = locations[i];

                var fileExtension = path.extname(location).substr(1);
                var fileName = path.basename(location);

                var record =
                    {
                        absolute_file_path: location,
                        url: targetRepository.ddr.hasExternalUri + "/dataset/" + packageId + "/resource/" + fileName,
                        package_id: packageId,
                        description: file.dcterms.description || '< no description available >',
                        filename: fileName,
                        mimetype: Config.mimeType(fileExtension),
                        extension: fileExtension,
                        format: fileExtension.toUpperCase(),
                        overwrite_if_exists: overwrite
                    };

                resources.push(record);
            }

            for (var i = 0; i < extraFiles.length; i++) {
                var location = extraFiles[i];

                var fileExtension = path.extname(location).substr(1);
                var fileName = path.basename(location);

                var record =
                    {
                        absolute_file_path: location,
                        url: targetRepository.ddr.hasExternalUri + "/dataset/" + packageId + "/resource/" + fileName,
                        package_id: packageId,
                        filename: fileName,
                        mimetype: Config.mimeType(fileExtension),
                        extension: fileExtension,
                        format: fileExtension.toUpperCase(),

                        _if_exists: overwrite
                    };

                if (typeof Config.exporting.generated_files_metadata[fileExtension] !== "undefined") {
                    record.description = Config.exporting.generated_files_metadata[fileExtension].dcterms.description;
                }
                else {
                    record.description = '< no description available >';
                }

                resources.push(record);
            }

            client.upload_files_into_package(resources, packageId, function (err, result) {
                return callback(err, result);
            });
        };

        const updateOrInsertExportedAtByDendroForCkanDataset = function (packageID, client, callback) {
            client.action("package_show",
                {
                    id: packageID
                },
                function (err, result) {
                    if (result.success) {
                        //call package_update with the new date to update the exportedAt
                        //returns the index where the property is located, if the property does not exist returns -1
                        let resultIndex = _.findIndex(result.result.extras, function (extra) {
                            return extra.key === Elements.ddr.exportedAt.uri + "exportedAt"
                        });
                        console.log("The index is: " + resultIndex);

                        let dendroExportedAt = {
                            "key": Elements.ddr.exportedAt.uri + "exportedAt",
                            "value": new Date().toISOString()
                        };

                        if (resultIndex === -1) {
                            //this is the first time that dendro is exporting this dataset to ckan
                            result.result.extras.push(dendroExportedAt);
                        }
                        else {
                            //this is not the first time that dendro is exporting this dataset to ckan
                            //lets update the exportDate
                            result.result.extras[resultIndex] = dendroExportedAt;
                        }

                        client.action(
                            "package_update",
                            result.result,
                            function (err, result) {
                                if (result.success) {
                                    console.log("exportedAt was updated/created in ckan");
                                    callback(err, result);
                                }
                                else {
                                    console.error("Error updating/creating exportedAt in ckan");
                                    callback(err, result);
                                }
                            }
                        );
                    }
                    else {
                        callback(err, result);
                    }
                });
        };


        const deleteResourceInCkan = function (resourceID, packageID, client, callback) {
            client.action("resource_delete",
                {
                    id: resourceID
                },
                function (err, result) {
                    if (result.success) {
                        console.log("The resource with id: " + resourceID + " was deleted");
                        callback(err, result);
                    }
                    else {
                        callback(err, result);
                    }
                });
        };


        const createPackageInCkan = function (parentFolderPath, extraFiles, packageData, datasetFolderMetadata, packageId, client, callback) {
            client.action(
                "package_create",
                packageData,
                function (response, result) {
                    if (result.success) {
                        createOrUpdateFilesInPackage(datasetFolderMetadata, packageId, client, function (err, response) {
                            if (isNull(err)) {
                                const dataSetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                                const msg = "This dataset was exported to the CKAN instance and should be available at: <a href=\"" + dataSetLocationOnCkan + "\">" + dataSetLocationOnCkan + "</a> <br/><br/>";

                                updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                                    console.log(err);
                                    if (isNull(err)) {
                                        /*res.json(
                                         {
                                         "result": "OK",
                                         "message": msg
                                         }
                                         );*/
                                        callback(err, msg);
                                    }
                                    else {
                                        let msg = "Error updating exportedAt property in the dataset to CKAN.";
                                        if (!isNull(response)) {
                                            msg += " Error returned : " + response;
                                        }

                                        /*res.json(
                                         {
                                         "result": "Error",
                                         "message": msg
                                         }
                                         );*/
                                        callback(err, msg);
                                    }
                                });
                            }
                            else {
                                let msg = "Error uploading files in the dataset to CKAN.";
                                if (!isNull(response)) {
                                    msg += " Error returned : " + response;
                                }

                                /*res.json(
                                 {
                                 "result": "Error",
                                 "message": msg,
                                 "error": response
                                 }
                                 );*/
                                callback(err, msg);
                            }

                            deleteFolderRecursive(parentFolderPath);
                        }, overwrite, extraFiles);
                    }
                    else {
                        let msg = "Error exporting dataset to CKAN.";
                        if (!isNull(response)) {
                            msg += " Error returned : " + response;
                        }

                        /*res.json(
                         {
                         "result": "Error",
                         "message": msg
                         }
                         );*/

                        callback(true, msg);

                        deleteFolderRecursive(parentFolderPath);
                    }

                }
            );
        };

        const updatePackageInCkan = function (parentFolderPath, extraFiles, packageData, datasetFolderMetadata, packageId, client, callback) {
            async.waterfall([
                function (callback) {
                    calculateDiffsBetweenDendroCkan(requestedResourceUri, targetRepository, function (err, diffs) {
                        callback(err, diffs);
                    });
                },
                function (diffs, callback) {

                    client.action(
                        "package_update",
                        packageData.result,
                        function (err, result) {
                            callback(err, diffs)
                        }
                    );
                },
                function (diffs, callback) {
                    createOrUpdateFilesInPackage(datasetFolderMetadata, packageId, client, function (err, response) {
                        if (isNull(err)) {
                            const dataSetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                            const finalMsg = "This dataset was exported to the CKAN instance and should be available at: <a href=\"" + dataSetLocationOnCkan + "\">" + dataSetLocationOnCkan + "</a> <br/><br/> The previous version was overwritten.";

                            updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                                if (isNull(err)) {
                                    async.map(diffs.dendroDiffs, function (dendroDiff, cb) {
                                        if (dendroDiff.event === "deleted_in_local") {
                                            deleteResourceInCkan(dendroDiff.id, packageId, client, function (err, result) {
                                                cb(err, result);
                                            });
                                        }
                                        else {
                                            cb(err, result);
                                        }
                                    }, function (err, results) {
                                        if (isNull(err)) {
                                            callback(err, results, finalMsg);
                                            deleteFolderRecursive(parentFolderPath);
                                        }
                                        else {
                                            let msg = "Error uploading files in the dataset to CKAN.";
                                            console.error(msg);
                                            callback(err, results, finalMsg);
                                            deleteFolderRecursive(parentFolderPath);
                                        }
                                    });
                                }
                                else {
                                    let msg = "Error updating exportedAt property in the dataset to CKAN.";
                                    if (!isNull(response)) {
                                        msg += " Error returned : " + response;
                                        console.error(msg);
                                    }
                                    callback(err, result, finalMsg);
                                    deleteFolderRecursive(parentFolderPath);
                                }
                            });
                        }
                        else {
                            let msg = "Error uploading files in the dataset to CKAN.";
                            console.error(msg);
                            callback(err, response, null);
                            deleteFolderRecursive(parentFolderPath);
                        }
                    }, overwrite, extraFiles);
                }
            ], function (err, result, finalMsg) {
                // result now equals 'done'
                callback(err, result, finalMsg);
            });
        };

        const validateChangesPermissions = function(permissionsToCheck, callback) {
            let validated = false;
            async.map(permissionsToCheck, function (permission, cb) {
                if(!checkPermissionsDictionary[permission])
                {
                    const msg = "Missing the permission: " + permission;
                    cb(true, msg);
                }
                else
                {
                    validated = true;
                    cb(false, validated);
                }
            }, function (err, results) {
                if(isNull(err))
                {
                    validated = true;
                    callback(err, validated);
                }
                else
                {
                    callback(err, JSON.stringify(results));
                }
            });
        };

        if (!isNull(req.body.repository) && !isNull(req.body.repository.ddr)) {
            const organization = req.body.repository.ddr.hasOrganization;

            async.waterfall([
                function (callback) {
                    calculateCkanRepositoryDiffs(requestedResourceUri, targetRepository, function (err, diffs) {
                        if(isNull(err))
                        {
                            if(diffs instanceof Object)
                            {
                                _.each( diffs, function( val, key ) {
                                    if(val.length > 0)
                                    {
                                        checksNeeded.push(key.toString());
                                    }
                                });
                                callback(err, checksNeeded);
                            }
                            else
                            {
                                callback(err, checksNeeded);
                            }
                        }
                        else
                        {
                            callback(err, diffs);
                        }
                    });
                },
                function (toCheck, callback) {
                    validateChangesPermissions(toCheck, function (err, resultOfPermissions) {
                        if(isNull(err))
                        {
                            callback(err, resultOfPermissions);
                        }
                        else
                        {
                            let errorInfo = {
                                msg: resultOfPermissions,
                                statusCode: 412
                            };
                            console.error(JSON.stringify(errorInfo));
                            callback(err, null, errorInfo);
                        }
                    });
                },
                function (resultOfPermissions, callback) {
                    Folder.findByUri(requestedResourceUri, function (err, folder) {
                        if (!isNull(err)) {
                            let errorInfo = {
                                msg: "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder,
                                statusCode: 500
                            };
                            console.error(JSON.stringify(errorInfo));
                            callback(err, folder, errorInfo);
                        }
                        else if (isNull(folder)) {
                            let errorInfo = {
                                msg: requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.",
                                statusCode: 400
                            };
                            console.error(JSON.stringify(errorInfo));
                            callback(true, folder, errorInfo);
                            /*res.status(400).json(
                             {
                             "result": "error",
                             "message": msg
                             }
                             );*/
                        }
                        else {
                            //A folder existe, verificar os descritores
                            if (isNull(folder.dcterms.title)) {
                                /*const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                                 console.error(msg);
                                 res.status(400).json(
                                 {
                                 "result": "error",
                                 "message": msg
                                 }
                                 );*/

                                let errorInfo = {
                                    msg: "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.",
                                    statusCode: 400
                                };

                                console.error(JSON.stringify(errorInfo));
                                callback(true, folder, errorInfo);
                            }
                            else if (isNull(folder.dcterms.description)) {
                                /*const msg = "Folder " + folder.uri + " has no description! Please set the Description property (from the dcterms metadata schema) and try the exporting process again.";
                                 console.error(msg);
                                 res.status(400).json(
                                 {
                                 "result": "error",
                                 "message": msg
                                 }
                                 );*/

                                let errorInfo = {
                                    msg: "Folder " + folder.uri + " has no description! Please set the Description property (from the dcterms metadata schema) and try the exporting process again.",
                                    statusCode: 400
                                };

                                console.error(JSON.stringify(errorInfo));
                                callback(true, folder, errorInfo);
                            }
                            else if (isNull(targetRepository.ddr.hasExternalUri)) {
                                /*const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
                                 console.error(msg);
                                 res.status(500).json(
                                 {
                                 "result": "error",
                                 "message": msg
                                 }
                                 );*/

                                let errorInfo = {
                                    msg: "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute",
                                    statusCode: 500
                                };

                                console.error(JSON.stringify(errorInfo));
                                callback(true, folder, errorInfo);
                            }
                            else {
                                //construir o extrasJSONArray
                                const jsonDescriptors = folder.getDescriptors([Elements.access_types.private, Elements.access_types.locked]);

                                const extrasJSONArray = [];

                                jsonDescriptors.forEach(function (column) {
                                    const extraJson = {};
                                    extraJson["key"] = column.uri;
                                    extraJson["value"] = column.value;
                                    extrasJSONArray.push(extraJson);
                                });

                                callback(null, folder, extrasJSONArray);
                            }
                        }
                    });
                },
                function (folder, extrasJSONArray, callback) {
                    //construir o client e fazer o resto das funções
                    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
                    //organization show e depois package show

                    /**Check if organization exists**/
                    client.action("organization_show",
                        {
                            id: targetRepository.ddr.hasOrganization
                        },
                        function (err, info) {
                            if (isNull(err)) {
                                const slug = require('slug');
                                //var slugifiedTitle = slug(folder.dcterms.title, "-");
                                let packageId = slug(folder.uri, "-");

                                //ckan only accepts alphanumeric characters and dashes for the dataset ids
                                //slugifiedTitle = slugifiedTitle.replace(/[^A-Za-z0-9-]/g, "").replace(/\./g, "").toLowerCase();
                                packageId = packageId.replace(/[^A-Za-z0-9-]/g, "-").replace(/\./g, "-").toLowerCase();

                                folder.createTempFolderWithContents(true, true, true, function (err, parentFolderPath, absolutePathOfFinishedFolder, datasetFolderMetadata) {
                                    if (isNull(err)) {
                                        createPackage(parentFolderPath, folder, function (err, files, extraFiles) {
                                            if (isNull(err)) {
                                                const packageContents = [
                                                    {
                                                        name: packageId,
                                                        package_id: packageId,
                                                        title: folder.dcterms.title,
                                                        description: folder.dcterms.description,
                                                        extras: extrasJSONArray,
                                                        owner_org: organization
                                                    }
                                                ];

                                                client.action("package_show",
                                                    {
                                                        id: packageId
                                                    },
                                                    function (err, result) {
                                                        //dataset was found, do we want to update or not?
                                                        //TODO callback here
                                                        //callback(err, result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents);
                                                        //tem de ser com error a false caso contrário entra logo no último callback
                                                        callback(null, result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents);
                                                    }
                                                );
                                            }
                                            else {
                                                /*const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                                 console.error(msg);
                                                 res.status(500).json(
                                                 {
                                                 "result": "error",
                                                 "message": msg
                                                 }
                                                 );*/

                                                let errorInfo = {
                                                    msg: "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.",
                                                    statusCode: 500
                                                };

                                                console.error(JSON.stringify(errorInfo));
                                                callback(true, folder, errorInfo);
                                            }
                                        }, datasetFolderMetadata);
                                    }
                                    else {
                                        /*const msg = "Error creating temporary folder for export folder " + folder.nie.title + " from the Dendro platform.";
                                         console.error(msg);
                                         res.status(500).json(
                                         {
                                         "result": "error",
                                         "message": msg
                                         }
                                         );*/

                                        let errorInfo = {
                                            msg: "Error creating temporary folder for export folder " + folder.nie.title + " from the Dendro platform.",
                                            statusCode: 500
                                        };
                                        console.error(JSON.stringify(errorInfo));
                                        callback(true, folder, errorInfo);
                                    }

                                });
                            }
                            else {
                                let msg = "Unable to check if organization " + targetRepository.ddr.hasOrganization + "  exists.";

                                if (!isNull(info) && !isNull(info.error) && (typeof info.error.message === "string")) {
                                    msg += " Error returned : " + info.error.message;
                                }

                                /*console.error(msg);
                                 res.status(401).json(
                                 {
                                 "result": "error",
                                 "message": msg
                                 }
                                 );*/

                                let errorInfo = {
                                    msg: msg,
                                    statusCode: 401
                                };
                                console.error(JSON.stringify(errorInfo));
                                callback(true, folder, errorInfo);
                            }
                        });

                },
                function (result, parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents, callback) {
                    //parentFolderPath, packageId, extraFiles, datasetFolderMetadata, client, packageContents
                    //dataset was found, do we want to update or not?
                    if (result.success) {
                        /*if (!overwrite) //package was found and we are not overwriting
                        {
                            deleteFolderRecursive(parentFolderPath);

                            const datasetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                            const msg = "This dataset was already exported to this CKAN instance and is available at: <a href=\"" + datasetLocationOnCkan + "\">" + datasetLocationOnCkan + "</a> <br/><br/> Activate the Overwrite option to force an update.";

                            let errorInfo = {
                                msg: msg,
                                statusCode: 500
                            };
                            console.error(JSON.stringify(errorInfo));
                            callback(true, packageId, errorInfo);
                        }
                        else //package was found BUT we are OVERWRITING
                        {*/
                            Utils.copyFromObjectToObject(packageContents[0], result.result);
                            updatePackageInCkan(parentFolderPath, extraFiles, result, datasetFolderMetadata, packageId, client, function (err, result, finalMsg) {
                                if (isNull(err)) {
                                    let resultInfo = {
                                        "result": "OK",
                                        "message": finalMsg
                                    };
                                    callback(null, packageId, resultInfo);
                                }
                                else {
                                    const msg = "Error exporting package to CKAN: " + JSON.stringify(err);
                                    let errorInfo = {
                                        msg: msg,
                                        statusCode: 500
                                    };
                                    console.error(JSON.stringify(errorInfo));
                                    callback(true, packageId, errorInfo);
                                }
                            });
                        /*}*/
                    }
                    //dataset not found
                    else if (!result.success && result.error.__type === "Not Found Error") {

                        createPackageInCkan(parentFolderPath, extraFiles, packageContents[0], datasetFolderMetadata, packageId, client, function (err, finalMsg) {
                            if (isNull(err)) {
                                let resultInfo = {
                                    "result": "OK",
                                    "message": finalMsg
                                };
                                callback(null, packageId, resultInfo);
                            }
                            else {
                                const msg = "Error: " + JSON.stringify(err);
                                let errorInfo = {
                                    msg: msg,
                                    statusCode: 500
                                };
                                console.error(JSON.stringify(errorInfo));
                                callback(true, packageId, errorInfo);
                            }
                        });
                    }
                    //dataset not found and error occurred
                    else if (!result.success && result.error.__type !== "Not Found Error") {
                        deleteFolderRecursive(parentFolderPath);
                        const msg = "Error checking for presence of old dataset for " + requestedResourceUri + " Error reported : " + result;
                        console.error(msg);

                        /*res.status(500).json(
                         {
                         "result": "error",
                         "message": msg
                         }
                         );*/
                        let errorInfo = {
                            msg: msg,
                            statusCode: 500
                        };
                        console.error(JSON.stringify(errorInfo));
                        callback(true, folder, errorInfo);
                    }
                    else {
                        const msg = "Unable to parse response from CKAN repository.";
                        let errorInfo = {
                            msg: msg,
                            statusCode: 401
                        };
                        console.error(JSON.stringify(errorInfo));
                        callback(true, folder, errorInfo);

                        /*res.status(401).json(
                         {
                         "result": "error",
                         "message": "Unable to parse response from CKAN repository."
                         }
                         );*/
                    }
                }
            ], function (err, result, resultInfo) {
                if (!isNull(err)) {
                    res.status(resultInfo.statusCode).json({
                        "result": "error",
                        "message": resultInfo.msg
                    });
                }
                else {
                    res.json({
                        "result": resultInfo.result,
                        "message": resultInfo.message
                    });
                }
            });
        }
        else {
            const msg = "Request body must contain the organization to which the user wants to submit the datataset in the field \"repository.ddr.hasOrganization\"";
            console.error(msg);
            res.status(400).json(
                {
                    "result": "error",
                    "message": msg
                }
            );
        }
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
                                createPackage(parentFolderPath, folder, function (err, files) {
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
                                                    deleteFolderRecursive(parentFolderPath);
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
                                                            deleteFolderRecursive(parentFolderPath);
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
                                                            deleteFolderRecursive(parentFolderPath);
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
                                            deleteFolderRecursive(parentFolderPath);
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

export_to_repository_zenodo = function (req, res) {
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
                                createPackage(parentFolderPath, folder, function (err, files) {
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
                                                    deleteFolderRecursive(parentFolderPath);
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
                                                            deleteFolderRecursive(parentFolderPath);
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
                                                                    deleteFolderRecursive(parentFolderPath);
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
                                            deleteFolderRecursive(parentFolderPath);
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
                    Folder.getOwnerProject(requestedResourceUri, function (err, project) {
                        if (isNull(err)) {
                            folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                                if (isNull(err)) {
                                    createPackage(parentFolderPath, folder, function (err, files) {
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
                                                        deleteFolderRecursive(parentFolderPath);
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
                                                                deleteFolderRecursive(parentFolderPath);
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
                                                                        deleteFolderRecursive(parentFolderPath);
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
                                                 deleteFolderRecursive(parentFolderPath);
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
                                                 deleteFolderRecursive(parentFolderPath);
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
                                                 deleteFolderRecursive(parentFolderPath);

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
                                                deleteFolderRecursive(parentFolderPath);
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
                    /*RepositoryPlatform.getUriFromHumanReadableUri(targetRepository.ddr.hasPlatform, function (err, resourceUri) {
                        if (isNull(err)) {
                            RepositoryPlatform.findByUri(resourceUri, function (err, repositoryPlatform) {
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
                            const msg = "Invalid target repository hasPlatform value: " + JSON.stringify(resourceUri);
                            console.error(msg);
                            callback(true, msg);
                        }
                    });*/
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

            /*if (targetRepository.ddr.hasPlatform.foaf.nick === 'ckan') {
             export_to_repository_ckan(req, res);
             }
             else if (targetRepository.ddr.hasPlatform.foaf.nick === 'dspace' || targetRepository.ddr.hasPlatform.foaf.nick === 'eprints') {
             export_to_repository_sword(req, res);
             }
             else if (targetRepository.ddr.hasPlatform.foaf.nick === 'figshare') {
             export_to_repository_figshare(req, res);
             }
             else if (targetRepository.ddr.hasPlatform.foaf.nick === 'zenodo') {
             export_to_repository_zenodo(req, res);
             }
             else if (targetRepository.ddr.hasPlatform.foaf.nick === 'b2share') {
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
             }*/
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

deleteFolderRecursive = function (path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

prepareFilesForUploadToB2share = function (files, fileBucketID, b2shareClient, cb) {
    async.each(files, function (file, callback) {
        const info = {"fileBucketID": fileBucketID, "fileNameWithExt": file.split('\\').pop()};
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