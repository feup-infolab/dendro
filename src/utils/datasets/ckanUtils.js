const async = require("async");
const slug = require('slug');
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const CKAN = require("ckan");
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const generalDatasetUtils = require(Pathfinder.absPathInSrcFolder("/utils/datasets/generalDatasetUtils.js"));


//------CKAN UTILS FOR BOTH EXPORT_TO_CKAN AND CALCULATE_CKAN_DIFFS-----------
const createCkanFileIdBasedOnDendroFileName = function (fileName) {
    const slug = require('slug');
    let newCkanFileID = slug(fileName) + "_exported_by_dendro_" + fileName;
    return newCkanFileID;
};

const verifyIfCkanFileWasCreatedInDendro = function (ckanFile) {
    let ckanFileID = ckanFile.id;
    let ckanFileIDParts = ckanFileID.split("_exported_by_dendro_");
    const slug = require('slug');

    /*if(ckanFileIDParts.length !== 2 || ckanFileIDParts[1] !== ckanFile.name || ckanFileIDParts[0] !== slug(ckanFile.name))
        return false;
    else
    {
        return true;
    }*/

    //backup6txt_exported_by_dendro_backup6.txt
    if(ckanFileIDParts.length !== 2 || slug(ckanFileIDParts[1]) !== ckanFileIDParts[0])
        return false;
    else
    {
        return true;
    }
};

const buildCkanFileIDsFromDendroFileNames = function (namesOfResourcesInDendro) {
    let ckanIdOfResourcesInDendro = [];

    for(let i = 0; i < namesOfResourcesInDendro.length; i++)
    {
        ckanIdOfResourcesInDendro.push(createCkanFileIdBasedOnDendroFileName(namesOfResourcesInDendro[i]));
    }

    return ckanIdOfResourcesInDendro;
};

