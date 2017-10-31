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
// const CKAN = require("ckan");
const CKAN = require("/Users/nelsonpereira/Desktop/Infolab/ckanModuleRepo/ckan.js/ckan.js");
const CkanUtils = require(Pathfinder.absPathInSrcFolder("/utils/datasets/ckanUtils.js"));
const generalDatasetUtils = require(Pathfinder.absPathInSrcFolder("/utils/datasets/generalDatasetUtils.js"));

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
                        async.mapSeries(files, function (file, callback) {
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

                            fs.writeFile(outputFilenameRDF, metadataRDF, "utf-8", function (err) {
                                if (isNull(err)) {
                                    console.log("The file " + outputFilenameRDF + " was saved!");
                                    filesToIncludeInPackage.push(outputFilenameRDF);
                                    extraFiles.push(outputFilenameRDF);

                                    const metadataTXT = Serializers.metadataToText(result);

                                    fs.writeFile(outputFilenameTXT, metadataTXT, "utf-8", function (err) {
                                        if (isNull(err)) {
                                            console.log("The file " + outputFilenameTXT + " was saved!");
                                            filesToIncludeInPackage.push(outputFilenameTXT);
                                            extraFiles.push(outputFilenameTXT);

                                            const metadataJSON = require('pretty-data').pd.json(JSON.stringify(result));

                                            fs.writeFile(outputFilenameJSON, metadataJSON, "utf-8", function (err) {
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
        let checksNeeded = [];

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
                   CkanUtils.checkResourceTypeAndChildren(requestedResourceUri, function (err, info) {
                        if(isNull(err))
                        {
                            callback(err, info);
                        }
                        else
                        {
                            let errorInfo = {
                                msg: info.message,
                                statusCode: info.statusCode
                            };
                            callback(err, null, errorInfo);
                        }
                    });
                },
                function (childrenInfo, callback) {
                   CkanUtils.calculateCkanRepositoryDiffs(requestedResourceUri, targetRepository, function (err, diffs) {
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
                            let errorInfo = {
                                msg: diffs.error.message,
                                statusCode: diffs.error.statusCode
                            };
                            callback(err, null, errorInfo);
                        }
                    });
                },
                function (toCheck, callback) {
                   CkanUtils.validateChangesPermissions(checkPermissionsDictionary, toCheck, function (err, resultOfPermissions) {
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
                        }
                        else {
                            //A folder existe, verificar os descritores
                            if (isNull(folder.dcterms.title)) {
                                let errorInfo = {
                                    msg: "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.",
                                    statusCode: 400
                                };

                                console.error(JSON.stringify(errorInfo));
                                callback(true, folder, errorInfo);
                            }
                            else if (isNull(folder.dcterms.description)) {
                                let errorInfo = {
                                    msg: "Folder " + folder.uri + " has no description! Please set the Description property (from the dcterms metadata schema) and try the exporting process again.",
                                    statusCode: 400
                                };

                                console.error(JSON.stringify(errorInfo));
                                callback(true, folder, errorInfo);
                            }
                            else if (isNull(targetRepository.ddr.hasExternalUri)) {
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

                    /**Check if organization exists**/
                    client.action("organization_show",
                        {
                            id: targetRepository.ddr.hasOrganization
                        },
                        function (err, info) {
                            if (isNull(err)) {
                                let packageId = CkanUtils.createPackageID(folder.uri);
                                folder.createTempFolderWithContents(true, true, true, function (err, parentFolderPath, absolutePathOfFinishedFolder, datasetFolderMetadata) {
                                    if (isNull(err)) {
                                        createPackage(parentFolderPath, folder, function (err, files, extraFiles) {
                                            if (isNull(err)) {
                                                const packageContents = [
                                                    {
                                                        name: packageId,
                                                        package_id: packageId,
                                                        title: folder.dcterms.title,
                                                        notes: folder.dcterms.description,
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
                            Utils.copyFromObjectToObject(packageContents[0], result.result);
                            //get exportedAt and save it here
                            let lastExportedAt;
                            CkanUtils.getExportedAtByDendroForCkanDataset(packageId, client, function (err, exportedAt) {
                                if(isNull(err))
                                {
                                    lastExportedAt = exportedAt;
                                    CkanUtils.updatePackageInCkan(requestedResourceUri, targetRepository, parentFolderPath, extraFiles, result, datasetFolderMetadata, packageId, client, function (err, result, finalMsg) {
                                        if (isNull(err)) {
                                            let resultInfo = {
                                                "result": "OK",
                                                "message": finalMsg
                                            };
                                            callback(null, packageId, resultInfo);
                                        }
                                        else {
                                            //if an error occured updating the package in Ckan
                                            //set exportedAt again to the old exportedAt date
                                            CkanUtils.updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, data) {
                                                if(typeof finalMsg !== 'string')
                                                {
                                                    finalMsg = JSON.stringify(finalMsg);
                                                    if(finalMsg.indexOf("upload too large") !== -1)
                                                    {
                                                        finalMsg = "Upload size per file exceeded for your Ckan instance! Contact you system administrator"
                                                    }
                                                }
                                                else
                                                {
                                                    if(finalMsg.indexOf("upload too large") !== -1)
                                                    {
                                                        finalMsg = "Upload size per file exceeded for your Ckan instance! Contact you system administrator"
                                                    }
                                                }
                                                const msg = "Error exporting package to CKAN: " + finalMsg;
                                                let errorInfo = {
                                                    msg: msg,
                                                    statusCode: 500
                                                };
                                                console.error(JSON.stringify(errorInfo));
                                                callback(true, packageId, errorInfo);
                                            }, lastExportedAt);
                                        }
                                    }, overwrite);
                                }
                                else
                                {
                                    const msg = "Error exporting package to CKAN: this package does not have the exportedAt property even though it was previously exported by Dendro";
                                    let errorInfo = {
                                        msg: msg,
                                        statusCode: 500
                                    };
                                    console.error(JSON.stringify(errorInfo));
                                    callback(true, packageId, errorInfo);
                                }
                            });
                    }
                    //dataset not found
                    else if (!result.success && result.error.__type === "Not Found Error") {

                        CkanUtils.createPackageInCkan(targetRepository, parentFolderPath, extraFiles, packageContents[0], datasetFolderMetadata, packageId, client, function (err, finalMsg) {
                            if (isNull(err)) {
                                let resultInfo = {
                                    "result": "OK",
                                    "message": finalMsg
                                };
                                callback(null, packageId, resultInfo);
                            }
                            else {
                                //there was an error trying to create the package
                                //delete what was created of the corrupted package in ckan
                                CkanUtils.purgeCkanDataset(client, packageId, function (err, info) {
                                    if(typeof finalMsg !== 'string')
                                    {
                                        finalMsg = JSON.stringify(finalMsg);
                                        if(finalMsg.indexOf("upload too large") !== -1)
                                        {
                                            finalMsg = "Upload size per file exceeded for your Ckan instance! Contact you system administrator"
                                        }
                                    }
                                    else
                                    {
                                        if(finalMsg.indexOf("upload too large") !== -1)
                                        {
                                            finalMsg = "Upload size per file exceeded for your Ckan instance! Contact you system administrator"
                                        }
                                    }

                                    const msg = "Error: " + finalMsg;
                                    let errorInfo = {
                                        msg: msg,
                                        statusCode: 500
                                    };
                                    console.error(JSON.stringify(errorInfo));
                                    callback(true, packageId, errorInfo);
                                });
                            }
                        }, overwrite);
                    }
                    //dataset not found and error occurred
                    else if (!result.success && result.error.__type !== "Not Found Error") {
                        generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                        const msg = "Error checking for presence of old dataset for " + requestedResourceUri + " Error reported : " + result;
                        console.error(msg);
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
                    //TODO AQUI FAZER UPDATE AO EXPORTED AT ?????
                    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
                    let packageId = CkanUtils.createPackageID(requestedResourceUri);

                    function updateExportedAt() {
                        CkanUtils.updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                            res.json({
                                "result": resultInfo.result,
                                "message": resultInfo.message
                            });
                        }, new Date());
                    }
                    setTimeout(updateExportedAt, 3000);
                    /*CkanUtils.updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                        res.json({
                            "result": resultInfo.result,
                            "message": resultInfo.message
                        });
                    });*/
                    /*res.json({
                        "result": resultInfo.result,
                        "message": resultInfo.message
                    });*/
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