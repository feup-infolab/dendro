//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const DataStoreConnection = require(Pathfinder.absPathInSrcFolder("/kb/datastore/datastore_connection.js")).DataStoreConnection;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const async = require("async");

function File(object) {
    const self = this;
    self.addURIAndRDFType(object, "file", File);
    File.baseConstructor.call(this, object);

    if (!isNull(object.nie)) {
        self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        self.nie.title = object.nie.title;

        if (isNull(self.ddr.humanReadableURI)) {
            self.ddr.humanReadableURI = object.nie.isLogicalPartOf + "/" + object.nie.title;
        }
    }

    const re = /(?:\.([^.]+))?$/;
    let ext = re.exec(self.nie.title)[1];   // "txt"

    if (isNull(ext)) {
        self.ddr.fileExtension = "default";
    }
    else {
        let getClassNameForExtension = require('font-awesome-filetypes').getClassNameForExtension;
        self.ddr.fileExtension = ext;
        self.ddr.hasFontAwesomeClass = getClassNameForExtension(ext);
    }

    return self;
}

File.estimateUnzippedSize = function(pathOfZipFile, callback)
{
    const path = require("path");
    const exec = require("child_process").exec;

    const command = 'unzip -l ' + pathOfZipFile + " | tail -n 1";
    const parentFolderPath = path.resolve(pathOfZipFile, "..");


    exec(command, {cwd: parentFolderPath}, function (error, stdout, stderr) {
        if (isNull(error)) {
            const regex = new RegExp(" *[0-9]* [0-9]* file[s]?");

            let size = stdout.replace(regex, "");
            size = size.replace(/ /g, "");
            size = size.replace(/\n/g, "");
            console.log("Estimated unzipped file size is " + size);
            return callback(null, Number.parseInt(size));

        } else {
            const errorMessage = "[INFO] There was an error estimating unzipped file size with command " + command + ". Code Returned by Zip Command " + JSON.stringify(error);
            console.error(errorMessage);
            return callback(1, errorMessage);
        }
    });
};

/**
 * unzip a file into a directory
 * @param pathOfFile absolute path of file to be unzipped
 * @param callback
 */
File.unzip = function(pathOfFile, callback) {
    const fs = require("fs");
    const exec = require("child_process").exec;
    const tmp = require('tmp');

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function(err, tmpFolderPath)
        {
            let command = 'unzip -qq -o ' + pathOfFile;
            if(isNull(err))
            {
                const unzip = exec(command, {cwd: tmpFolderPath}, function (error, stdout, stderr) {
                    if (isNull(error)) {
                        console.log("Contents are in folder " + tmpFolderPath);
                        return callback(null, tmpFolderPath);

                    } else {
                        const errorMessage = "[INFO] There was an error unzipping file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(error);
                        console.error(errorMessage);
                        return callback(1, tmpFolderPath);
                    }
                });
            }
            else {
                const errorMessage = "Error unzipping the backup file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(tmpFolderPath);
                console.error(errorMessage);
                return callback(1, errorMessage);
            }

        }
    );
};

File.createBlankTempFile = function (fileName, callback) {
    const tmp = require('tmp');
    const path = require("path");

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderAbsPath) {
            const tempFilePath = path.join(tempFolderAbsPath, fileName);

            if (isNull(err)) {
                console.log("Temp File Created! Location: " + tempFilePath);
            }
            else {
                console.error("Error creating temp file : " + tempFolderAbsPath);
            }

            return callback(err, tempFilePath);
        }
    );
};

File.createBlankFileRelativeToAppRoot = function(relativePathToFile, callback)
{
    const fs = require("fs");

    const absPathToFile = Pathfinder.absPathInApp(relativePathToFile);
    const parentFolder = path.resolve(absPathToFile, "..");

    fs.stat(absPathToFile, function (err, stat) {
        if (isNull(err)) {
            return callback(null, absPathToFile, parentFolder);
        } else if (err.code === 'ENOENT') {
            // file does not exist
            const mkpath = require('mkpath');

            mkpath(parentFolder, function (err) {
                if (err) {
                    return callback(1, "Error creating file " + err);
                }
                else {
                    const fs = require("fs");
                    fs.open(absPathToFile, "wx", function (err, fd) {
                        // handle error
                        fs.close(fd, function (err) {
                            console.log('Directory structure ' + parentFolder + ' created. File ' + absPathToFile + " also created.");
                            return callback(null, absPathToFile, parentFolder);
                        });
                    });
                }
            });
        }
        else {
            return callback(1, "Error creating file " + err);
        }
    });
};

