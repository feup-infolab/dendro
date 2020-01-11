// complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const rlequire = require("rlequire");
const path = require("path");
const fs = require("fs");
const nfs = require("node-fs");
const async = require("async");
const _ = require("underscore");

const slug = rlequire("dendro", "src/utils/slugifier.js");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const User = rlequire("dendro", "src/models/user.js").User;
const File = rlequire("dendro", "src/models/directory_structure/file.js").File;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Notification = rlequire("dendro", "src/models/notifications/notification.js").Notification;

const db = Config.getDBByID();

function Folder (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "folder", Folder);
    Folder.baseConstructor.call(this, object);

    self.ddr.fileExtension = "folder";
    self.ddr.hasFontAwesomeClass = "fa-folder";

    if (!isNull(object.nie) && !isNull(object.nie.title))
    {
        self.nie.title = object.nie.title;
    }
    return self;
}

Folder.prototype.saveIntoFolder = function (
    destinationFolderAbsPath,
    includeMetadata,
    includeTempFilesLocations,
    includeOriginalNodes,
    callback)
{
    const self = this;

    const saveIntoFolder = function
    (node,
        destinationFolderAbsPath,
        includeMetadata,
        includeTempFilesLocations,
        includeOriginalNodes,
        callback)
    {
        if (node instanceof File)
        {
            node.saveIntoFolder(
                destinationFolderAbsPath,
                includeMetadata,
                includeTempFilesLocations,
                includeOriginalNodes,
                function (err, absPathOfFinishedFile)
                {
                    if (isNull(err))
                    {
                        const descriptors = node.getDescriptors([Elements.access_types.locked], [Elements.access_types.backuppable]);
                        const fileNode = {
                            resource: node.uri,
                            metadata: descriptors
                        };

                        if (includeOriginalNodes)
                        {
                            fileNode.original_node = node;
                        }

                        if (includeTempFilesLocations)
                        {
                            fileNode.temp_location = absPathOfFinishedFile;
                        }

                        return callback(null, absPathOfFinishedFile, fileNode);
                    }

                    const error = "Error saving a file node (leaf) at " + node.uri + " " + absPathOfFinishedFile;
                    Logger.log(error);
                    return callback(1, error);
                });
        }
        else if (node instanceof Folder)
        {
            const destinationFolder = destinationFolderAbsPath + "/" + node.nie.title;

            // mode = 0777, recursive = true
            nfs.mkdir(destinationFolder, Config.tempFilesCreationMode, true, function (err)
            {
                if (isNull(err))
                {
                    node.getLogicalParts(function (err, children)
                    {
                        if (isNull(err) && !isNull(children) && children instanceof Array)
                        {
                            if (children.length > 0)
                            {
                                const saveChild = function (child, callback)
                                {
                                    saveIntoFolder(child, destinationFolder, includeMetadata, includeTempFilesLocations, includeOriginalNodes, function (err, message, childNode)
                                    {
                                        if (isNull(err))
                                        {
                                            if (includeMetadata)
                                            {
                                                return callback(null, childNode);
                                            }
                                            return callback(null, null);
                                        }
                                        const error = "Unable to save a child with uri : " + child.uri + ". Message returned : " + message;
                                        Logger.log("error", error);
                                        return callback(1, error);
                                    });
                                };

                                async.mapSeries(children, saveChild, function (err, childrenNodes)
                                {
                                    if (isNull(err))
                                    {
                                        const message = "Finished saving a complete folder at " + node.uri;
                                        Logger.log(message);

                                        if (includeMetadata)
                                        {
                                            const descriptors = node.getDescriptors([Elements.access_types.locked], [Elements.access_types.backuppable]);

                                            const folderNode = {
                                                resource: node.uri,
                                                metadata: descriptors
                                            };

                                            if (!isNull(childrenNodes))
                                            {
                                                folderNode.children = childrenNodes;
                                            }

                                            if (includeTempFilesLocations)
                                            {
                                                folderNode.temp_location = destinationFolder;
                                            }

                                            if (includeOriginalNodes)
                                            {
                                                folderNode.original_node = node;
                                            }

                                            return callback(null, destinationFolder, folderNode);
                                        }
                                        return callback(null, destinationFolder);
                                    }
                                    const error = "Error saving a file node (leaf) at " + node.uri + " " + childrenNodes;
                                    Logger.log(error);
                                    return callback(1, error);
                                });
                            }
                            else
                            {
                                var message = "Encountered empty folder at " + node.uri + ", when attempting to save the resource to " + destinationFolder;
                                Logger.log(message);

                                const selfMetadata = {
                                    resource: node.uri,
                                    metadata: node.getDescriptors([Elements.access_types.locked], [Elements.access_types.backuppable]),
                                    children: []
                                };

                                if (includeOriginalNodes)
                                {
                                    selfMetadata.original_node = node;
                                }

                                if (includeMetadata)
                                {
                                    return callback(null, destinationFolder, selfMetadata);
                                }
                                return callback(null, destinationFolder);
                            }
                        }
                        else
                        {
                            const error = "Error getting children of node at " + node.uri + " " + err + ", when attempting to save the resource to " + destinationFolder;
                            Logger.log("error", error);
                            return callback(1, error);
                        }
                    });
                }
                else
                {
                    const error = "Error creating subfolder for saving node at " + node.uri + " " + err + ", when attempting to save the resource to " + destinationFolder;
                    Logger.log("error", error);
                    return callback(1, error);
                }
            });
        }
        else
        {
            Logger.log("Null or invalid node " + node + ", when attempting to save the resource to " + destinationFolderAbsPath);
        }
    };

    saveIntoFolder(self, destinationFolderAbsPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, callback);
};

