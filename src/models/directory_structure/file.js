// complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require("path");
const XLSX = require("xlsx");
const _ = require("underscore");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const DataStoreConnection = rlequire("dendro", "src/kb/datastore/datastore_connection.js").DataStoreConnection;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Notification = rlequire("dendro", "src/models/notifications/notification.js").Notification;
const gfs = Config.getGFSByID();

const async = require("async");

function File (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "file", File);
    File.baseConstructor.call(this, object);

    if (!isNull(object.nie))
    {
        self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        self.nie.title = object.nie.title;
    }

    const re = /(?:\.([^.]+))?$/;
    let ext = re.exec(self.nie.title)[1]; // "txt"

    if (isNull(ext))
    {
        self.ddr.fileExtension = "default";
    }
    else
    {
        let getClassNameForExtension = require("font-awesome-filetypes").getClassNameForExtension;
        self.ddr.fileExtension = ext;
        self.ddr.hasFontAwesomeClass = getClassNameForExtension(ext);
    }

    return self;
}

File.estimateUnzippedSize = function (pathOfZipFile, callback)
{
    const path = require("path");
    const exec = require("child_process").exec;

    const command = "unzip -l \"" + pathOfZipFile + "\" | tail -n 1";
    const parentFolderPath = path.resolve(pathOfZipFile, "..");

    exec(command, {cwd: parentFolderPath}, function (error, stdout, stderr)
    {
        if (isNull(error))
        {
            const regex = new RegExp(" *[0-9]* [0-9]* file[s]?");

            let size = stdout.replace(regex, "");
            size = size.replace(/ /g, "");
            size = size.replace(/\n/g, "");
            Logger.log("Estimated unzipped file size is " + size);
            return callback(null, Number.parseInt(size));
        }
        const errorMessage = "[INFO] There was an error estimating unzipped file size with command " + command + ". Code Returned by Zip Command " + JSON.stringify(error);
        Logger.log("error", errorMessage);
        return callback(1, errorMessage);
    });
};

/**
 * unzip a file into a directory
 * @param pathOfFile absolute path of file to be unzipped
 * @param callback
 */
File.unzip = function (pathOfFile, callback)
{
    const fs = require("fs");
    const exec = require("child_process").exec;
    const tmp = require("tmp");

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tmpFolderPath)
        {
            let command = "unzip -qq -o \"" + pathOfFile + "\"";
            if (isNull(err))
            {
                const unzip = exec(command, {cwd: tmpFolderPath}, function (error, stdout, stderr)
                {
                    if (isNull(error))
                    {
                        Logger.log("Contents are in folder " + tmpFolderPath);
                        return callback(null, tmpFolderPath);
                    }
                    const errorMessage = "[INFO] There was an error unzipping file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(error);
                    Logger.log("error", errorMessage);
                    return callback(1, tmpFolderPath);
                });
            }
            else
            {
                const errorMessage = "Error unzipping the backup file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(tmpFolderPath);
                Logger.log("error", errorMessage);
                return callback(1, errorMessage);
            }
        }
    );
};

File.createBlankTempFile = function (fileName, callback)
{
    const tmp = require("tmp");
    const path = require("path");

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderAbsPath)
        {
            const tempFilePath = path.join(tempFolderAbsPath, fileName);

            if (isNull(err))
            {
                Logger.log("Temp File Created! Location: " + tempFilePath);
            }
            else
            {
                Logger.log("error", "Error creating temp file : " + tempFolderAbsPath);
            }

            return callback(err, tempFilePath);
        }
    );
};

File.createBlankFileRelativeToAppRoot = function (relativePathToFile, callback)
{
    const fs = require("fs");

    const absPathToFile = rlequire.absPathInApp("dendro", relativePathToFile);
    const parentFolder = path.resolve(absPathToFile, "..");

    fs.stat(absPathToFile, function (err, stat)
    {
        if (isNull(err))
        {
            return callback(null, absPathToFile, parentFolder);
        }
        else if (err.code === "ENOENT")
        {
            // file does not exist
            const mkpath = require("mkpath");

            mkpath(parentFolder, function (err)
            {
                if (err)
                {
                    return callback(1, "Error creating file " + err);
                }
                const fs = require("fs");
                fs.open(absPathToFile, "wx", function (err, fd)
                {
                    // handle error
                    fs.close(fd, function (err)
                    {
                        Logger.log("Directory structure " + parentFolder + " created. File " + absPathToFile + " also created.");
                        return callback(null, absPathToFile, parentFolder);
                    });
                });
            });
        }
        else
        {
            return callback(1, "Error creating file " + err);
        }
    });
};