File.deleteOnLocalFileSystem = function(err, callback)
{
    const exec = require("child_process").exec;
    const command = "rm absPath";
    const rm = exec(command, {}, function (error, stdout, stderr) {
        return callback(error, stdout, stderr);
    });
};

File.prototype.save = function (callback) {
    const self = this;

    const newDescriptorsOfParent = [
        new Descriptor({
            prefixedForm: "nie:hasLogicalPart",
            value: self.uri
        })
    ];

    db.connection.insertDescriptorsForSubject(
        self.nie.isLogicalPartOf,
        newDescriptorsOfParent,
        db.graphUri,
        function (err, result) {
            if (isNull(err)) {
                self.baseConstructor.prototype.save.call(self, function (err, result) {
                    if (isNull(err)) {
                        return callback(null, self);
                    }
                    else {
                        console.error("Error adding child file descriptors : " + result);
                        return callback(1, "Error adding child file descriptors : " + result);
                    }
                });
            }
            else {
                console.error("Error adding parent file descriptors : " + result);
                return callback(1, "Error adding parent file descriptors: " + result);
            }
        }
    );
};

File.prototype.deleteThumbnails = function () {
    const self = this;
    if (!isNull(Config.thumbnailableExtensions[self.ddr.fileExtension])) {
        for (let i = 0; i < Config.thumbnails.sizes.length; i++) {
            const dimension = Config.thumbnails.sizes[i];
            if (Config.thumbnails.size_parameters.hasOwnProperty(dimension)) {
                gfs.connection.delete(self.uri + "?thumbnail&size=" + dimension, function (err, result) {
                    if (err) {
                        console.error("Error deleting thumbnail " + self.uri + "?thumbnail&size=" + dimension);
                    }
                });
            }
        }
    }
};

File.prototype.delete = function (callback, uriOfUserDeletingTheFile, reallyDelete) {
    const self = this;

    if (self.ddr.deleted && reallyDelete) {
        self.deleteAllMyTriples(function (err, result) {
            if (isNull(err)) {
                self.unlinkFromParent(function (err, result) {
                    if (isNull(err)) {
                        gfs.connection.delete(self.uri, function (err, result) {
                            self.deleteThumbnails();
                            return callback(err, result);
                        });
                    }
                    else {
                        return callback(err, "Error unlinking file " + self.uri + " from its parent. Error reported : " + result);
                    }
                });
            }
            else {
                return callback(err, "Error clearing descriptors for deleting file " + self.uri + ". Error reported : " + result);
            }
        });
    }
    else {
        self.ddr.deleted = true;

        self.save(function (err, result) {
            return callback(err, result);
        }, true, uriOfUserDeletingTheFile);
    }
};

File.prototype.undelete = function (callback, uriOfUserUnDeletingTheFile) {
    const self = this;
    self.updateDescriptors(
        [
            new Descriptor({
                prefixedForm: "ddr:deleted",
                value: null
            })
        ]
    );

    self.save(function (err, result) {
        if (isNull(err)) {
            return callback(null, self);
        }
        else {
            return callback(err, result);
        }
    }, true, uriOfUserUnDeletingTheFile);
};

File.prototype.saveIntoFolder = function (destinationFolderAbsPath, includeMetadata, includeTempFileLocations, includeOriginalNodes, callback) {
    const self = this;
    const fs = require("fs");

    fs.exists(destinationFolderAbsPath, function (exists) {
        if (!exists) {
            return callback(1, "Destination Folder :" + destinationFolderAbsPath + " does not exist .");
        }
        else
        {
            const fs = require("fs");
            const tempFilePath = destinationFolderAbsPath + path.sep + self.nie.title;

            const writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri, writeStream, function (err, result) {
                if (isNull(err)) {
                    return callback(null, tempFilePath);
                }
                else {
                    return callback(1, result);
                }
            });
        }
    });
};