const compareDendroPackageWithCkanPackage = function (folder, packageId, client, callback) {
    let lastExportedAtDate = null;
    let folderResourcesInDendro = null;
    let folderResourcesInCkan = null;
    let dendroDiffs = [];
    let createdInLocal = [];
    let deletedInLocal = [];
    let includeSoftDeletedChildren = true;
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
                                /*folderResourcesInDendro = children;
                                let namesOfResourcesInDendro = _.pluck(folderResourcesInDendro, 'name');
                                let dendroMetadataFiles = [folder.nie.title + ".zip", folder.nie.title + ".rdf", folder.nie.title + ".txt", folder.nie.title + ".json"];
                                namesOfResourcesInDendro = namesOfResourcesInDendro.concat(dendroMetadataFiles);
                                let namesOfResourcesInCkan = _.pluck(folderResourcesInCkan, 'name');
                                let dendroIsMissing = _.difference(namesOfResourcesInCkan, namesOfResourcesInDendro);
                                let ckanIsMissing = _.difference(namesOfResourcesInDendro, namesOfResourcesInCkan);*/

                                folderResourcesInDendro = children;
                                let namesOfResourcesInDendro = _.pluck(folderResourcesInDendro, 'name');
                                let dendroMetadataFiles = [folder.nie.title + ".zip", folder.nie.title + ".rdf", folder.nie.title + ".txt", folder.nie.title + ".json"];
                                namesOfResourcesInDendro = namesOfResourcesInDendro.concat(dendroMetadataFiles);
                                let ckanIdOfResourcesInDendro = buildCkanFileIDsFromDendroFileNames(namesOfResourcesInDendro);
                                let ckanIdOfResourcesInCkan = _.pluck(folderResourcesInCkan, 'id');
                                let dendroIsMissing = _.difference(ckanIdOfResourcesInCkan, ckanIdOfResourcesInDendro);
                                let ckanIsMissing = _.difference(ckanIdOfResourcesInDendro, ckanIdOfResourcesInCkan);

                                async.parallel([
                                        function (callback) {
                                            if (dendroIsMissing.length > 0) {
                                                async.mapSeries(dendroIsMissing, function (missingFile, callback) {
                                                    let ckanFile = _.find(folderResourcesInCkan, function (folderResourcesInCkan) {
                                                        return folderResourcesInCkan.id === missingFile;
                                                    });

                                                    if(verifyIfCkanFileWasCreatedInDendro(ckanFile)) {
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
                                                        //TODO Here are the files created in the ckan side-> shall we delete these files???
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
                                                async.mapSeries(ckanIsMissing, function (missingFile, callback) {
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
                    return extra.key == Elements.ontologies.ddr.exportedAt.uri + "exportedAt";
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

const createPackageID = function (resourceUri) {
    //ckan only accepts alphanumeric characters and dashes for the dataset ids
    //slugifiedTitle = slugifiedTitle.replace(/[^A-Za-z0-9-]/g, "").replace(/\./g, "").toLowerCase();
    if (isNull(resourceUri)) {
        return null;
    }
    else {
        let packageId = slug(resourceUri, "-");
        packageId = packageId.replace(/[^A-Za-z0-9-]/g, "-").replace(/\./g, "-").toLowerCase();
        return packageId;
    }
};

const checkIfResourceHasTheRequiredMetadataForExport = function (requestedResourceUri, callback) {
    Folder.findByUri(requestedResourceUri, function (err, folder) {
        if (!isNull(err)) {
            let errorInfo = {
                error: {
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

const calculateDiffsBetweenDendroCkan = function (requestedResourceUri, targetRepository, callback) {
    const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);
    let exportedAtDate = null;
    let changedResourcesInCkan = [];

    Folder.findByUri(requestedResourceUri, function (err, folder) {
        if (isNull(err)) {
            if (!isNull(folder)) {
                let packageId = createPackageID(folder.uri);
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
    async.waterfall([
        function (callback) {
            checkIfResourceHasTheRequiredMetadataForExport(requestedResourceUri, function (err, folder) {
                callback(err, folder);
            });
        },
        function (folder, callback) {
            calculateDiffsBetweenDendroCkan(requestedResourceUri, targetRepository, function (err, diffs) {
                callback(err, diffs);
            });
        }
    ], function (err, diffs) {
        if (isNull(err)) {
            callback(err, diffs);
        }
        else {
            let msg = "";
            if (!isNull(diffs.error) && !isNull(diffs.error.message) && diffs.error.message === "Not found") {
                //There are no diffs because the package was not exported previously
                callback(null, "Package was not previously exported");
            }
            else {
                let msg, statusCode;
                if(!isNull(diffs.error) && !isNull(diffs.error.message))
                    msg = "Error when calculating diffs between Dendro and Ckan: " + diffs.error.message;
                else
                    msg = "Error when calculating diffs between Dendro and Ckan: " + JSON.stringify(diffs);

                if(!isNull(diffs.error) && !isNull(diffs.error.statusCode))
                    statusCode = diffs.error.statusCode;
                else
                    statusCode = 500;

                let errorInfo = {
                    error: {
                        message: msg,
                        statusCode: statusCode
                    }
                };
                console.error(JSON.stringify(errorInfo));
                callback(true, errorInfo);
            }
        }
    });
};


//------CKAN UTILS FOR EXPORT_TO_CKAN-----------

const validateChangesPermissions = function(checkPermissionsDictionary, permissionsToCheck, callback) {
    let validated = false;
    async.mapSeries(permissionsToCheck, function (permission, cb) {
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

const updateOrInsertExportedAtByDendroForCkanDataset = function (packageID, client, callback, date) {
    if(isNull(date))
        date = new Date().toISOString();

    client.action("package_show",
        {
            id: packageID
        },
        function (err, result) {
            if (result.success) {
                //call package_update with the new date to update the exportedAt
                //returns the index where the property is located, if the property does not exist returns -1
                let resultIndex = _.findIndex(result.result.extras, function (extra) {
                    return extra.key === Elements.ontologies.ddr.exportedAt.uri + "exportedAt"
                });
                console.log("The index is: " + resultIndex);

                let dendroExportedAt = {
                    "key": Elements.ontologies.ddr.exportedAt.uri + "exportedAt",
                    "value": date
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

const checkResourceTypeAndChildren = function (resourceUri, callback) {
    Folder.findByUri(resourceUri, function (err, folder) {
        if(isNull(err))
        {
            if(isNull(folder))
            {
                let errorInfo = {
                    message : "The folder to export does not exist in Dendro. Are you sure you selected a folder?",
                    statusCode: 404
                };
                callback(true, errorInfo);
            }
            else
            {
                let includeSoftDeletedChildren = true;
                folder.getChildrenRecursive(function (err, children) {
                    if(isNull(err))
                    {
                        if(isNull(children) || children.length <= 0)
                        {
                            let errorInfo = {
                                message : "Error, you cannot export an empty folder to Ckan",
                                statusCode: 412
                            };
                            callback(true, errorInfo);
                        }
                        else
                        {
                            //TODO check if all of the children is of type file
                            /*callback(err, children);*/
                            async.mapSeries(children, function(child, cb) {
                                Folder.findByUri(child.uri, function (err, folder) {
                                    if(isNull(err))
                                    {
                                        if(isNull(folder))
                                        {
                                            cb(err, folder);
                                        }
                                        else
                                        {
                                            let errorInfo = {
                                                message : "Error, you can only export folders that have files and not folders.",
                                                statusCode: 412
                                            };
                                            return callback(true, errorInfo);
                                        }
                                    }
                                    else
                                    {
                                        let errorInfo = {
                                            message : "Error when looking for information about a folder child. Child: " + child.uri + " error: " + JSON.stringify(folder),
                                            statusCode: 500
                                        };
                                        return callback(true, errorInfo);
                                    }
                                });
                            }, function (err, results) {
                                callback(err, children);
                            });
                        }
                    }
                    else
                    {
                        let errorInfo = {
                            message : "Error when searching for folder " + resourceUri  + " children: " +  JSON.stringify(children),
                            statusCode: 500
                        };
                        callback(err, errorInfo);
                    }
                }, includeSoftDeletedChildren);
            }
        }
        else
        {
            let errorInfo = {
                message : "Error when searching for the folder to export in Dendro: " + JSON.stringify(folder),
                statusCode: 500
            };
            callback(err, errorInfo);
        }
    });
};

const createOrUpdateFilesInPackage = function (targetRepository, datasetFolderMetadata, packageId, client, callback, overwrite, extraFiles) {
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
                filename: file.dcterms.title || fileName,
                mimetype: Config.mimeType(fileExtension),
                extension: fileExtension,
                format: fileExtension.toUpperCase(),
                overwrite_if_exists: overwrite,
                id : createCkanFileIdBasedOnDendroFileName(fileName)
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

                overwrite_if_exists: true,
                id : createCkanFileIdBasedOnDendroFileName(fileName)
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

const createPackageInCkan = function (targetRepository, parentFolderPath, extraFiles, packageData, datasetFolderMetadata, packageId, client, callback, overwrite) {
    if(isNull(overwrite))
        overwrite = false;
    client.action(
        "package_create",
        packageData,
        function (response, result) {
            if (result.success) {
                createOrUpdateFilesInPackage(targetRepository, datasetFolderMetadata, packageId, client, function (err, response) {
                    if (isNull(err)) {
                        const dataSetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                        const msg = "This dataset was exported to the CKAN instance and should be available at: <a href=\"" + dataSetLocationOnCkan + "\">" + dataSetLocationOnCkan + "</a> <br/><br/>";

                        updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                            console.log(err);
                            if (isNull(err)) {
                                callback(err, msg);
                            }
                            else {
                                let msg = "Error updating exportedAt property in the dataset to CKAN.";
                                if (!isNull(response)) {
                                    msg += " Error returned : " + response;
                                }
                                callback(err, msg);
                            }
                        });
                    }
                    else {
                        let msg = "Error uploading files in the dataset to CKAN.";
                        if (!isNull(response)) {
                            msg += " Error returned : " + response;
                        }
                        callback(err, msg);
                    }

                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                }, overwrite, extraFiles);
            }
            else {
                let msg = "Error exporting dataset to CKAN.";
                if (!isNull(response)) {
                    msg += " Error returned : " + response;
                }
                callback(true, msg);

                generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
            }

        }
    );
};


const updatePackageInCkan = function (requestedResourceUri, targetRepository, parentFolderPath, extraFiles, packageData, datasetFolderMetadata, packageId, client, callback, overwrite) {
    if(isNull(overwrite))
        overwrite = false;

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
            createOrUpdateFilesInPackage(targetRepository, datasetFolderMetadata, packageId, client, function (err, response) {
                if (isNull(err)) {
                    const dataSetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                    const finalMsg = "This dataset was exported to the CKAN instance and should be available at: <a href=\"" + dataSetLocationOnCkan + "\">" + dataSetLocationOnCkan + "</a> <br/><br/> The previous version was overwritten.";

                    updateOrInsertExportedAtByDendroForCkanDataset(packageId, client, function (err, result) {
                        if (isNull(err)) {
                            async.mapSeries(diffs.dendroDiffs, function (dendroDiff, cb) {
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
                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                                }
                                else {
                                    let msg = "Error uploading files in the dataset to CKAN.";
                                    console.error(msg);
                                    callback(err, results, finalMsg);
                                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
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
                            generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                        }
                    });
                }
                else {
                    let msg = "Error uploading files in the dataset to CKAN: " + JSON.stringify(response);
                    console.error(msg);
                    callback(err, response, msg);
                    generalDatasetUtils.deleteFolderRecursive(parentFolderPath);
                }
            }, overwrite, extraFiles);
        }
    ], function (err, result, finalMsg) {
        // result now equals 'done'
        callback(err, result, finalMsg);
    });
};

//this function is only to be called if createPackageInCkan fails (as the package is being created for the first time) if the package fails to be properly created -> it is purged and the user can export again via dendro
//DO NOT USE THIS if updatePackageInCkan fails -> it will destroy all the work done by the researcher
const purgeCkanDataset = function (client, datasetID, callback) {
    client.action("dataset_purge",
        {
            id: datasetID
        },
        function (err, result) {
            callback(err, result);
        });
};

module.exports = {
    validateChangesPermissions: validateChangesPermissions,
    checkResourceTypeAndChildren: checkResourceTypeAndChildren,
    deleteResourceInCkan: deleteResourceInCkan,
    updateOrInsertExportedAtByDendroForCkanDataset: updateOrInsertExportedAtByDendroForCkanDataset,
    createCkanFileIdBasedOnDendroFileName: createCkanFileIdBasedOnDendroFileName,
    verifyIfCkanFileWasCreatedInDendro: verifyIfCkanFileWasCreatedInDendro,
    compareDendroPackageWithCkanPackage: compareDendroPackageWithCkanPackage,
    getExportedAtByDendroForCkanDataset: getExportedAtByDendroForCkanDataset,
    createPackageID: createPackageID,
    checkIfResourceHasTheRequiredMetadataForExport: checkIfResourceHasTheRequiredMetadataForExport,
    calculateDiffsBetweenDendroCkan: calculateDiffsBetweenDendroCkan,
    calculateCkanRepositoryDiffs: calculateCkanRepositoryDiffs,
    createOrUpdateFilesInPackage: createOrUpdateFilesInPackage,
    createPackageInCkan: createPackageInCkan,
    updatePackageInCkan: updatePackageInCkan,
    purgeCkanDataset: purgeCkanDataset
};