Folder.prototype.getChildrenRecursive = function (callback, includeSoftDeletedChildren)
{
    const self = this;
    let query;

    /**
     *   Note the PLUS sign (+) on the nie:isLogicalPartOf+ of the query below.
     *    (Recursive querying through inference).
     *   @type {string}
     */
    if (includeSoftDeletedChildren === true)
    {
        query =
            "SELECT ?uri, ?last_modified, ?name\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   [1] nie:hasLogicalPart+ ?uri. \n" +
            "   ?uri ddr:modified ?last_modified. \n" +
            "   OPTIONAL {?uri ddr:deleted true}. \n" +
            "   ?uri nie:title ?name. \n" +
            "} ";
    }
    else
    {
        query =
            "SELECT ?uri, ?last_modified, ?name\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   [1] nie:hasLogicalPart+ ?uri. \n" +
            "   ?uri ddr:modified ?last_modified. \n" +
            "   filter not exists { ?uri ddr:deleted 'true' }. \n" +
            "   ?uri nie:title ?name. \n" +
            "} ";
    }

    /* const query =
        "SELECT ?uri, ?last_modified, ?name\n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   [1] nie:hasLogicalPart+ ?uri. \n" +
        "   ?uri ddr:modified ?last_modified. \n" +
        "   ?uri nie:title ?name. \n" +
        "} "; */

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
                value: self.uri
            }
        ],
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array)
                {
                    callback(err, result);
                }
                else
                {
                    return callback(true, "Invalid response when getting recursive children of resource : " + self.uri);
                }
            }
            else
            {
                return callback(true, "Error reported when querying for the children of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

Folder.prototype.createTempFolderWithContents = function (
    includeMetadata,
    includeTempFilesLocations,
    includeOriginalNodes,
    callback)
{
    const self = this;
    const fs = require("fs");

    const tmp = require("tmp");
    tmp.dir({
        dir: Config.tempFilesDir
    },
    function _tempDirCreated (err, tempFolderPath)
    {
        if (isNull(err))
        {
            Logger.log("Producing temporary folder on " + tempFolderPath + " to download " + self.uri);

            const tempSubFolderWithCorrectTitle = tempFolderPath + "/" + self.nie.title;
            fs.mkdir(tempSubFolderWithCorrectTitle, function (err)
            {
                if (isNull(err))
                {
                    self.saveIntoFolder(
                        tempFolderPath,
                        includeMetadata,
                        includeTempFilesLocations,
                        includeOriginalNodes,
                        function (err, pathOfFinishedFolder, metadata)
                        {
                            return callback(null, tempFolderPath, pathOfFinishedFolder, metadata);
                        });
                }
                else
                {
                    return callback(1, "Unable to create temporary folder", "Unable to create temporary folder", "Unable to fetch metadata");
                }
            });
        }
    });
};

/**
 *
 * @param includeMetadata
 * @param callback
 * @param bagItOptions
 * {
    bagName: '/path/to/new/bag',
    originDirectory: '/path/to/dir/to/bag',
    cryptoMethod: 'sha256',
    sourceOrganization: 'Example Organization',
    organizationAddress: '123 Street',
    contactName: 'Contact Name',
    contactPhone: '555-555-5555',
    contactEmail: 'test@example.org',
    externalDescription: 'An example description'
}
 */

Folder.prototype.zipAndDownload = function (includeMetadata, callback, bagItOptions)
{
    const self = this;
    self.createTempFolderWithContents(includeMetadata, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
    {
        if (isNull(err))
        {
            Logger.log("Preparing to zip contents of folder : " + absolutePathOfFinishedFolder);

            async.series([
                function (cb)
                {
                    if (includeMetadata)
                    {
                        self.saveMetadata({absolutePathOfFinishedFolder, metadata}, function (err)
                        {
                            cb(err);
                        });
                    }
                    else
                    {
                        cb(null);
                    }
                },
                function (cb)
                {
                    if (!isNull(bagItOptions) && bagItOptions instanceof Object)
                    {
                        self.bagit(absolutePathOfFinishedFolder, parentFolderPath, bagItOptions, function (err, absolutePathOfBaggedFolder)
                        {
                            if (isNull(err))
                            {
                                Logger.log("BaggIted folder! at : " + absolutePathOfBaggedFolder);
                                cb(0, absolutePathOfBaggedFolder);
                            }
                            else
                            {
                                cb(1, "Error BaggItting folder : " + absolutePathOfFinishedFolder);
                            }
                        });
                    }
                    else
                    {
                        Folder.zip(absolutePathOfFinishedFolder, parentFolderPath, function (err, absolutePathOfZippedFile)
                        {
                            if (isNull(err))
                            {
                                Logger.log("Zipped folder! at : " + absolutePathOfZippedFile);
                                cb(0, absolutePathOfZippedFile);
                            }
                            else
                            {
                                cb(1, "Error zipping folder : " + absolutePathOfFinishedFolder);
                            }
                        });
                    }
                }
            ],
            function (err, results)
            {
                if (isNull(err))
                {
                    return callback(err, results[1]);
                }

                return callback(err, callback(err, results));
            });
        }
        else
        {
            return callback(1, "Error producing folder structure for zipping" + absolutePathOfFinishedFolder);
        }
    });
};

Folder.prototype.copyPaste = function ({includeMetadata, user, destinationFolder}, callback)
{
    const self = this;
    self.createTempFolderWithContents(includeMetadata, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
    {
        if (isNull(err))
        {
            async.series([
                function (cb)
                {
                    if (includeMetadata)
                    {
                        self.saveMetadata({absolutePathOfFinishedFolder, metadata}, function (err)
                        {
                            cb(err);
                        });
                    }
                    else
                    {
                        cb(null);
                    }
                }], function (err)
            {
                if (isNull(err))
                {
                    Logger.log("Preparing to copy paste contents of folder : " + absolutePathOfFinishedFolder);
                    destinationFolder.restoreFromFolder(absolutePathOfFinishedFolder, user, true, false, function (err, result)
                    {
                        if (isNull(err))
                        {
                            Folder.deleteOnLocalFileSystem(absolutePathOfFinishedFolder, function (err, result)
                            {
                                callback(null, "copied folder successfully.");
                            });
                        }
                        else
                        {
                            return callback(err, "Unable to copy folder " + self.uri + " to another folder.");
                        }
                    }, true);
                }
            });
        }
        else
        {
            callback(err, "error");
        }
    });
};

Folder.prototype.copyPaste2 = function ({includeMetadata, user, destinationFolder}, callback)
{
    const self = this;
    self.createTempFolderWithContents(includeMetadata, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
    {
        if (isNull(err))
        {
            async.series([
                function (cb)
                {
                    if (includeMetadata)
                    {
                        self.saveMetadata({absolutePathOfFinishedFolder, metadata}, function (err)
                        {
                            cb(err);
                        });
                    }
                    else
                    {
                        cb(null);
                    }
                }], function (err)
            {
                if (isNull(err))
                {
                    Logger.log("Preparing to copy paste contents of folder : " + absolutePathOfFinishedFolder);
                    destinationFolder.loadContentsOfFolderIntoThis(absolutePathOfFinishedFolder, true, function (err, result)
                    {
                        if (isNull(err))
                        {
                            Folder.deleteOnLocalFileSystem(absolutePathOfFinishedFolder, function (err, result)
                            {
                                callback(null, "copied folder successfully.");
                            });
                        }
                        else
                        {
                            return callback(err, "Unable to copy folder " + self.uri + " to another folder.");
                        }
                    }, false, user);
                }
            });
        }
        else
        {
            callback(err, "error");
        }
    });
};

// bag folder according to the Bagit 0.97 Spec
Folder.prototype.bagit = function (bagItOptions, callback)
{
    const self = this;

    async.waterfall(
        [
            function (cb)
            {
                if (typeof bagItOptions.bagName === "undefined" || bagItOptions.bagName === "undefined")
                {
                    if (isNull(self.nie.title))
                    {
                        self.nie.title = "bagit_backup";
                    }

                    self.createTempFolderWithContents(true, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Produced temporary folder on " + absolutePathOfFinishedFolder + " to bagit " + self.uri);
                            const path = require("path");

                            const fs = require("fs");
                            const outputFilename = path.join(absolutePathOfFinishedFolder, Config.packageMetadataFileName);

                            Logger.log("FINAL METADATA : " + JSON.stringify(metadata));

                            fs.writeFile(outputFilename, JSON.stringify(metadata, null, 4), "utf-8", function (err)
                            {
                                if (err)
                                {
                                    Logger.log(err);
                                    cb(err);
                                }
                                else
                                {
                                    const msg = "JSON saved to " + outputFilename;
                                    Logger.log(msg);

                                    bagItOptions.bagName = path.join(parentFolderPath, "bagit_temp");
                                    bagItOptions.originDirectory = absolutePathOfFinishedFolder;
                                    cb(null, bagItOptions.bagName, parentFolderPath);
                                }
                            });
                        }
                        else
                        {
                            cb(err, parentFolderPath);
                        }
                    });
                }
                else
                {
                    cb(1, bagItOptions);
                }
            },
            function (absolutePathOfFinishedFolder, parentFolderPath, cb)
            {
                const gladstone = rlequire("dendro", "node_modules/gladstone/gladstone.js");
                gladstone.createBagDirectory(bagItOptions)
                    .then(function (result)
                    {
                        cb(null, {
                            result: result,
                            absolutePathOfFinishedFolder: absolutePathOfFinishedFolder,
                            parentFolderPath: parentFolderPath
                        });
                    })
                    .catch(function (err)
                    {
                        cb(err, "Unable to create the bagit package " + err);
                    });
            }
        ],
        function (err, results)
        {
            return callback(err, results.result, results.absolutePathOfFinishedFolder, results.parentFolderPath);
        });
};