File.prototype.writeFileToStream = function (stream, callback) {
    let self = this;

    let writeCallback = function (callback) {
        gfs.connection.get(self.uri, stream, function (err, result) {
            if (isNull(err)) {
                return callback(null);
            }
            else {
                return callback(1, result);
            }
        });
    };

    if (isNull(self.nie.title)) {
        self.findByUri(function (err) {
            writeCallback(callback);
        });
    }
    else {
        writeCallback(callback);
    }
};

File.prototype.writeDataContentToStream = function (stream, callback) {
    let self = this;


};

File.prototype.writeToTempFile = function (callback) {
    let self = this;
    const tmp = require('tmp');

    let fetchMetadataCallback = function (err, tempFolderPath) {
        if (isNull(err)) {
            let writeToFileCallback = function (callback) {
                const tempFilePath = tempFolderPath + path.sep + self.nie.title;

                if (Config.debug.log_temp_file_writes)
                {
                    console.log("Temp file location: " + tempFilePath);
                }

                const fs = require("fs");
                const writeStream = fs.createWriteStream(tempFilePath);
                gfs.connection.get(self.uri, writeStream, function (err, result) {
                    if (isNull(err)) {
                        return callback(null, tempFilePath);
                    }
                    else {
                        return callback(1, result);
                    }
                });
            };

            if (isNull(self.nie.title)) {
                self.findByUri(function (err) {
                    writeToFileCallback(callback);
                });
            }
            else {
                writeToFileCallback(callback);
            }
        }
        else {
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

File.prototype.getThumbnail = function (size, callback) {
    let self = this;
    const tmp = require('tmp');
    const fs = require("fs");

    if (isNull(size)) {
        size = Config.thumbnails.size_parameters.icon.description;
    }

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath) {

            const tempFilePath = tempFolderPath + path.sep + path.basename(self.nie.title) + "_thumbnail_" + size + path.extname(self.nie.title);
            let writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri + "?thumbnail&size=" + size, writeStream, function (err, result) {
                if (err === 404) {
                    //try to regenerate thumbnails, fire and forget
                    self.generateThumbnails(function (err, result) {
                        return callback(null, Pathfinder.absPathInPublicFolder("images/icons/extensions/file_generating_thumbnail.png"));
                    })
                }
                else if (isNull(err)) {
                    console.log("Thumbnail temp file location: " + tempFilePath);
                    return callback(null, tempFilePath);
                }
                else {
                    return callback(1, result);
                }
            });
        });
};

File.prototype.loadFromLocalFile = function (localFile, callback) {
    const self = this;
    const tmp = require('tmp');
    const fs = require("fs");

    self.getOwnerProject(function (err, ownerProject) {
        const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
        if (isNull && ownerProject instanceof Project) {
            /**SAVE FILE**/
            gfs.connection.put(
                self.uri,
                fs.createReadStream(localFile),
                function (err, result) {
                    if (isNull(err)) {
                        return callback(null, self);
                    }
                    else {
                        console.log("Error [" + err + "] saving file in GridFS :" + result);
                        return callback(err, result);
                    }

                },
                {
                    project: ownerProject,
                    type: "nie:File"
                }
            );
        }
        else {
            callback(err, ownerProject);
        }
    });


};

File.prototype.extract_data_and_save_into_datastore = function(callback, tempFileLocation, deleteFileAfterExtracting)
{
    const self = this;
    DataStoreConnection.create(self.uri, function(err, conn){
        conn.getStream(function(err, stream){
            stream.on('close', callback);
            self.extractData(writeStream, tempFileLocation, deleteFileAfterExtracting);
        });
    });
};

