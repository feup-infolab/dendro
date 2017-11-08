// complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require("path");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const DataStoreConnection = require(Pathfinder.absPathInSrcFolder("/kb/datastore/datastore_connection.js")).DataStoreConnection;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const async = require("async");

function File (object)
{
    const self = this;
    self.addURIAndRDFType(object, "file", File);
    File.baseConstructor.call(this, object);

    if (!isNull(object.nie))
    {
        self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        self.nie.title = object.nie.title;

        if (isNull(self.ddr.humanReadableURI))
        {
            self.ddr.humanReadableURI = object.nie.isLogicalPartOf + "/" + object.nie.title;
        }
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
            console.log("Estimated unzipped file size is " + size);
            return callback(null, Number.parseInt(size));
        }
        const errorMessage = "[INFO] There was an error estimating unzipped file size with command " + command + ". Code Returned by Zip Command " + JSON.stringify(error);
        console.error(errorMessage);
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
                        console.log("Contents are in folder " + tmpFolderPath);
                        return callback(null, tmpFolderPath);
                    }
                    const errorMessage = "[INFO] There was an error unzipping file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(error);
                    console.error(errorMessage);
                    return callback(1, tmpFolderPath);
                });
            }
            else
            {
                const errorMessage = "Error unzipping the backup file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(tmpFolderPath);
                console.error(errorMessage);
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
                console.log("Temp File Created! Location: " + tempFilePath);
            }
            else
            {
                console.error("Error creating temp file : " + tempFolderAbsPath);
            }

            return callback(err, tempFilePath);
        }
    );
};

File.createBlankFileRelativeToAppRoot = function (relativePathToFile, callback)
{
    const fs = require("fs");

    const absPathToFile = Pathfinder.absPathInApp(relativePathToFile);
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
                        console.log("Directory structure " + parentFolder + " created. File " + absPathToFile + " also created.");
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

File.prototype.save = function (callback, rename)
{
    const self = this;

    const newDescriptorsOfParent = [
        new Descriptor({
            prefixedForm: "nie:hasLogicalPart",
            value: self.uri
        })
    ];

    const renameIfFileNameExists = function (callback)
    {
        if (rename)
        {
            const getParent = function (callback)
            {
                let parentUri = self.nie.isLogicalPartOf;
                const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;

                Folder.findByUri(parentUri, function (err, parentFolder)
                {
                    if (isNull(err))
                    {
                        if (parentFolder instanceof Folder)
                        {
                            callback(err, parentFolder);
                        }
                        else
                        {
                            Project.findByUri(parentUri, function (err, parentProject)
                            {
                                if (isNull(err))
                                {
                                    if (parentProject instanceof Project)
                                    {
                                        callback(err, parentProject);
                                    }
                                    else
                                    {
                                        callback(true, "Error: Parent of :  " + self.uri + " is neither a folder nor project");
                                    }
                                }
                                else
                                {
                                    callback(err, parentProject);
                                }
                            });
                        }
                    }
                    else
                    {
                        callback(err, parentFolder);
                    }
                });
            };

            const getChildrenOfParent = function (parent, callback)
            {
                parent.getLogicalParts(callback);
            };

            const renameIfChildExistsWithSameName = function (children, callback)
            {
                const childrenWithTheSameName = _.find(children, function (child)
                {
                    return child.nie.title === self.nie.title && child.uri !== self.uri && child.ddr.deleted !== true;
                });

                if (
                    !isNull(childrenWithTheSameName) && Array.isArray(childrenWithTheSameName) && childrenWithTheSameName.length > 0 ||
                    !isNull(childrenWithTheSameName) && childrenWithTheSameName instanceof Object
                )
                {
                    let fileNameData = self.nie.title.split(".");
                    self.nie.title = fileNameData[0] + "_Copy_created_" + Date.now() + "." + fileNameData[1];
                }

                callback(null);
            };

            async.waterfall([
                getParent,
                getChildrenOfParent,
                renameIfChildExistsWithSameName
            ], callback);
        }
        else
        {
            callback(null);
        }
    };

    renameIfFileNameExists(function (err, result)
    {
        if (isNull(err))
        {
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
                                return callback(null, self);
                            }
                            console.error("Error adding child file descriptors : " + result);
                            return callback(1, "Error adding child file descriptors : " + result);
                        });
                    }
                    else
                    {
                        console.error("Error adding parent file descriptors : " + result);
                        return callback(1, "Error adding parent file descriptors: " + result);
                    }
                }
            );
        }
        else
        {
            callback(1, "There is a file with the same name " + self.nie.title + " in this folder and there was an error renaming the new duplicate.");
        }
    });
};