Folder.zip = function (sourceFolderAbsPath, destinationFolderForZipAbsPath, callback, nameForFinishedZipFile, zipContentsInsteadOfFolder)
{
    const path = require("path");
    if (!sourceFolderAbsPath.startsWith(path.sep))
    {
        return callback(1, "Invalid source folder absolute path specified. It does not start with " + path.sep);
    }
    else if (!destinationFolderForZipAbsPath.startsWith(path.sep))
    {
        return callback(1, "Invalid destination folder absolute path specified. It does not start with " + path.sep);
    }
    const exec = require("child_process").exec;

    if (isNull(nameForFinishedZipFile))
    {
        nameForFinishedZipFile = path.basename(sourceFolderAbsPath);
        nameForFinishedZipFile = slug(nameForFinishedZipFile) + ".zip";
    }

    const parentFolderAbsPath = path.resolve(sourceFolderAbsPath, "..");
    const nameOfFolderToZip = path.basename(sourceFolderAbsPath);

    let cwd;
    let command;

    if (zipContentsInsteadOfFolder)
    {
        cwd = {cwd: sourceFolderAbsPath};
        command = "zip -r \"" + nameForFinishedZipFile + "\" \* &&\n mv " + nameForFinishedZipFile + " ..";
    }
    else
    {
        cwd = {cwd: parentFolderAbsPath};
        command = "zip -r \"" + nameForFinishedZipFile + "\" .\/\"" + nameOfFolderToZip + "\"";
    }

    Logger.log("Zipping file with command " + command + " on folder " + parentFolderAbsPath + "....");

    const zip = exec(command, cwd, function (error, stdout, stderr)
    {
        if (error)
        {
            const errorMessage = "Error zipping file with command " + command + " on folder " + parentFolderAbsPath + ". Code Returned by Zip Command " + JSON.stringify(error);
            Logger.log("error", errorMessage);
            return callback(1, errorMessage);
        }
        Logger.log(stdout);

        let finishedZipFileAbsPath;

        if (zipContentsInsteadOfFolder)
        {
            finishedZipFileAbsPath = destinationFolderForZipAbsPath;
        }
        else
        {
            finishedZipFileAbsPath = path.join(destinationFolderForZipAbsPath, nameForFinishedZipFile);
        }

        Logger.log("Folder is in zip file " + finishedZipFileAbsPath);
        return callback(null, finishedZipFileAbsPath);
    });
};

Folder.prototype.findChildWithDescriptor = function (descriptor, callback)
{
    const self = this;
    const thisFolderAsParentDescriptor = new Descriptor({
        prefixedForm: "nie:isLogicalPartOf",
        value: self.uri
    });

    let queryDescriptors;

    if (descriptor instanceof Descriptor)
    {
        queryDescriptors = [thisFolderAsParentDescriptor, descriptor];
    }
    else if (descriptor instanceof Array)
    {
        queryDescriptors = descriptor.concat([thisFolderAsParentDescriptor]);
    }
    else
    {
        return callback(1, "Invalid descriptor array when querying for children of folder with a certain descriptor value.");
    }

    Folder.findByPropertyValue(queryDescriptors, function (err, child)
    {
        if (!err)
        {
            if (isNull(child))
            {
                File.findByPropertyValue(queryDescriptors, function (err, child)
                {
                    if (!err)
                    {
                        callback(err, child);
                    }
                    else
                    {
                        callback(500, "Error occurred while getting File child of " + self.uri + " with property/properties " + JSON.stringify(queryDescriptors));
                    }
                }, null, null, null, null, null, true);
            }
            else
            {
                callback(err, child);
            }
        }
        else
        {
            callback(500, "Error occurred while getting Folder child of " + self.uri + " with property/properties " + JSON.stringify(queryDescriptors));
        }
    }, null, null, null, null, null, true);
};

Folder.prototype.restoreFromLocalBackupZipFile = function (zipFileAbsLocation, userRestoringTheFolder, callback, progressReporter)
{
    const self = this;

    Notification.sendProgress(
        `Server now unzipping file ${path.basename(zipFileAbsLocation)}.`,
        progressReporter,
        self
    );

    File.unzip(zipFileAbsLocation, function (err, unzippedContentsLocation)
    {
        fs.exists(unzippedContentsLocation, function (exists)
        {
            if (exists)
            {
                fs.readdir(unzippedContentsLocation, function (err, files)
                {
                    files = InformationElement.removeInvalidFileNames(files);

                    if (isNull(err) && files instanceof Array && files.length === 1)
                    {
                        const location = path.join(unzippedContentsLocation, files[0]);
                        self.restoreFromFolder(location, userRestoringTheFolder, true, true, function (err, result)
                        {
                            if (isNull(err))
                            {
                                self.undelete(callback, userRestoringTheFolder.uri, true, progressReporter);
                                // return callback(null, result);
                            }
                            else
                            {
                                return callback(err, "Unable to restore folder " + self.uri + " from local folder " + unzippedContentsLocation);
                            }
                        }, true, progressReporter);
                    }
                    else
                    {
                        const util = require("util");
                        Logger.log("Error: There should only be one folder at the root of the contents. Is this a valid backup? " + util.inspect(files));
                        return callback(1, "There should only be one folder at the root of the contents. Is this a valid backup?");
                    }
                });
            }
            else
            {
                Logger.log("Error: " + unzippedContentsLocation);
                return callback(1, "Error unzipping backup zip file : " + unzippedContentsLocation);
            }
        });
    });
};