File.deleteOnLocalFileSystem = function (absPathToFile, callback)
{
    const isWin = /^win/.test(process.platform);
    const exec = require("child_process").exec;
    let command;

    if (isWin)
    {
        command = `rd /s /q \""${absPathToFile}"\"`;
    }
    else
    {
        command = `rm -rf \"${absPathToFile}\"`;
    }

    InformationElement.isSafePath(absPathToFile, function (err, isSafe)
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

File.prototype.autorename = function ()
{
    const moment = require("moment");
    const fileNameDateSection = moment(new Date()).format("YYYY_MM_DD_at_hh_mm_ss");
    const self = this;
    let extension = path.extname(self.nie.title);
    let fileName = path.basename(self.nie.title, path.extname(self.nie.title));
    self.nie.title = fileName + "_Copy_created_" + fileNameDateSection + extension;
    return self.nie.title;
};

File.prototype.copyPaste = function ({destinationFolder}, callback)
{
    const self = this;
    self.writeToTempFile(function (err, writtenFilePath)
    {
        if (isNull(err))
        {
            const newFile = new File({
                nie: {
                    title: self.nie.title,
                    isLogicalPartOf: destinationFolder.uri
                }
            });
            newFile.saveWithFileAndContents(writtenFilePath, function (err, newFile)
            {
                if (isNull(err))
                {
                    destinationFolder.nie.hasLogicalPart = newFile.uri;
                    return callback(null, {
                        result: "success",
                        message: "File copied successfully.",
                        uri: newFile.uri
                    });
                }
                const msg = "Error [" + err + "] reindexing file [" + newFile.uri + "]in GridFS :" + newFile;
                return callback(500, {
                    result: "error",
                    message: "Unable to save files after buffering: " + JSON.stringify(newFile),
                    errors: newFile
                });
            });
        }
        else
        {
            return callback(500, {
                result: "error",
                message: "Unable to save files after buffering: ",
                errors: err
            });
        }
    });
};

File.prototype.save = function (callback, rename, progressReporter)
{
    const self = this;

    const newDescriptorsOfParent = [
        new Descriptor({
            prefixedForm: "nie:hasLogicalPart",
            value: self.uri
        })
    ];
    self.needsRenaming(function (err, needsRenaming)
    {
        if (isNull(err))
        {
            if (needsRenaming === true)
            {
                self.autorename();
            }

            const db = Config.getDBByID();
            db.connection.insertDescriptorsForSubject(
                self.nie.isLogicalPartOf,
                newDescriptorsOfParent,
                db.graphUri,
                function (err, result)
                {
                    if (isNull(err))
                    {
                        self.baseConstructor.prototype.save.call(self, function (err, result)
                        {
                            if (isNull(err))
                            {
                                if (isNull(err))
                                {
                                    self.reindex(function (err, result)
                                    {
                                        if (isNull(err))
                                        {
                                            return callback(err, self);
                                        }

                                        const msg = "Error reindexing file " + self.uri + " : " + JSON.stringify(err, null, 4) + "\n" + JSON.stringify(result, null, 4);
                                        Logger.log("error", msg);
                                        return callback(1, msg);
                                    });
                                }
                            }
                            else
                            {
                                Logger.log("error", "Error adding child file descriptors : " + result);
                                return callback(1, "Error adding child file descriptors : " + result);
                            }
                        });
                    }
                    else
                    {
                        Logger.log("error", "Error adding parent file descriptors : " + result);
                        return callback(1, "Error adding parent file descriptors: " + result);
                    }
                }
            );
        }
        else
        {
            let errorMessage = "Error checking if a file needs renaming during an upload : " + JSON.stringify(needsRenaming);
            Logger.log("error", errorMessage);
            return callback(1, errorMessage);
        }
    });
};

File.prototype.saveWithFileAndContents = function (localFilePath, callback, customGraphUri, progressReporter)
{
    const self = this;
    const _ = require("underscore");

    async.series([
        function (callback)
        {
            Notification.sendProgress(
                `Saving file ${self.nie.title} in knowledge graph...`,
                progressReporter,
                self
            );

            self.save(function (err, result)
            {
                Notification.sendProgress(
                    `Saved file ${self.nie.title} in knowledge graph...`,
                    progressReporter,
                    self
                );

                callback(err, result);
            }, true);
        },
        function (callback)
        {
            Notification.sendProgress(
                `Loading file ${self.nie.title} into storage layer...`,
                progressReporter,
                self
            );

            self.loadFromLocalFile(localFilePath, function (err, result)
            {
                Notification.sendProgress(
                    `Loaded file ${self.nie.title} into storage layer...`,
                    progressReporter,
                    self
                );
                callback(err, result);
            });
        },
        function (callback)
        {
            Notification.sendProgress(
                `Generating thumbnails for ${self.nie.title}...`,
                progressReporter,
                self
            );

            self.generateThumbnails(function (err, result)
            {
                Notification.sendProgress(
                    `Generating thumbnails for ${self.nie.title}...`,
                    progressReporter,
                    self
                );

                callback(err, result);
            });
        },
        function (callback)
        {
            Notification.sendProgress(
                `Extracting text from ${self.nie.title} for full-text search (if possible)...`,
                progressReporter,
                self
            );

            self.extractTextAndSaveIntoGraph(function (err, result)
            {
                Notification.sendProgress(
                    `Extracted text from ${self.nie.title} for full-text search (if possible)...`,
                    progressReporter,
                    self
                );
                callback(err, result);
            });
        },
        function (callback)
        {
            Notification.sendProgress(
                `Indexing ${self.nie.title} for searching...`,
                progressReporter,
                self
            );

            self.reindex(function (err, result)
            {
                Notification.sendProgress(
                    `Indexed ${self.nie.title} for searching...`,
                    progressReporter,
                    self
                );
                callback(err, result);
            }, customGraphUri);
        },
        function (callback)
        {
            Notification.sendProgress(
                `Extracting data from ${self.nie.title} if it is a tabular dataset...`,
                progressReporter,
                self
            );
            self.extractDataAndSaveIntoDataStore(localFilePath, function (err, result)
            {
                Notification.sendProgress(
                    `Extracted data from ${self.nie.title} if it is a tabular dataset...`,
                    progressReporter,
                    self
                );
                callback(err, result);
            });
        }
    ], function (err, result)
    {
        if (isNull(err))
        {
            callback(err, self);
        }
        else
        {
            callback(err, err);
        }
    });
};

File.prototype.deleteThumbnails = function ()
{
    const self = this;
    if (!isNull(Config.thumbnailableExtensions[self.ddr.fileExtension]))
    {
        const _ = require("underscore");

        _.map(Config.thumbnails.sizes, function (dimension)
        {
            if (Config.thumbnails.size_parameters.hasOwnProperty(dimension))
            {
                gfs.connection.delete(self.uri + "?thumbnail&size=" + dimension, function (err, result)
                {
                    if (err)
                    {
                        Logger.log("error", "Error deleting thumbnail " + self.uri + "?thumbnail&size=" + dimension);
                    }
                });
            }
        });
    }
};

File.prototype.deleteDatastoreData = function (callback)
{
    const self = this;

    DataStoreConnection.create(self.uri, function (err, connection)
    {
        if (isNull(err) && connection instanceof DataStoreConnection)
        {
            connection.clearData(callback);
        }
    });
};

File.prototype.delete = function (callback, uriOfUserDeletingTheFile, reallyDelete, progressReporter)
{
    const self = this;

    if (self.ddr.deleted && reallyDelete)
    {
        self.getProjectStorage(function (err, result)
        {
            if (isNull(err))
            {
                result.delete(self.uri, function (err, result)
                {
                    Notification.sendProgress(
                        `Deleted ${self.nie.title} from file storage.`,
                        progressReporter,
                        self
                    );

                    self.deleteThumbnails();

                    Notification.sendProgress(
                        `Removed thumbnails of ${self.nie.title}...`,
                        progressReporter,
                        self
                    );

                    self.deleteDatastoreData();

                    Notification.sendProgress(
                        `Deleted queryable data from file ${self.nie.title}...`,
                        progressReporter,
                        self
                    );

                    self.unindex(function (err, result)
                    {
                        if (isNull(err))
                        {
                            Notification.sendProgress(
                                `Removed file ${self.nie.title} from search index...`,
                                progressReporter,
                                self
                            );

                            self.deleteAllMyTriples(function (err, result)
                            {
                                if (isNull(err))
                                {
                                    Notification.sendProgress(
                                        `Deleted ${self.nie.title} from knowledge graph...`,
                                        progressReporter,
                                        self
                                    );

                                    self.unlinkFromParent(function (err, result)
                                    {
                                        if (isNull(err))
                                        {
                                            Notification.sendProgress(
                                                `File ${self.nie.title} completely deleted.`,
                                                progressReporter,
                                                self
                                            );

                                            callback(err, result);
                                        }
                                        else
                                        {
                                            return callback(err, "Error unlinking file " + self.uri + " from its parent. Error reported : " + result);
                                        }
                                    });
                                }
                                else
                                {
                                    return callback(err, "Error clearing descriptors for deleting file " + self.uri + ". Error reported : " + result);
                                }
                            });
                        }
                        else
                        {
                            return callback(err, "Error clearing index entry while deleting file " + self.uri + ". Error reported : " + result);
                        }
                    });
                });
            }
            else
            {
                return callback(err, "Error retrieving project storage configuration for resource" + self.uri + ". Error reported : " + result);
            }
        });
    }
    else
    {
        self.ddr.deleted = true;

        self.save(function (err, result)
        {
            return callback(err, result);
        }, true, uriOfUserDeletingTheFile);
    }
};

File.prototype.undelete = function (callback, uriOfUserUnDeletingTheFile)
{
    const self = this;
    if (self.ddr.deleted === true)
    {
        delete self.ddr.deleted;
        self.save(function (err, result)
        {
            if (isNull(err))
            {
                return callback(null, self);
            }
            return callback(err, result);
        }, true, uriOfUserUnDeletingTheFile);
    }
    else
    {
        callback(null, self);
    }
};

File.prototype.saveIntoFolder = function (destinationFolderAbsPath, includeMetadata, includeTempFileLocations, includeOriginalNodes, callback)
{
    const self = this;
    const fs = require("fs");

    fs.exists(destinationFolderAbsPath, function (exists)
    {
        if (!exists)
        {
            return callback(1, "Destination Folder :" + destinationFolderAbsPath + " does not exist .");
        }
        const fs = require("fs");
        const tempFilePath = destinationFolderAbsPath + path.sep + self.nie.title;

        const writeStream = fs.createWriteStream(tempFilePath);

        const connect = function (err, connection)
        {
            connection.get(self, writeStream, function (err, result)
            {
                if (isNull(err))
                {
                    return callback(null, tempFilePath);
                }
                return callback(1, result);
            });
        };

        self.getProjectStorage(function (err, connection)
        {
            if (isNull(err))
            {
                connect(err, connection);
            }
            else
            {
                self.getDepositStorage(function (err, connection)
                {
                    if (isNull(err))
                    {
                        connect(err, connection);
                    }
                    else
                    {
                        return callback(err, "Error finding storage file " + self.uri + ". Error reported : " + connection);
                    }
                });
            }
        });
    });
};

File.prototype.writeFileToStream = function (stream, callback)
{
    let self = this;

    let writeCallback = function (callback)
    {
        self.getProjectStorage(function (err, connection)
        {
            if (isNull(err))
            {
                connection.get(self, stream, function (err, result)
                {
                    if (isNull(err))
                    {
                        return callback(null);
                    }
                    return callback(1, result);
                });
            }
            else
            {
                return callback(err, "Error finding storage file " + self.uri + ". Error reported : " + connection);
            }
        });
    };

    if (isNull(self.nie.title))
    {
        self.findByUri(function (err)
        {
            writeCallback(callback);
        });
    }
    else
    {
        writeCallback(callback);
    }
};

File.prototype.writeDataContentToStream = function (stream, callback)
{
    let self = this;
};

File.prototype.writeToTempFile = function (callback)
{
    let self = this;
    const tmp = require("tmp");

    let fetchMetadataCallback = function (err, tempFolderPath)
    {
        if (isNull(err))
        {
            let writeToFileCallback = function (callback)
            {
                const tempFilePath = tempFolderPath + path.sep + self.nie.title;

                if (Config.debug.log_temp_file_writes)
                {
                    Logger.log("Temp file location: " + tempFilePath);
                }

                const fs = require("fs");
                const writeStream = fs.createWriteStream(tempFilePath);

                const connectStorage = function (err, storageConnection)
                {
                    storageConnection.get(self, writeStream, function (err, result)
                    {
                        if (isNull(err))
                        {
                            return callback(null, tempFilePath);
                        }
                        return callback(1, result);
                    });
                };

                self.getProjectStorage(function (err, storageConnection)
                {
                    if (isNull(err))
                    {
                        connectStorage(err, storageConnection);
                    }
                    else
                    {
                        self.getDepositStorage(function (err, storageConnection)
                        {
                            if (isNull(err))
                            {
                                connectStorage(err, storageConnection);
                            }
                            else
                            {
                                return callback(err, "Error finding storage file " + self.uri + ". Error reported : " + storageConnection);
                            }
                        });
                    }
                });
            };

            if (isNull(self.nie.title))
            {
                self.findByUri(function (err)
                {
                    writeToFileCallback(callback);
                });
            }
            else
            {
                writeToFileCallback(callback);
            }
        }
        else
        {
            return callback(1, err);
        }
    };

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        fetchMetadataCallback);
};

File.prototype.getThumbnail = function (size, callback)
{
    let self = this;
    const tmp = require("tmp");
    const fs = require("fs");

    if (isNull(size))
    {
        size = Config.thumbnails.size_parameters.icon.description;
    }

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath)
        {
            const tempFilePath = tempFolderPath + path.sep + path.basename(self.nie.title) + "_thumbnail_" + size + path.extname(self.nie.title);
            let writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri + "?thumbnail&size=" + size, writeStream, function (err, result)
            {
                if (err === 404)
                {
                    // try to regenerate thumbnails, fire and forget
                    self.generateThumbnails(function (err, result)
                    {
                        return callback(null, rlequire.absPathInApp("dendro", "public/images/icons/page_white_gear.png"));
                    });
                }
                else if (isNull(err))
                {
                    Logger.log("Thumbnail temp file location: " + tempFilePath);
                    return callback(null, tempFilePath);
                }
                else
                {
                    return callback(1, result);
                }
            });
        });
};

