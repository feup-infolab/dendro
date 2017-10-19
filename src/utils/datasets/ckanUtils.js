const async = require("async");
const slug = require('slug');
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const CKAN = require("C:\\Users\\Utilizador\\Desktop\\InfoLab\\ckanModuleRepo\\ckan.js");
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;


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

    if(ckanFileIDParts.length !== 2 || ckanFileIDParts[1] !== ckanFile.name || ckanFileIDParts[0] !== slug(ckanFile.name))
        return false;
    else
    {
        return true;
    }
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
                                let namesOfResourcesInCkan = _.pluck(folderResourcesInCkan, 'name');
                                let dendroIsMissing = _.difference(namesOfResourcesInCkan, namesOfResourcesInDendro);
                                let ckanIsMissing = _.difference(namesOfResourcesInDendro, namesOfResourcesInCkan);

                                async.parallel([
                                        function (callback) {
                                            if (dendroIsMissing.length > 0) {
                                                async.map(dendroIsMissing, function (missingFile, callback) {
                                                    let ckanFile = _.find(folderResourcesInCkan, function (folderResourcesInCkan) {
                                                        return folderResourcesInCkan.name === missingFile;
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
                                                        //TODO Here are the files created in the ckan side-> shall we delete these files
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
                msg = "Error when calculating diffs between Dendro and Ckan: " + JSON.stringify(diffs);
                let errorInfo = {
                    error: {
                        message: msg,
                        statusCode: 500
                    }
                };
                console.error(JSON.stringify(errorInfo));
                callback(true, errorInfo);
            }
        }
    });
};


//------CKAN UTILS FOR EXPORT_TO_CKAN-----------

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
                let includeSoftDeletedChildren = false;
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

module.exports = {
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
    calculateCkanRepositoryDiffs: calculateCkanRepositoryDiffs
};