Folder.prototype.loadContentsOfFolderIntoThis = function (absolutePathOfLocalFolder, replaceExistingFolder, callback, runningOnRoot, userPerformingTheOperation, progressReporter)
{
    const self = this;
    const path = require("path");

    const deleteFolder = function (cb)
    {
        if (runningOnRoot)
        {
            self.delete(function (err, result)
            {
                cb(err, result);
            }, userPerformingTheOperation.uri, null, replaceExistingFolder, progressReporter);
        }
        else
        {
            cb(null, self);
        }
    };

    const addChildrenTriples = function (childrenResources, cb)
    {
        self.nie.hasLogicalPart = _.map(childrenResources, function (child)
        {
            return child.uri;
        });

        self.save(function (err, result)
        {
            cb(err, result);
        });
    };

    const loadChildFolder = function (folderName, cb)
    {
        const createChildFolderTriples = function (folderName, cb)
        {
            self.findChildWithDescriptor(new Descriptor({
                prefixedForm: "nie:title",
                value: folderName
            }), function (err, childFolder)
            {
                if (isNull(err))
                {
                    if (isNull(childFolder))
                    {
                        const childFolder = new Folder({
                            nie: {
                                isLogicalPartOf: self.uri,
                                title: folderName
                            }
                        });

                        childFolder.save(function (err, newFolder)
                        {
                            cb(err, newFolder);
                        });
                    }
                    else
                    {
                        const childFolderObject = new Folder(childFolder);
                        childFolderObject.save(function (err, result)
                        {
                            cb(err, childFolderObject);
                        });
                    }
                }
                else
                {
                    cb(err, childFolder);
                }
            });
        };

        createChildFolderTriples(folderName, function (err, childFolder)
        {
            if (isNull(err))
            {
                const childPathAbsFolder = path.join(absolutePathOfLocalFolder, folderName);
                childFolder.loadContentsOfFolderIntoThis(childPathAbsFolder, replaceExistingFolder, function (err, loadedFolder)
                {
                    childFolder.undelete(function (err, result)
                    {
                        cb(err, result);
                    }, userPerformingTheOperation.uri, true);
                }, false, userPerformingTheOperation, progressReporter);
            }
            else
            {
                cb(1, "Unable to create subfolder of " + self.uri + " with title " + folderName);
            }
        });
    };

    const loadChildFile = function (fileName, cb)
    {
        const createNewFileTriples = function (fileName, cb)
        {
            self.findChildWithDescriptor(new Descriptor({
                prefixedForm: "nie:title",
                value: fileName
            }), function (err, childFile)
            {
                if (isNull(err))
                {
                    if (isNull(childFile))
                    {
                        const childFile = new File({
                            nie: {
                                isLogicalPartOf: self.uri,
                                title: fileName
                            }
                        });

                        childFile.save(function (err, result)
                        {
                            cb(null, childFile);
                        }, false, progressReporter);
                    }
                    else
                    {
                        const childFileObject = new File(childFile);
                        if (childFileObject.nie.isLogicalPartOf instanceof Array)
                        {
                            childFileObject.nie.isLogicalPartOf.push(self.uri);
                        }
                        else
                        {
                            childFileObject.nie.isLogicalPartOf = self.uri;
                        }

                        childFileObject.nie.title = fileName;

                        childFileObject.save(function (err, result)
                        {
                            cb(null, childFileObject);
                        }, false, progressReporter);
                    }
                }
                else
                {
                    cb(null, childFile);
                }
            });
        };

        createNewFileTriples(fileName, function (err, childFile)
        {
            if (isNull(err))
            {
                const localFilePath = path.join(absolutePathOfLocalFolder, fileName);
                childFile.loadFromLocalFile(localFilePath, function (err, childFile)
                {
                    if (isNull(err))
                    {
                        if (!isNull(childFile) && childFile instanceof File)
                        {
                            childFile.undelete(function (err, res)
                            {
                                return cb(err, res);
                            }, userPerformingTheOperation.uri, false);
                        }
                        else
                        {
                            console.err("File was loaded but was not returned " + childFile);
                            return cb(1, "File was loaded but was not returned " + childFile);
                        }
                    }
                    else
                    {
                        const msg = "Error loading file " + self.uri + " from local file " + localFilePath + " Error reported: " + childFile;
                        Logger.log("error", msg);
                        return cb(1, msg);
                    }
                });
            }
            else
            {
                return cb(err, childFile);
            }
        });
    };

    Notification.sendProgress(
        `Starting restore of folder ${self.nie.title}.`,
        progressReporter,
        self
    );

    deleteFolder(function (err, result)
    {
        fs.readdir(absolutePathOfLocalFolder, function (err, files)
        {
            files = InformationElement.removeInvalidFileNames(files);

            if (runningOnRoot)
            {
                files = _.without(files, Config.packageMetadataFileName);
                if (replaceExistingFolder)
                {
                    self.nie.title = path.basename(absolutePathOfLocalFolder);
                }
            }

            if (files.length > 0)
            {
                // Logger.log("error","Starting to load children of folder " + absolutePathOfLocalFolder + " into a folder with title " + self.nie.title + " ("+ self.uri +")");

                async.mapSeries(files, function (fileName, cb)
                {
                    const absPath = path.join(absolutePathOfLocalFolder, fileName);
                    fs.stat(absPath, function (err, stats)
                    {
                        if (isNull(err))
                        {
                            if (stats.isFile())
                            {
                                loadChildFile(fileName, function (err, savedChildFile)
                                {
                                    // Logger.log("Saved FILE: " + savedChildFile.uri + ". result : " + err);

                                    Notification.sendProgress(
                                        `Restored file ${fileName}.`,
                                        progressReporter,
                                        self
                                    );

                                    return cb(err, savedChildFile);
                                });
                            }
                            else if (stats.isDirectory())
                            {
                                loadChildFolder(fileName, function (err, savedChildFolder)
                                {
                                    // Logger.log("Saved FOLDER: " + savedChildFolder.uri + " with title " +savedChildFolder.nie.title+ " . Error" + err);

                                    Notification.sendProgress(
                                        `Restored folder ${fileName}.`,
                                        progressReporter,
                                        self
                                    );

                                    return cb(err, savedChildFolder);
                                });
                            }
                        }
                        else
                        {
                            const msg = "Unable to determine the contents of folder " + self.uri + " when loading a the contents of a folder into it: " + JSON.stringify(err);
                            Logger.log("error", msg);
                            return cb(err, stats);
                        }
                    });
                }, function (err, results)
                {
                    if (isNull(err))
                    {
                        Notification.sendProgress(
                            `Adding children of ${path.basename(absolutePathOfLocalFolder)} to ${self.nie.title}...`,
                            progressReporter,
                            self
                        );

                        addChildrenTriples(results, function (err, result)
                        {
                            Notification.sendProgress(
                                `All children of ${path.basename(absolutePathOfLocalFolder)} loaded into ${self.nie.title}.`,
                                progressReporter,
                                self
                            );

                            return callback(null, self);
                        });
                    }
                    else
                    {
                        const msg = "Unable to load children of " + self.uri + ": " + JSON.stringify(results);
                        Logger.log("error", msg);
                        return callback(500, msg);
                    }
                });
            }
            else
            {
                return callback(null, "There are no files to load. The data folder in the backup is empty.");
            }
        });
    });
};