File.prototype.loadFromLocalFile = function (localFile, callback)
{
    const self = this;
    const fs = require("fs");

    self.getOwnerProject(function (err, ownerProject)
    {
        const Project = rlequire("dendro", "src/models/project.js").Project;
        if (isNull && ownerProject instanceof Project)
        {
            /** SAVE FILE**/
            self.getProjectStorage(function (err, storageConnection)
            {
                if (isNull(err))
                {
                    storageConnection.put(self,
                        fs.createReadStream(localFile),
                        function (err, result)
                        {
                            if (isNull(err))
                            {
                                return callback(null, self);
                            }

                            Logger.log("Error [" + err + "] saving file in GridFS :" + result);
                            return callback(err, result);
                        },
                        {
                            project: ownerProject,
                            type: "nie:File"
                        }
                    );
                }
                else
                {
                    return callback(true, storageConnection);
                }
            });
        }
        else
        {
            self.getOwnerDeposit(function (err, ownerDeposit)
            {
                const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
                if (isNull && ownerDeposit instanceof Deposit)
                {
                    /** SAVE FILE**/
                    self.getDepositStorage(function (err, storageConnection)
                    {
                        if (isNull(err))
                        {
                            storageConnection.put(self,
                                fs.createReadStream(localFile),
                                function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(null, self);
                                    }

                                    Logger.log("Error [" + err + "] saving file in GridFS :" + result);
                                    return callback(err, result);
                                },
                                {
                                    deposit: ownerDeposit,
                                    type: "nie:File"
                                }
                            );
                        }
                        else
                        {
                            return callback(true, storageConnection);
                        }
                    });
                }
                else
                {
                    callback(err, ownerProject);
                }
            });
        }
    });
};