File.prototype.extract_data = function(writeStream, tempFileLocation, deleteFileAfterExtracting)
{
    const self = this;

    const deleteTempFile = function(filePath){
        const fs = require("fs");

        fs.unlink(filePath, function (err) {
            if (err) throw err;
            console.log('successfully deleted temporary file ' +filePath);
        });
    };
    const xlsFileParser = function (filePath){
        const excelParser = require('excel-parser');

        excelParser.parse({
            inFile: filePath,
            worksheet: 1,
            skipEmpty: false
        },function(err, records){
            if(err){
                const error = "Unable to produce JSON representation of file :" + filePath + "Error reported: " + err + ".\n Cause : " + records + " \n ";
                callback(1, error);
            }
            else{
                writeStream.write(JSON.stringify(records));
            }

        });
    };
    const csvFileParser = function (filePath){
        const fs = require("fs");
        fs.readFile(filePath, 'utf8', function(err, data)
        {
            if(!isNull(err))
            {
                const csv = require('csv');
                const parser = csv.parse(data);

                const transformer = csv.transform(function(data){
                    return data;
                });

                const stringifier = csv.stringify();

                parser.on('readable', function(){
                    while(data = parser.read()){
                        transformer.write(data);
                    }
                });

                parser.on('error', function(){
                    callback(1, "Error parsing CSV file.")
                });

                transformer.on('readable', function(){
                    while(data = transformer.read()){
                        stringifier.write(data);
                    }
                });

                stringifier.on('readable', function(){
                    while(data = stringifier.read()){
                        writeStream.write(data);
                    }

                    callback(null);
                });
            }
            else
            {
                callback(err, "Unable to read file at " + tempFileLocation);
            }

        });
    };
    const textFileParser = function (filePath){
        const fs = require("fs");
        fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) throw err;
            stream.write(data);
        });
    };

    const dataParsers = {
        "xls" : xlsFileParser,
        "xlsx" : xlsFileParser,
        "csv" : csvFileParser,
        "txt" : textFileParser,
        "log" : textFileParser,
        "xml" : textFileParser
    };

    async.waterfall([
        function(callback)
        {
            if(tempFileLocation)
            {
                callback(null, tempFileLocation);
            }
            else
            {
                self.writeToTempFile(callback);
            }
        },
        function(location, callback)
        {
            const parser = Config.dataStoreCompatibleExtensions[self.nie.fileExtension];
            if(!isNull(parser))
            {
                parser(location, function (err, dataContent)
                {
                    if(deleteFileAfterExtracting)
                    {
                        deleteTempFile(location);
                    }

                    callback(err, dataContent);
                });
            }
            else
            {
                callback(null, "There is no data parser for this format file : " + self.nie.fileExtension);
            }
        },
        function(dataContent, callback)
        {
            callback(null, dataContent);
        }
    ], function(err, res){
        callback(err, res);
    });
};

File.prototype.extract_text = function (callback) {
    let self = this;

    if (!isNull(Config.indexableFileExtensions[self.ddr.fileExtension])) {
        self.writeToTempFile(function (err, locationOfTempFile) {
            const textract = require('textract');
            textract.fromFileWithPath(locationOfTempFile, function (err, textContent) {

                //delete temporary file, we are done with it
                const fs = require("fs");
                fs.unlink(locationOfTempFile, function (err) {
                    if (err) {
                        console.log("Error deleting file " + locationOfTempFile);
                    }
                    else {
                        //console.log("successfully deleted " + locationOfTempFile);
                    }
                });

                if (isNull(err)) {
                    return callback(null, textContent);
                }
                else {
                    return callback(1, err);
                }
            });
        });
    }
    else {
        return callback(null, null);
    }
};

File.prototype.connectToMongo = function (callback) {
    const MongoClient = require('mongodb').MongoClient;
    const url = 'mongodb://' + Config.mongoDBHost + ':' + Config.mongoDbPort + '/' + Config.mongoDbCollectionName;
    MongoClient.connect(url, function (err, db) {
        if (isNull(err)) {
            console.log("Connected successfully to MongoDB");
            return callback(null, db);
        }
        else {
            const msg = 'Error connecting to MongoDB';
            return callback(true, msg);
        }
    });
};