Folder.prototype.loadMetadata = function (
    node,
    callback,
    entityLoadingTheMetadata,
    excludedDescriptorTypes,
    exceptionedDescriptorTypes,
    restoreIntoTheSameRootFolder,
    progressReporter
)
{
    const self = this;
    // Logger.log("Restoring metadata of " + node.resource + " into "+ self.uri);

    const getDescriptor = function (prefixedForm, node)
    {
        const wantedDescriptor = _.find(node.metadata, function (descriptor)
        {
            return descriptor.prefixedForm === prefixedForm;
        });

        return new Descriptor(wantedDescriptor);
    };

    const loadMetadataIntoThisFolder = function (node, callback)
    {
        const metadata = node.metadata;

        const folderCallback = function (folder, err, result, callback)
        {
            if (isNull(err))
            {
                Notification.sendProgress(
                    "Metadata values of folder " + folder.uri + " successfully restored. ",
                    progressReporter,
                    self
                );

                return callback(null, "Folder " + folder.uri + " successfully restored. ");
            }
            return callback(err, "Error restoring folder " + folder.uri + " : " + result);
        };

        const fileCallback = function (file, err, result, callback)
        {
            if (isNull(err))
            {
                Notification.sendProgress(
                    "Metadata values of file " + file.uri + " successfully restored. ",
                    progressReporter,
                    self
                );

                return callback(null, "File " + file.uri + " successfully restored .");
            }
            return callback(err, "Error restoring file " + file.uri + " : " + result);
        };

        const loadMetadataForChildFolder = function (childNode, callback)
        {
            // Child is a folder
            if (!isNull(childNode.children) && childNode.children instanceof Array)
            {
                // we are restoring a folder into the same original folder
                // so we can look for the child by uri
                if (!isNull(restoreIntoTheSameRootFolder) && restoreIntoTheSameRootFolder === true)
                {
                    Folder.findByUri(childNode.resource, function (err, folder)
                    {
                        if (isNull(err) && !isNull(folder))
                        {
                            // Sets the parent as the new folder and not the parent specified in the metadata.json file
                            folder.nie.isLogicalPartOf = self.uri;
                            folder.loadMetadata(
                                childNode,
                                function (err, result)
                                {
                                    folderCallback(folder, err, result, callback);
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes, restoreIntoTheSameRootFolder
                            );
                        }
                        else
                        {
                            const titleDescriptor = getDescriptor("nie:title", childNode);
                            self.findChildWithDescriptor(titleDescriptor, function (err, folder)
                            {
                                if (isNull(err) && !isNull(folder))
                                {
                                    // Sets the parent as the new folder and not the parent specified in the metadata.json file
                                    folder.nie.isLogicalPartOf = self.uri;
                                    folder.loadMetadata(
                                        childNode,
                                        function (err, result)
                                        {
                                            folderCallback(folder, err, result, callback);
                                        },
                                        entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes, restoreIntoTheSameRootFolder
                                    );
                                }
                                else
                                {
                                    const msg = "Unable to find a folder with title " + titleDescriptor.value;
                                    Logger.log("error", msg);
                                    callback(404, msg);
                                }
                            });
                        }
                    });
                }
                else
                {
                    // we are restoring a folder into a folder other than the original folder
                    // so we cannot look for the child by the uri specified in the metadata.json file
                    // as it could ruin the original folder if it still exists in Dendro
                    // so we need to find the child in the current folder but find it by the title descriptor
                    // as at this point this parent folder already has the metadata restored in Dendro
                    const titleDescriptor = getDescriptor("nie:title", childNode);
                    self.findChildWithDescriptor(titleDescriptor, function (err, folder)
                    {
                        if (isNull(err) && !isNull(folder))
                        {
                            // Sets the parent as the new folder and not the parent specified in the metadata.json file
                            folder.nie.isLogicalPartOf = self.uri;
                            folder.loadMetadata(
                                childNode,
                                function (err, result)
                                {
                                    folderCallback(folder, err, result, callback);
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes, restoreIntoTheSameRootFolder
                            );
                        }
                        else
                        {
                            const msg = "Unable to find a folder with title " + titleDescriptor.value;
                            Logger.log("error", msg);
                            callback(404, msg);
                        }
                    });
                }
            }
            else
            {
                // Child is a file
                if (!isNull(restoreIntoTheSameRootFolder) && restoreIntoTheSameRootFolder == true)
                {
                    // we are restoring a file into the same original folder
                    // so we can look for the child by uri
                    File.findByUri(childNode.resource, function (err, file)
                    {
                        if (isNull(err) && !isNull(file))
                        {
                            // Sets the parent as the new folder and not the parent specified in the metadata.json file
                            file.nie.isLogicalPartOf = self.uri;
                            file.loadMetadata(
                                childNode,
                                function (err, result)
                                {
                                    fileCallback(file, err, result, callback);
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                            );
                        }
                        else
                        {
                            const titleDescriptor = getDescriptor("nie:title", childNode);

                            self.findChildWithDescriptor(titleDescriptor, function (err, file)
                            {
                                if (isNull(err))
                                {
                                    if (!isNull(file))
                                    {
                                        file.loadMetadata(
                                            childNode,
                                            function (err, result)
                                            {
                                                fileCallback(file, err, result, callback);
                                            },
                                            entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                        );
                                    }
                                    else
                                    {
                                        const msg = "Unable to find a folder with title " + titleDescriptor.value;
                                        Logger.log("error", msg);
                                        callback(404, msg);
                                    }
                                }
                                else
                                {
                                    const msg = "Error finding a folder with title " + titleDescriptor.value + JSON.stringify(file);
                                    Logger.log("error", msg);
                                    callback(500, msg);
                                }
                            });
                        }
                    });
                }
                else
                {
                    // we are restoring a file into a folder other than the original folder
                    // so we cannot look for the child by the uri specified in the metadata.json file
                    // as it could ruin the original file if it still exists in Dendro
                    // so we need to find the child in the current folder but find it by the title descriptor
                    // as at this point this parent folder already has the metadata restored in Dendro
                    const titleDescriptor = getDescriptor("nie:title", childNode);

                    self.findChildWithDescriptor(titleDescriptor, function (err, file)
                    {
                        if (isNull(err))
                        {
                            if (!isNull(file))
                            {
                                file.loadMetadata(
                                    childNode,
                                    function (err, result)
                                    {
                                        fileCallback(file, err, result, callback);
                                    },
                                    entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                );
                            }
                            else
                            {
                                const msg = "Unable to find a folder with title " + titleDescriptor.value;
                                Logger.log("error", msg);
                                callback(404, msg);
                            }
                        }
                        else
                        {
                            const msg = "Error finding a folder with title " + titleDescriptor.value + JSON.stringify(file);
                            Logger.log("error", msg);
                            callback(500, msg);
                        }
                    });
                }
            }
        };

        const descriptors = [];
        if (!isNull(metadata) && metadata instanceof Array)
        {
            for (let i = 0; i < metadata.length; i++)
            {
                descriptors.push(
                    new Descriptor(
                        metadata[i]
                    )
                );
            }
        }

        Descriptor.mergeDescriptors(descriptors, function (err, descriptorsInBackup)
        {
            if (!isNull(node.children) && node.children instanceof Array)
            {
                async.mapSeries(
                    node.children,
                    loadMetadataForChildFolder,
                    function (err, results)
                    {
                        if (isNull(err))
                        {
                            self.replaceDescriptors(descriptorsInBackup, excludedDescriptorTypes, exceptionedDescriptorTypes);
                            self.save(function (err, result)
                            {
                                if (isNull(err))
                                {
                                    return callback(null, result);
                                }
                                return callback(err, result);
                            }, true, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
                        }
                        else
                        {
                            return callback(err, results);
                        }
                    }
                );
            }
            else
            {
                File.findByUri(node.resource, function (err, currentFile)
                {
                    if (isNull(err))
                    {
                        if (!isNull(currentFile))
                        {
                            currentFile.loadMetadata(
                                node,
                                function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(null, "File " + currentFile.uri + " successfully restored. ");
                                    }

                                    return callback(err, "Error restoring file " + currentFile.uri + " : " + result);
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                            );
                        }
                        else
                        {
                            self.loadMetadata(
                                node,
                                function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(null, "File " + self.uri + " successfully restored. ");
                                    }

                                    return callback(err, "Error restoring file " + self.uri + " : " + result);
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                            );
                        }
                    }
                    else
                    {
                        return callback(err, currentFile);
                    }
                });
            }
        });
    };

    if (!isNull(node))
    {
        Folder.findByUri(node.resource, function (err, existingFolder)
        {
            if (isNull(err))
            {
                if (!isNull(existingFolder))
                {
                    if (node.resource === existingFolder.uri)
                    {
                        loadMetadataIntoThisFolder(node, function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        return callback(1, "Unable to match backup folder to the folder in Dendro. Is the uploaded metadata .json file a backup of this folder?");
                    }
                }
                else
                {
                    // Sets the resource as the new folder and not the one specified in the metadata.json file
                    node.resource = self.uri;
                    loadMetadataIntoThisFolder(node, function (err, result)
                    {
                        callback(err, result);
                    });
                }
            }
            else
            {
                return callback(1, "Unable to match backup folder to the folder in Dendro. Is the uploaded metadata .json file a backup of this folder?");
            }
        });
    }
    else
    {
        return callback(1, "Cannot restore from a null metadata node");
    }
};

Folder.prototype.restoreFromFolder = function (absPathOfRootFolder,
    entityLoadingTheMetadata,
    attemptToRestoreMetadata,
    replaceExistingFolder,
    callback,
    runningOnRoot,
    progressReporter
)
{
    const self = this;
    let entityLoadingTheMetadataUri;

    if (!isNull(entityLoadingTheMetadata) && entityLoadingTheMetadata instanceof User)
    {
        entityLoadingTheMetadataUri = entityLoadingTheMetadata.uri;
    }
    else
    {
        entityLoadingTheMetadataUri = User.anonymous.uri;
    }

    self.loadContentsOfFolderIntoThis(absPathOfRootFolder, replaceExistingFolder, function (err, result)
    {
        if (isNull(err))
        {
            if (runningOnRoot)
            {
                /**
                 * Restore metadata values from medatada.json file
                 */
                const metadataFileLocation = path.join(absPathOfRootFolder, Config.packageMetadataFileName);

                fs.exists(metadataFileLocation, function (existsMetadataFile)
                {
                    if (attemptToRestoreMetadata && existsMetadataFile)
                    {
                        fs.readFile(metadataFileLocation, "utf8", function (err, data)
                        {
                            if (err)
                            {
                                Logger.log("Error: " + err);
                                return;
                            }

                            const node = JSON.parse(data);
                            let restoreIntoTheSameRootFolder = false;
                            if (node.resource === self.uri)
                            {
                                Logger.log("info", "This is a restore to the same root folder");
                                restoreIntoTheSameRootFolder = true;
                            }
                            else
                            {
                                Logger.log("info", "This is a restore to another root folder");
                                restoreIntoTheSameRootFolder = false;
                            }
                            self.nie.title = path.basename(absPathOfRootFolder);
                            self.loadMetadata(node, function (err, result)
                            {
                                if (isNull(err))
                                {
                                    return callback(null, "Data and metadata restored successfully. Result : " + result);
                                }
                                return callback(1, "Error restoring metadata for node " + self.uri + " : " + result);
                            }, entityLoadingTheMetadataUri, [Elements.access_types.locked], [Elements.access_types.restorable], restoreIntoTheSameRootFolder, progressReporter);
                        });
                    }
                    else
                    {
                        return callback(null, "Since no metadata.json file was found at the root of the zip file, no metadata was restored. Result : " + result);
                    }
                });
            }
            else
            {
                return callback(null, result);
            }
        }
        else
        {
            return callback(err, result);
        }
    }, runningOnRoot, entityLoadingTheMetadata, progressReporter);
};

Folder.prototype.setDescriptorsRecursively = function (descriptors, callback, uriOfUserDeletingTheFolder, progressReporter)
{
    const self = this;
    const setDescriptors = function (node, cb)
    {
        if (node instanceof File)
        {
            node.updateDescriptors(descriptors);
            node.save(function (err, result)
            {
                Notification.sendProgress(
                    `Marked file ${self.nie.title} successfully as deleted.`,
                    progressReporter,
                    self
                );
                cb(err, result);
            });
        }
        else if (node instanceof Folder)
        {
            node.updateDescriptors(descriptors);
            node.save(function (err, result)
            {
                if (isNull(err))
                {
                    node.getLogicalParts(function (err, children)
                    {
                        if (isNull(err) && !isNull(children) && children instanceof Array)
                        {
                            if (children.length > 0)
                            {
                                async.mapSeries(children, setDescriptors, function (err, results)
                                {
                                    if (isNull(err))
                                    {
                                        Notification.sendProgress(
                                            `Marked folder ${node.nie.title} as deleted successfully.`,
                                            progressReporter,
                                            self
                                        );

                                        cb(null);
                                    }
                                    else
                                    {
                                        const error = "Error saving a file node (leaf) at " + node.uri + " " + results;
                                        Logger.log(error);
                                        cb(1, error);
                                    }
                                });
                            }
                            else
                            {
                                // var message = "Encountered empty folder at " + node.uri + ".";
                                // Logger.log(message);
                                cb(null);
                            }
                        }
                        else
                        {
                            const error = "Error getting children of node at " + node.uri + " " + err + ", when attempting to save descriptors : " + JSON.stringify(descriptors);
                            Logger.log("error", error);
                            cb(1, error);
                        }
                    });
                }
                else
                {
                    cb(1, "Unable to save descriptors " + JSON.stringify(descriptors) + " for folder " + node.uri);
                }
            }, true,
            uriOfUserDeletingTheFolder);
        }
        else
        {
            Logger.log("Null or invalid node " + JSON.stringify(node) +
                ", when attempting to save the descriptors " + JSON.stringify(descriptors));
        }
    };

    setDescriptors(self, callback);
};

Folder.prototype.delete = function (callback, uriOfUserDeletingTheFolder, notRecursive, reallyDelete, progressReporter)
{
    const self = this;

    if (notRecursive)
    {
        if (self.ddr.deleted && reallyDelete)
        {
            self.deleteAllMyTriples(function (err, result)
            {
                if (isNull(err))
                {
                    self.unlinkFromParent(function (err, result)
                    {
                        if (isNull(err))
                        {
                            return callback(err, self);
                        }
                        return callback(err, "Error unlinking folder " + self.uri + " from its parent. Error reported : " + result);
                    });
                }
                else
                {
                    return callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                }
            });
        }
        else
        {
            self.ddr.deleted = true;
            self.save(function (err, result)
            {
                if (isNull(err))
                {
                    self.reindex(function (err, result)
                    {
                        return callback(err, self);
                    });
                }
                else
                {
                    return callback(err, self);
                }
            }, true, uriOfUserDeletingTheFolder);
        }
    }
    else // recursive delete
    {
        if (self.ddr.deleted)
        {
            self.getLogicalParts(function (err, children)
            {
                const deleteChild = function (child, cb)
                {
                    // This is necessary because depending on the type the .delete function has different parameters. This was previously creating a bug that prevented child resources to be "really_deleted" when its parent was.
                    if (child instanceof Folder)
                    {
                        child.delete(cb, uriOfUserDeletingTheFolder, notRecursive, reallyDelete, progressReporter);
                    }
                    else if (child instanceof File)
                    {
                        if (isNull(reallyDelete))
                        {
                            child.delete(cb, uriOfUserDeletingTheFolder, false, progressReporter);
                        }
                        else
                        {
                            child.delete(cb, uriOfUserDeletingTheFolder, reallyDelete, progressReporter);
                        }
                    }
                };

                async.mapSeries(children, deleteChild, function (err, result)
                {
                    if (isNull(err))
                    {
                        self.deleteAllMyTriples(function (err, result)
                        {
                            if (isNull(err))
                            {
                                Notification.sendProgress(
                                    `Deleted ${self.nie.title} successfully.`,
                                    progressReporter,
                                    self
                                );

                                self.unindex(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        Notification.sendProgress(
                                            `Removed ${self.nie.title} successfully from search index.`,
                                            progressReporter,
                                            self
                                        );

                                        self.unlinkFromParent(function (err, result)
                                        {
                                            if (isNull(err))
                                            {
                                                return callback(null, self);
                                            }
                                            return callback(err, "Error unlinking folder " + self.uri + " from its parent. Error reported : " + result);
                                        });
                                    }
                                    else
                                    {
                                        return callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                                    }
                                });
                            }
                            else
                            {
                                return callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                            }
                        });
                    }
                    else
                    {
                        return callback(err, "Error deleting children of folder " + self.uri + " during recursive delete. Error reported : " + result);
                    }
                });
            });
        }
        else
        {
            self.setDescriptorsRecursively(
                [
                    new Descriptor(
                        {
                            prefixedForm: "ddr:deleted",
                            value: true
                        }
                    )
                ],
                function (err, result)
                {
                    // Logger.log("Finished deleting " + self.uri + " with return " + err);
                    return callback(err, self);
                },

                uriOfUserDeletingTheFolder, progressReporter
            );
        }
    }
};

Folder.prototype.undelete = function (callback, uriOfUserUnDeletingTheFolder, notRecursive, progressReporter)
{
    const self = this;

    if (notRecursive)
    {
        if (self.ddr.deleted === true)
        {
            delete self.ddr.deleted;
            self.save(function (err, result)
            {
                return callback(err, result);
            }, true, uriOfUserUnDeletingTheFolder);
        }
        else
        {
            return callback(null, self);
        }
    }
    else
    {
        self.setDescriptorsRecursively(
            [
                new Descriptor(
                    {
                        prefixedForm: "ddr:deleted",
                        value: null
                    }
                )
            ],
            function (err, result)
            {
                Notification.sendProgress(
                    `New folder ${self.nie.title} successfully restored.`,
                    progressReporter,
                    self
                );
                return callback(err, result);
            },
            uriOfUserUnDeletingTheFolder
        );
    }
};

Folder.prototype.autorename = function ()
{
    const self = this;
    const slug = rlequire("dendro", "src/utils/slugifier.js");
    const now = new Date();
    self.nie.title = self.nie.title + "_Copy_created_" + slug(now.toISOString());
    return self.nie.title;
};

Folder.prototype.save = function (callback)
{
    const self = this;
    self.needsRenaming(function (err, needsRenaming)
    {
        if (isNull(err))
        {
            if (needsRenaming === true)
            {
                self.autorename();
            }
            InformationElement.prototype.save.call(self, function (err, result)
            {
                if (isNull(err))
                {
                    self.reindex(function (err, result)
                    {
                        if (isNull(err))
                        {
                            return callback(err, self);
                        }

                        const msg = "Error reindexing folder " + self.uri + " : " + result;
                        Logger.log("error", msg);
                        return callback(1, msg);
                    });
                }
                else
                {
                    let errorMessage = "Error saving a folder: " + JSON.stringify(result);
                    Logger.log("error", errorMessage);
                    return callback(1, errorMessage);
                }
            });
        }
        else
        {
            let errorMessage = "Error checking if a folder needs renaming: " + JSON.stringify(needsRenaming);
            Logger.log("error", errorMessage);
            return callback(1, errorMessage);
        }
    });
};

Folder.deleteOnLocalFileSystem = function (absPath, callback)
{
    const isWin = /^win/.test(process.platform);
    const exec = require("child_process").exec;
    let command;

    if (isWin)
    {
        command = `rd /s /q "${absPath}"`;
    }
    else
    {
        command = `rm -rf ${absPath}`;
    }

    InformationElement.isSafePath(absPath, function (err, isSafe)
    {
        if (!err && isSafe)
        {
            exec(command, {}, function (error, stdout, stderr)
            {
                return callback(error, stdout, stderr);
            });
        }
    });
};

Folder.prototype.forAllChildren = function (
    resourcePageCallback,
    checkFunction,
    finalCallback,
    customGraphUri,
    descriptorTypesToRemove,
    descriptorTypesToExemptFromRemoval,
    includeArchivedResources
)
{
    const self = this;

    const dummyReq = {
        query: {
            currentPage: 0,
            pageSize: 10000
        }
    };

    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    const queryArguments = [
        {
            type: Elements.types.resourceNoEscape,
            value: graphUri
        },
        {
            type: Elements.types.resourceNoEscape,
            value: self.uri
        }
    ];

    let query =
        "SELECT DISTINCT ?uri \n" +
        "FROM [0]\n" +
        "WHERE \n" +
        "{ \n";

    /*
    if(getAllDescendentsAndNotJustChildren)
    {
        query += "   [1] nie:hasLogicalPart+ ?uri \n"
    }
    else
    {
        query += "   [1] nie:hasLogicalPart ?uri\n"
    }
    */

    query += "   [1] nie:hasLogicalPart+ ?uri\n";

    if (isNull(includeArchivedResources) || !includeArchivedResources)
    {
        query = query + "   FILTER NOT EXISTS { ?uri rdf:type ddr:ArchivedResource }";
    }

    query = query + "} \n";

    query = DbConnection.paginateQuery(
        dummyReq,
        query
    );

    let resultsSize;
    async.until(
        function ()
        {
            if (!isNull(checkFunction))
            {
                if (!checkFunction())
                {
                    return false;
                }
                // check function failed, stop querying!
                finalCallback(1, "Validation condition not met when fetching child resources with pagination. Aborting paginated querying...");
                return true;
            }

            if (!isNull(resultsSize))
            {
                if (resultsSize > 0)
                {
                    return false;
                }

                return true;
            }

            return true;
        },
        function (callback)
        {
            db.connection.executeViaJDBC(
                query,
                queryArguments,
                function (err, results)
                {
                    if (isNull(err))
                    {
                        dummyReq.query.currentPage++;

                        results = _.without(results, function (result)
                        {
                            return isNull(result);
                        });

                        async.mapSeries(results,
                            function (result, callback)
                            {
                                InformationElement.findByUri(result.uri, function (err, completeResource)
                                {
                                    if (!isNull(completeResource))
                                    {
                                        if (!isNull(descriptorTypesToRemove) && descriptorTypesToRemove instanceof Array)
                                        {
                                            completeResource.clearDescriptors(descriptorTypesToExemptFromRemoval, descriptorTypesToRemove);
                                        }

                                        callback(err, completeResource);
                                    }
                                    else
                                    {
                                        callback(null, completeResource);
                                    }
                                });
                            },
                            function (err, results)
                            {
                                resultsSize = results.length;
                                return resourcePageCallback(err, results);
                            });
                    }
                    else
                    {
                        return callback(1, "Unable to fetch all child resources from the graph, on page " + dummyReq.query.currentPage);
                    }
                }
            );
        },
        function (err, results)
        {
            finalCallback(err, "All children of resource " + self.uri + " retrieved via pagination query.");
        }
    );
};

Folder.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (!isNull(self.nie))
    {
        if (isNull(self.nie.isLogicalPartOf))
        {
            callback(1, "Unable to get human readable URI for the resource " + self.uri + ": There is no nie.isLogicalPartOf in the object!");
        }
        else if (isNull(self.nie.title))
        {
            callback(1, "Unable to get human readable URI for the resource " + self.uri + ": There is no nie.title in the object!");
        }
        else
        {
            const Resource = rlequire("dendro", "src/models/resource.js").Resource;
            Resource.findByUri(self.nie.isLogicalPartOf, function (err, parentResource)
            {
                if (isNull(err))
                {
                    if (!isNull(parentResource))
                    {
                        const Project = rlequire("dendro", "src/models/project.js").Project;
                        const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
                        if (parentResource.isA(Project) || parentResource.isA(Deposit))
                        {
                            callback(null, parentResource.ddr.humanReadableURI + "/data");
                        }
                        else if (parentResource.isA(Folder))
                        {
                            callback(null, parentResource.ddr.humanReadableURI + "/" + self.nie.title);
                        }
                        else
                        {
                            callback(1, "Invalid parent type detected when trying to get parent human readable URI for folder " + self.uri);
                        }
                    }
                    else
                    {
                        callback(1, "Unable to get parent human readable URI for folder " + self.uri);
                    }
                }
                else
                {
                    callback(1, "Error getting parent human readable URI for folder " + self.uri);
                }
            });
        }
    }
    else
    {
        callback(1, "Unable to get human readable URI for the resource " + self.uri + ": There is no nie namespace in the object!");
    }
};