File.prototype.saveWithFileAndContents = function (localFilePath, indexConnectionToReindexContents, callback)
{
    const self = this;
    const _ = require("underscore");

    async.series([
        function (callback)
        {
            self.save(callback, true);
        },
        function (callback)
        {
            self.loadFromLocalFile(localFilePath, callback);
        },
        function (callback)
        {
            self.generateThumbnails(callback);
        },
        function (callback)
        {
            self.extractTextAndSaveIntoGraph(callback);
        },
        function (callback)
        {
            self.reindex(indexConnectionToReindexContents, callback);
        },
        function (callback)
        {
            self.extractDataAndSaveIntoDataStore(localFilePath, callback);
        }
    ], function (err)
    {
        callback(err, self);
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
                        console.error("Error deleting thumbnail " + self.uri + "?thumbnail&size=" + dimension);
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

File.prototype.delete = function (callback, uriOfUserDeletingTheFile, reallyDelete)
{
    const self = this;

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
                        gfs.connection.delete(self.uri, function (err, result)
                        {
                            self.deleteThumbnails();
                            self.deleteDatastoreData();
                            return callback(err, result);
                        });
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
    self.updateDescriptors(
        [
            new Descriptor({
                prefixedForm: "ddr:deleted",
                value: null
            })
        ]
    );

    self.save(function (err, result)
    {
        if (isNull(err))
        {
            return callback(null, self);
        }
        return callback(err, result);
    }, true, uriOfUserUnDeletingTheFile);
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
        gfs.connection.get(self.uri, writeStream, function (err, result)
        {
            if (isNull(err))
            {
                return callback(null, tempFilePath);
            }
            return callback(1, result);
        });
    });
};

File.prototype.writeFileToStream = function (stream, callback)
{
    let self = this;

    let writeCallback = function (callback)
    {
        gfs.connection.get(self.uri, stream, function (err, result)
        {
            if (isNull(err))
            {
                return callback(null);
            }
            return callback(1, result);
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
                    console.log("Temp file location: " + tempFilePath);
                }

                const fs = require("fs");
                const writeStream = fs.createWriteStream(tempFilePath);
                gfs.connection.get(self.uri, writeStream, function (err, result)
                {
                    if (isNull(err))
                    {
                        return callback(null, tempFilePath);
                    }
                    return callback(1, result);
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
                        return callback(null, Pathfinder.absPathInPublicFolder("images/icons/page_white_gear.png"));
                    });
                }
                else if (isNull(err))
                {
                    console.log("Thumbnail temp file location: " + tempFilePath);
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
    const tmp = require("tmp");
    const fs = require("fs");

    self.getOwnerProject(function (err, ownerProject)
    {
        const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
        if (isNull && ownerProject instanceof Project)
        {
            /** SAVE FILE**/
            gfs.connection.put(
                self.uri,
                fs.createReadStream(localFile),
                function (err, result)
                {
                    if (isNull(err))
                    {
                        return callback(null, self);
                    }

                    console.log("Error [" + err + "] saving file in GridFS :" + result);
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
            callback(err, ownerProject);
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
        let hasDataProcessingErrorTrue = new Descriptor({
            prefixedForm: "ddr:hasDataProcessingError",
            value: err
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

    const xlsxFileParser = function (filePath, callback)
    {
        const XLSX = require("xlsx");

        function safe_decode_range (range)
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
            if (sheet === null || sheet["!ref"] === null) return [];
            let range = o.range !== undefined ? o.range : sheet["!ref"];
            let r;
            if (o.header === 1) header = 1;
            else if (o.header === "A") header = 2;
            else if (Array.isArray(o.header)) header = 3;
            switch (typeof range)
            {
            case "string":
                r = safe_decode_range(range);
                break;
            case "number":
                r = safe_decode_range(sheet["!ref"]);
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
                    if (val === undefined) continue;
                    hdr.push(XLSX.utils.format_cell(val));
                }
            }
            return hdr;
        }

        let workbook;
        try
        {
            workbook = XLSX.readFile(filePath);
        }
        catch (error)
        {
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
                        console.error("Error occurred while recording header of sheet " + 0 + " of resource " + self.uri);
                        console.error(err.stack);
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
        xls: xlsxFileParser,
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
                parser(location, function (err)
                {
                    if (!isNull(err))
                    {
                        markErrorProcessingData(err, function ()
                        {
                            callback(err);
                        });
                    }
                    else
                    {
                        callback(err);
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
                    self.save(function (err, result)
                    {
                        callback(err, result);
                    });
                }
                else
                {
                    callback(err, results);
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
                            if (isNull(err) && !isNull(result))
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
                        console.log("Error deleting file " + locationOfTempFile);
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
                        delete newFile.nie.plainTextContent;
                    }
                    self.save(callback);
                }
                else
                {
                    console.error("Error extracting text from " + locationOfTempFile + " : ");
                    console.error(err);
                    return callback(1, err);
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
        res.writeHead(400, result);
        res.end();
    }
};

File.prototype.pipeData = function (writeStream, skipRows, pageSize, sheetIndex, outputFormat)
{
    const self = this;
    if (self.ddr.hasDataContent)
    {
        DataStoreConnection.create(self.uri, function (err, conn)
        {
            conn.getDataByQuery({}, writeStream, skipRows, pageSize, sheetIndex, outputFormat);
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
    const url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoDbCollectionName;
    MongoClient.connect(url, function (err, db)
    {
        if (isNull(err))
        {
            console.log("Connected successfully to MongoDB");
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
            console.log("Found the following Files");
            console.log(files);
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
        let easyimg = require("easyimage");
        const fileName = path.basename(localFile, path.extname(localFile));
        const parentDir = path.dirname(localFile);
        const thumbnailFile = path.join(parentDir, fileName + "_thumbnail_" + sizeTag + "." + Config.thumbnails.thumbnail_format_extension);
        const fs = require("fs");

        easyimg.resize(
            {
                src: localFile,
                dst: thumbnailFile,
                width: Config.thumbnails.size_parameters[sizeTag].width,
                height: Config.thumbnails.size_parameters[sizeTag].height,
                x: 0,
                y: 0
            }).then(function (image)
        {
            console.log("Resized and cropped: " + image.width + " x " + image.height);

            // TODO
            gfs.connection.put(
                self.uri + "?thumbnail&size=" + sizeTag,
                fs.createReadStream(thumbnailFile),
                function (err, result)
                {
                    if (!isNull(err))
                    {
                        const msg = "Error saving thumbnail file in GridFS :" + result + " when generating " + sizeTag + " size thumbnail for file " + self.uri;
                        console.error(msg);
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
        })
            .catch(function (err)
            {
                return callback(err, Number("Error saving thumbnail for file ") + self.uri + " . \nCheck that you have the xpdf ghostscript-x tesseract-ocr imagemagick dependencies installed in the server.\nIf you are on a Mac, you need XQuartz and all other dependencies: run this command: brew cask install xquartz && brew install ghostscript xpdf tesseract imagemagick && brew cask install pdftotext" + err);
            });
    };

    if (_.contains(Config.thumbnailableExtensions, self.ddr.fileExtension))
    {
        self.getOwnerProject(function (err, project)
        {
            if (isNull(err))
            {
                if (!isNull(Config.thumbnailableExtensions[self.ddr.fileExtension]))
                {
                    self.writeToTempFile(function (err, tempFileAbsPath)
                    {
                        if (isNull(err))
                        {
                            async.mapSeries(Config.thumbnails.sizes, function (thumbnailSize, callback)
                            {
                                generateThumbnail(tempFileAbsPath, project.uri, thumbnailSize, callback);
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

// File.prototype.moveToFolder = function(newParentFolder, callback)
// {
//     const self = this;
//
//     const oldParent = self.nie.isLogicalPartOf;
//     const newParent = newParentFolder.uri;
//
//     const query =
//         "DELETE DATA " +
//         "{ " +
//         "GRAPH [0] " +
//         "{ " +
//         "[1] nie:title ?title . " +
//         "} " +
//         "}; " +
//
//         "INSERT DATA " +
//         "{ " +
//         "GRAPH [0] " +
//         "{ " +
//         "[1] nie:title [2] " +
//         "} " +
//         "}; ";
//
//     db.connection.executeViaJDBC(query,
//         [
//             {
//                 type: Elements.types.resourceNoEscape,
//                 value: db.graphUri
//             },
//             {
//                 type: Elements.types.resource,
//                 value: self.uri
//             },
//             {
//                 type: Elements.types.string,
//                 value: newTitle
//             }
//         ],
//         function(err, result)
//         {
//             Cache.getByGraphUri(db.graphUri).delete(self.uri, function (err, result)
//             {
//                 Cache.getByGraphUri(db.graphUri).delete(newParentFolder.uri, function (err, result)
//                 {
//                     return callback(err, result);
//                 });
//             });
//         });
// };

File = Class.extend(File, InformationElement, "nfo:FileDataObject");

module.exports.File = File;