File.prototype.extractDataAndSaveIntoDataStore = function (tempFileLocation, callback)
{
    const self = this;
    let dataStoreWriter;

    let processingDataDescriptor = new Descriptor({
        prefixedForm: "ddr:processingData",
        value: true
    });

    const markFileAsProcessingData = function (callback)
    {
        self.insertDescriptors(processingDataDescriptor, function (err, result)
        {
            callback(err);
        });
    };

    const markDataOK = function (callback)
    {
        self.deleteDescriptorTriples("ddr:hasProcessingError", function (err, result)
        {
            let hasDataContentTrue = new Descriptor({
                prefixedForm: "ddr:hasDataContent",
                value: true
            });

            self.insertDescriptors([hasDataContentTrue], function (err, result)
            {
                callback(err);
            });
        });
    };

    const markErrorProcessingData = function (err, callback)
    {
        let processingError;
        const unknownErrorMessage = "Unknown error occurred while extracting data";
        if (err instanceof Object)
        {
            processingError = (err.message) ? err.message : unknownErrorMessage;
        }
        else if (typeof err === "string")
        {
            processingError = err;
        }
        else
        {
            processingError = unknownErrorMessage;
        }

        let hasDataProcessingErrorTrue = new Descriptor({
            prefixedForm: "ddr:hasDataProcessingError",
            value: processingError
        });

        self.insertDescriptors([hasDataProcessingErrorTrue], function (err, result)
        {
            callback(err);
        });
    };

    const markFileDataProcessed = function (callback)
    {
        self.deleteDescriptorTriples("ddr:processingData", function (err, result)
        {
            callback(err);
        });
    };

    function safeDecodingRange (range)
    {
        let o = {s: {c: 0, r: 0}, e: {c: 0, r: 0}};
        let idx = 0, i = 0, cc = 0;
        let len = range.length;
        for (idx = 0; i < len; ++i)
        {
            if ((cc = range.charCodeAt(i) - 64) < 1 || cc > 26) break;
            idx = 26 * idx + cc;
        }
        o.s.c = --idx;

        for (idx = 0; i < len; ++i)
        {
            if ((cc = range.charCodeAt(i) - 48) < 0 || cc > 9) break;
            idx = 10 * idx + cc;
        }
        o.s.r = --idx;

        if (i === len || range.charCodeAt(++i) === 58)
        {
            o.e.c = o.s.c; o.e.r = o.s.r; return o;
        }

        for (idx = 0; i !== len; ++i)
        {
            if ((cc = range.charCodeAt(i) - 64) < 1 || cc > 26) break;
            idx = 26 * idx + cc;
        }
        o.e.c = --idx;

        for (idx = 0; i !== len; ++i)
        {
            if ((cc = range.charCodeAt(i) - 48) < 0 || cc > 9) break;
            idx = 10 * idx + cc;
        }
        o.e.r = --idx;
        return o;
    }
    function getHeaders (sheet)
    {
        let header = 0, offset = 1;
        let hdr = [];
        let o = {};
        if (isNull(sheet) || isNull(sheet["!ref"])) return [];
        let range = o.range !== undefined ? o.range : sheet["!ref"];
        let r;
        if (o.header === 1) header = 1;
        else if (o.header === "A") header = 2;
        else if (Array.isArray(o.header)) header = 3;
        switch (typeof range)
        {
        case "string":
            r = safeDecodingRange(range);
            break;
        case "number":
            r = safeDecodingRange(sheet["!ref"]);
            r.s.r = range;
            break;
        default:
            r = range;
        }
        if (header > 0) offset = 0;
        let rr = XLSX.utils.encode_row(r.s.r);
        let cols = new Array(r.e.c - r.s.c + 1);
        for (let C = r.s.c; C <= r.e.c; ++C)
        {
            cols[C] = XLSX.utils.encode_col(C);
            let val = sheet[cols[C] + rr];
            switch (header)
            {
            case 1:
                hdr.push(C);
                break;
            case 2:
                hdr.push(cols[C]);
                break;
            case 3:
                hdr.push(o.header[C - r.s.c]);
                break;
            default:
                if (isNull(val))
                {
                    continue;
                }
                hdr.push(XLSX.utils.format_cell(val));
            }
        }
        return hdr;
    }

    const xlsxFileParser = function (filePath, callback)
    {
        let workbook;
        try
        {
            workbook = XLSX.readFile(filePath);
        }
        catch (error)
        {
            Logger.log("error", error);
            return callback(error);
        }

        const sheetNamesWithIndexes = workbook.SheetNames.map(function (name, index)
        {
            return {index: index, name: name};
        });

        async.mapLimit(sheetNamesWithIndexes, 1, function (sheetNameAndIndex, callback)
        {
            let sheetName = sheetNameAndIndex.name;
            let sheetIndex = sheetNameAndIndex.index;

            let sheet = workbook.Sheets[sheetName];
            let sheetHeader = getHeaders(sheet);

            let sheetJSON = XLSX.utils.sheet_to_json(sheet, {raw: true});

            for (let i = 0; i < sheetJSON.length; i++)
            {
                delete sheetJSON[i].__proto__.__rowNum__;
            }

            dataStoreWriter.updateDataFromArrayOfObjects(sheetJSON, callback, sheetName, sheetIndex, sheetHeader);
        }, function (err, result)
        {
            callback(err, result);
        });
    };

    const xlsFileParser = function (filePath, callback)
    {
        let workbook;
        let formats = ["biff8", "biff5", "biff2", "xlml", "xlsx", "xlsm", "xlsb"];

        const handleWorkbook = function (workbook, callback)
        {
            const sheetNamesWithIndexes = workbook.SheetNames.map(function (name, index)
            {
                return {index: index, name: name};
            });

            async.mapLimit(sheetNamesWithIndexes, 1, function (sheetNameAndIndex, callback)
            {
                let sheetName = sheetNameAndIndex.name;
                let sheetIndex = sheetNameAndIndex.index;

                let sheet = workbook.Sheets[sheetName];
                let sheetHeader = getHeaders(sheet);

                let sheetJSON = XLSX.utils.sheet_to_json(sheet, {raw: true});

                for (let i = 0; i < sheetJSON.length; i++)
                {
                    delete sheetJSON[i].__proto__.__rowNum__;
                }

                dataStoreWriter.updateDataFromArrayOfObjects(sheetJSON, callback, sheetName, sheetIndex, sheetHeader);
            }, function (err, result)
            {
                callback(err, result);
            });
        };

        async.detectSeries(formats, function (format, callback)
        {
            try
            {
                workbook = XLSX.readFile(filePath, {
                    format: format
                });

                handleWorkbook(workbook, function (err, result)
                {
                    callback(null, isNull(err));
                });
            }
            catch (error)
            {
                Logger.log("error", error.message);
                callback(null, false);
            }
        }, function (err, processedAtLeastOneFormatOK)
        {
            if (!err && processedAtLeastOneFormatOK)
            {
                callback(null);
            }
            else
            {
                callback(1, "Unable to process the data from the XLS file after trying all possible formats.");
            }
        });

        // const exceltojson = require("xls-to-json-lc");
        // exceltojson({
        //     input: filePath,
        //     output: null
        //     //sheet: "sheetname",  // specific sheetname inside excel file (if you have multiple sheets)
        //     //lowerCaseHeaders:true //to convert all excel headers to lowr case in json
        // }, function(err, result) {
        //     if(err) {
        //         console.error(err);
        //     } else {
        //         dataStoreWriter.updateDataFromArrayOfObjects(result, callback, "Sheet1", "1", getHeaders(result));
        //     }
        // });
    };

    const csvFileParser = function (filePath, callback)
    {
        const Baby = require("babyparse");
        let pendingRecords = [];
        let chunkSize = 5000;
        let header;

        function sendData (records, callback)
        {
            dataStoreWriter.appendArrayOfObjects(records, function (err, result)
            {
                callback(err, result);
            }, null, 0);
        }

        const processRecord = function (record)
        {
            if (isNull(header) && !isNull(record.meta.fields))
            {
                header = record.meta.fields;
                dataStoreWriter.createSheetRecord(null, 0, header, function (err, result)
                {
                    if (!isNull(err))
                    {
                        Logger.log("error", "Error occurred while recording header of sheet " + 0 + " of resource " + self.uri);
                        Logger.log("error", err.stack);
                    }
                });
            }

            pendingRecords.push(record.data[0]);

            if (pendingRecords.length % chunkSize === 0)
            {
                sendData(pendingRecords, function (err, result)
                {});
                pendingRecords = [];
            }
        };

        const finishProcessing = function ()
        {
            sendData(pendingRecords, function (err, result)
            {
                callback(err, result);
            });

            pendingRecords = [];
        };

        const handleProcessingError = function ()
        {
            callback(1, "Unable to read file into CSV Parser");
        };

        Baby.parseFiles(filePath, {
            delimiter: "",	// auto-detect
            newline: "",	// auto-detect
            quoteChar: "\"",
            header: true,
            dynamicTyping: true,
            preview: 0,
            encoding: "",
            worker: true,
            comments: false,
            step: processRecord,
            complete: finishProcessing,
            error: handleProcessingError,
            download: false,
            skipEmptyLines: false,
            chunk: null,
            fastMode: null
        });
    };

    /**
     * DataStore Compatible file Extensions
     * Files that contain data that can be extracted for later querying
     */

    const dataFileParsers = {
        xls: xlsFileParser,
        xlsx: xlsxFileParser,
        ods: xlsxFileParser,
        csv: csvFileParser
    };

    const parser = dataFileParsers[self.ddr.fileExtension];
    if (Config.dataStoreCompatibleExtensions[self.ddr.fileExtension] && !isNull(parser))
    {
        async.waterfall([
            markFileAsProcessingData,
            function (callback)
            {
                DataStoreConnection.create(self.uri, function (err, conn)
                {
                    dataStoreWriter = conn;
                    callback(err);
                });
            },
            function (callback)
            {
                if (tempFileLocation)
                {
                    callback(null, tempFileLocation);
                }
                else
                {
                    self.writeToTempFile(callback);
                }
            },
            function (location, callback)
            {
                parser(location, function (err, result)
                {
                    if (!isNull(err))
                    {
                        markErrorProcessingData(err, function ()
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        callback(err, result);
                    }
                });
            }
        ], function (err, results)
        {
            markFileDataProcessed(function ()
            {
                if (!err)
                {
                    self.ddr.hasDataContent = true;
                    markDataOK(function (err, result)
                    {
                        if (isNull(err))
                        {
                            self.save(function (err, result)
                            {
                                callback(err, result);
                            });
                        }
                        else
                        {
                            callback(err, result);
                        }
                    });
                }
                else
                {
                    markErrorProcessingData(err, function (err, result)
                    {
                        if (isNull(err))
                        {
                            callback(err, result);
                        }
                        else
                        {
                            callback(err, result);
                        }
                    });
                }
            });
        });
    }
    else
    {
        callback(null, "There is no data parser for this format file : " + self.ddr.fileExtension);
    }
};

File.prototype.rebuildData = function (callback)
{
    const self = this;
    const tmp = require("tmp");

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, folderPath)
        {
            if (isNull(err) && !isNull(folderPath))
            {
                self.saveIntoFolder(folderPath, null, null, null, function (err, tempFilePath)
                {
                    if (isNull(err) && !isNull(tempFilePath))
                    {
                        self.extractDataAndSaveIntoDataStore(tempFilePath, function (err, result)
                        {
                            if (isNull(err))
                            {
                                File.deleteOnLocalFileSystem(tempFilePath, function (err, result)
                                {
                                    callback(err, result);
                                });
                            }
                            else
                            {
                                callback(err, "Error parsing the data inside the file. Does the first row of all your sheets contain only alphanumeric characters and is there a header for every column with non-empty cells? Error returned was : " + err.message);
                            }
                        });
                    }
                    else
                    {
                        callback(err, tempFilePath);
                    }
                });
            }
            else
            {
                callback(err, folderPath);
            }
        });
};