Folder.prototype.refreshChildrenHumanReadableUris = function (callback, customGraphUri, progressReporter)
{
    const self = this;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    let failed = null;
    self.forAllChildren(
        function (err, resources)
        {
            if (isNull(err))
            {
                if (resources.length > 0)
                {
                    async.mapSeries(resources, function (resource, callback)
                    {
                        if (!isNull(resource))
                        {
                            if (!isNull(progressReporter))
                            {
                                Notification.sendProgress(
                                    `Updating internal uri of resource ${resource.nie.title}...`,
                                    progressReporter
                                );
                            }

                            resource.refreshHumanReadableUri(callback, graphUri, progressReporter);
                        }
                        else
                        {
                            callback(false, resource);
                        }
                    }, function (err, results)
                    {
                        if (err)
                        {
                            Logger.log("error", "Errors refreshing human readable URIs of children of " + self.uri + " : " + resources);
                            failed = true;
                        }

                        return callback(failed, null);
                    });
                }
                else
                {
                    return callback(failed, null);
                }
            }
            else
            {
                failed = true;
                return callback(failed, "Error fetching children of " + self.uri + " for reindexing : " + resources);
            }
        },
        function ()
        {
            return failed;
        },
        function (err)
        {
            return callback(err, null);
        },
        true,
        customGraphUri
    );
};

Folder.prototype.rename = function (newTitle, callback, userPerformingOperation, progressReporter)
{
    const self = this;

    InformationElement.prototype.rename.call(self, newTitle, function (err, updatedFolder)
    {
        if (isNull(err))
        {
            self.refreshChildrenHumanReadableUris(function (err, result)
            {
                return callback(err, result);
            }, null, progressReporter);
        }
        else
        {
            Logger.log("error", "Error occurred while renaming a folder!");
            Logger.log("error", JSON.stringify(err));
            Logger.log("error", JSON.stringify(result));
            return callback(err, result);
        }
    }, null, userPerformingOperation);
};

Folder = Class.extend(Folder, InformationElement, "nfo:Folder");

module.exports.Folder = Folder;