File.prototype.findFileInMongo = function (db, callback) {
    const collection = db.collection('fs.files');
    collection.find({filename: this.uri}).toArray(function (err, files) {

        if (Config.debug.files.log_file_version_fetches) {
            console.log("Found the following Files");
            console.log(files);
        }

        if (isNull(err)) {
            return callback(null, files);
        }
        else {
            const msg = 'Error findind document with uri: ' + this.uri + ' in Mongo';
            return callback(true, msg);
        }
    });
};

File.prototype.loadMetadata = function (node, callback, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes) {
    const self = this;
    if (!isNull(node)) {
        const metadata = node.metadata;
        if (!isNull(metadata) && metadata instanceof Array) {
            var descriptors = [];
            for (let i = 0; i < metadata.length; i++) {
                descriptors.push(
                    new Descriptor(
                        metadata[i]
                    )
                );
            }
        }

        self.replaceDescriptors(descriptors, excludedDescriptorTypes, exceptionedDescriptorTypes);

        self.save(function (err, result) {
            if (isNull(err)) {
                return callback(null, result);
            }
            else {
                return callback(err, result);
            }

        }, true, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
    }
    else {
        return callback(1, "Cannot load metadata from an empty node.");
    }
};

File.prototype.generateThumbnails = function (callback) {
    let self = this;

    const generateThumbnail = function (localFile, ownerProject, sizeTag, cb) {
        let easyimg = require('easyimage');
        const fileName = path.basename(localFile, path.extname(localFile));
        const parentDir = path.dirname(localFile);
        const thumbnailFile = path.join(parentDir, fileName + "_thumbnail_"+ sizeTag +"." + Config.thumbnails.thumbnail_format_extension);
        const fs = require("fs");

        easyimg.resize(
            {
                src: localFile,
                dst: thumbnailFile,
                width: Config.thumbnails.size_parameters[sizeTag].width,
                height: Config.thumbnails.size_parameters[sizeTag].height,
                x: 0,
                y: 0
            }).then(function (image) {
            console.log('Resized and cropped: ' + image.width + ' x ' + image.height);

            //TODO
            gfs.connection.put(
                self.uri + "?thumbnail&size=" + sizeTag,
                fs.createReadStream(thumbnailFile),
                function (err, result) {
                    if (!isNull(err)) {
                        const msg = "Error saving thumbnail file in GridFS :" + result + " when generating " + sizeTag + " size thumbnail for file " + self.uri;
                        console.error(msg);
                        cb(err, msg);
                    }
                    else {
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
            .catch(function (err) {
                return callback(err, +"Error saving thumbnail for file " + self.uri + " . \nCheck that you have the xpdf ghostscript-x tesseract-ocr imagemagick dependencies installed in the server.\nIf you are on a Mac, you need XQuartz and all other dependencies: run this command: brew cask install xquartz && brew install ghostscript xpdf tesseract imagemagick" + err);
            });
    };

    self.getOwnerProject(function (err, project) {
        if (isNull(err)) {
            if (!isNull(Config.thumbnailableExtensions[self.ddr.fileExtension])) {
                self.writeToTempFile(function (err, tempFileAbsPath) {
                    if (isNull(err)) {
                        async.map(Config.thumbnails.sizes, function (thumbnailSize, callback) {
                                generateThumbnail(tempFileAbsPath, project.uri, thumbnailSize, callback);
                            },
                            function (err, results) {
                                if (isNull(err)) {
                                    return callback(null, null);
                                }
                                else {
                                    return callback(err, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + JSON.stringify(results));
                                }
                            });
                    }
                    else {
                        return callback(1, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + tempFileAbsPath);
                    }
                });
            }
            else {
                return callback(null, "Nothing to be done for this file, since " + self.ddr.fileExtension + " is not a thumbnailable extension.");
            }
        }
        else {
            return callback(null, "Unable to retrieve owner project of " + self.uri + " for thumbnail generation.");
        }
    });
};

File = Class.extend(File, InformationElement, "nfo:FileDataObject");

module.exports.File = File;