File.prototype.extractTextAndSaveIntoGraph = function (callback)
{
    let self = this;

    if (!isNull(Config.indexableFileExtensions[self.ddr.fileExtension]))
    {
        self.writeToTempFile(function (err, locationOfTempFile)
        {
            const textract = require("textract");
            textract.fromFileWithPath(locationOfTempFile, function (err, textContent)
            {
                // delete temporary file, we are done with it
                const fs = require("fs");
                fs.unlink(locationOfTempFile, function (err)
                {
                    if (err)
                    {
                        Logger.log("Error deleting file " + locationOfTempFile);
                    }
                });

                if (isNull(err))
                {
                    if (!isNull(textContent))
                    {
                        self.nie.plainTextContent = textContent;
                    }
                    else
                    {
                        delete self.nie.plainTextContent;
                    }
                    self.save(callback);
                }
                else
                {
                    Logger.log("error", "Error extracting text from " + locationOfTempFile + " : ");
                    Logger.log("error", err.stack);
                    return callback(err, err.message);
                }
            });
        });
    }
    else
    {
        return callback(null, null);
    }
};

File.prototype.getSheets = function (callback)
{
    const self = this;
    if (self.ddr.hasDataContent)
    {
        DataStoreConnection.create(self.uri, function (err, conn)
        {
            conn.getSheets(function (err, sheets)
            {
                callback(err, sheets);
            });
        });
    }
    else
    {
        const result = "File : " + self.uri + " does not have any data associated to it";
        Logger.log("debug", result);
        callback(null, []);
    }
};

File.prototype.pipeData = function (res, skipRows, pageSize, sheetIndex, outputFormat)
{
    const self = this;
    if (self.ddr.hasDataContent)
    {
        DataStoreConnection.create(self.uri, function (err, conn)
        {
            conn.getDataByQuery({}, res, skipRows, pageSize, sheetIndex, outputFormat);
        });
    }
    else
    {
        const result = "File : " + self.uri + " does not have any data associated to it";
        res.writeHead(400, result);
        res.end();
    }
};

File.prototype.connectToMongo = function (callback)
{
    const MongoClient = require("mongodb").MongoClient;
    const slug = rlequire("dendro", "src/utils/slugifier.js");

    let url;
    if (Config.mongoDBAuth.username && Config.mongoDBAuth.password && Config.mongoDBAuth.password !== "" && Config.mongoDBAuth.username !== "")
    {
        url = "mongodb://" + Config.mongoDBAuth.username + ":" + Config.mongoDBAuth.password + "@" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + slug(Config.mongoDbCollectionName) + "?authSource=admin";
    }
    else
    {
        url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + slug(Config.mongoDbCollectionName);
    }

    MongoClient.connect(url, function (err, db)
    {
        if (isNull(err))
        {
            Logger.log("Connected successfully to MongoDB");
            return callback(null, db);
        }
        const msg = "Error connecting to MongoDB";
        return callback(true, msg);
    });
};

File.prototype.findFileInMongo = function (db, callback)
{
    const collection = db.collection("fs.files");
    collection.find({filename: this.uri}).toArray(function (err, files)
    {
        if (Config.debug.files.log_file_version_fetches)
        {
            Logger.log("Found the following Files");
            Logger.log(files);
        }

        if (isNull(err))
        {
            return callback(null, files);
        }
        const msg = "Error findind document with uri: " + this.uri + " in Mongo";
        return callback(true, msg);
    });
};

File.prototype.loadMetadata = function (node, callback, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    const self = this;
    if (!isNull(node))
    {
        const metadata = node.metadata;
        let descriptors = [];
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

        self.replaceDescriptors(descriptors, excludedDescriptorTypes, exceptionedDescriptorTypes);

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
        return callback(1, "Cannot load metadata from an empty node.");
    }
};

File.prototype.generateThumbnails = function (callback)
{
    let _ = require("underscore");
    let self = this;
    const generateThumbnail = function (localFile, ownerProject, sizeTag, cb)
    {
        const fileName = path.basename(localFile, path.extname(localFile));
        const parentDir = path.dirname(localFile);
        const thumbnailFile = path.join(parentDir, fileName + "_thumbnail_" + sizeTag + ".jpg");
        const fs = require("fs");
        const sharp = require("sharp");

        sharp(localFile)
            .resize(
                Config.thumbnails.size_parameters[sizeTag].width,
                Config.thumbnails.size_parameters[sizeTag].height
            )
            .jpeg()
            .toFile(thumbnailFile, function (err)
            {
                if (isNull(err))
                {
                    Logger.log("Resized and cropped: " + Config.thumbnails.size_parameters[sizeTag].width + " x " + Config.thumbnails.size_parameters[sizeTag].height);
                    gfs.connection.put(
                        self.uri + "?thumbnail&size=" + sizeTag,
                        fs.createReadStream(thumbnailFile),
                        function (err, result)
                        {
                            if (!isNull(err))
                            {
                                const msg = "Error saving thumbnail file in GridFS :" + result + " when generating " + sizeTag + " size thumbnail for file " + self.uri;
                                Logger.log("error", msg);
                                cb(err, msg);
                            }
                            else
                            {
                                cb(null, null);
                            }
                        },
                        {
                            project: ownerProject,
                            type: "nie:File",
                            thumbnail: true,
                            thumbnailOf: self.uri,
                            size: sizeTag
                        }
                    );
                }
                else
                {
                    const msg = "Error saving thumbnail for file " + self.uri + ".";
                    Logger.log("error", msg);
                    const util = require("util");
                    Logger.log("error", util.inspect(err));
                    return callback(err, msg);
                }
            });
    };

    if (!isNull(Config.thumbnailableExtensions) && !isNull(Config.thumbnailableExtensions[self.ddr.fileExtension]))
    {
        self.getOwnerProject(function (err, project)
        {
            if (isNull(err))
            {
                if (!isNull(Config.thumbnailableExtensions) && !isNull(Config.thumbnailableExtensions[self.ddr.fileExtension]))
                {
                    self.writeToTempFile(function (err, tempFileAbsPath)
                    {
                        if (isNull(err))
                        {
                            async.mapSeries(Config.thumbnails.sizes, function (thumbnailSize, callback)
                            {
                                generateThumbnail(tempFileAbsPath, project, thumbnailSize, callback);
                            },
                            function (err, results)
                            {
                                if (isNull(err))
                                {
                                    return callback(null, null);
                                }

                                return callback(err, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + JSON.stringify(results));
                            });
                        }
                        else
                        {
                            return callback(1, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + tempFileAbsPath);
                        }
                    });
                }
                else
                {
                    return callback(null, "Nothing to be done for this file, since " + self.ddr.fileExtension + " is not a thumbnailable extension.");
                }
            }
            else
            {
                return callback(null, "Unable to retrieve owner project of " + self.uri + " for thumbnail generation.");
            }
        });
    }
    else
    {
        callback(null);
    }
};

File.prototype.getProjectStorage = function (callback)
{
    const self = this;

    self.getOwnerProject(function (err, ownerProject)
    {
        if (isNull(err))
        {
            const Project = rlequire("dendro", "src/models/project.js").Project;
            if (isNull && ownerProject instanceof Project)
            {
                ownerProject.getActiveStorageConnection(function (err, connection)
                {
                    callback(err, connection);
                });
            }
            else
            {
                callback(err, ownerProject);
            }
        }
        else
        {
            return callback(true, "file with no project");
        }
    });
};

File.prototype.getDepositStorage = function (callback)
{
    const self = this;

    self.getOwnerDeposit(function (err, ownerDeposit)
    {
        if (isNull(err))
        {
            const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
            if (isNull && ownerDeposit instanceof Deposit)
            {
                ownerDeposit.getActiveStorageConnection(function (err, connection)
                {
                    callback(err, connection);
                });
            }
            else
            {
                callback(err, ownerDeposit);
            }
        }
        else
        {
            return callback(true, "file with no project");
        }
    });
};

File = Class.extend(File, InformationElement, "nfo:FileDataObject");

module.exports.File = File;
