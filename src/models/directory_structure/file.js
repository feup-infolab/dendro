//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();
const path = require('path');
const async = require('async');

function File (object)
{
    File.baseConstructor.call(this, object);
    const self = this;

    if(isNull(self.uri))
    {
        const uuid = require('uuid');
        self.uri = "/r/file/" + uuid.v4();
    }

    if(!isNull(object.nie))
    {
        self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        self.nie.title = object.nie.title;

        if(isNull(self.ddr.humanReadableURI))
        {
            self.ddr.humanReadableURI = object.nie.isLogicalPartOf +  "/" + object.nie.title;
        }
    }

    self.rdf.type = File.prefixedRDFType;

    const re = /(?:\.([^.]+))?$/;
    let ext = re.exec(self.nie.title)[1];   // "txt"

    if(isNull(ext))
    {
        self.ddr.fileExtension = "default";
    }
    else
    {
        let getClassNameForExtension = require('font-awesome-filetypes').getClassNameForExtension;
        self.ddr.fileExtension = ext;
        self.ddr.hasFontAwesomeClass = getClassNameForExtension(ext);
    }

    return self;
}

File.prototype.save = function(callback)
{
    const self = this;

    const newDescriptorsOfParent = [
        new Descriptor({
            prefixedForm: "nie:hasLogicalPart",
            value: self.uri
        })
    ];

    self.extract_text(function(err, text)
    {
        if(!err)
        {
            if(!isNull(text))
            {
                self.ddr.text_content = text;
            }
            else
            {
                delete self.ddr.text_content;
            }
        }

        db.connection.insertDescriptorsForSubject(
            self.nie.isLogicalPartOf,
            newDescriptorsOfParent,
            db.graphUri,
            function(err, result)
            {
                if(isNull(err))
                {
                    const objectOfParentClass = new self.baseConstructor(self);

                    objectOfParentClass.save(
                        function(err, result)
                        {
                            if(isNull(err))
                            {
                                return callback(null, self);
                            }
                            else
                            {
                                console.error("Error adding child file descriptors : " + result);
                                return callback(1, "Error adding child file descriptors : " + result);
                            }
                        }
                    );
                }
                else
                {
                    console.error("Error adding parent file descriptors : " + result);
                    return callback(1, "Error adding parent file descriptors: " + result);
                }
            }
        );
    });
};

File.prototype.deleteThumbnails = function()
{
    const self = this;
    if(!isNull(Config.thumbnailableExtensions[self.ddr.fileExtension]))
    {
        for(let i = 0; i < Config.thumbnails.sizes.length; i++)
        {
            const dimension = Config.thumbnails.sizes[i];
            if (Config.thumbnails.size_parameters.hasOwnProperty(dimension)) {
                gfs.connection.delete(self.uri + "?thumbnail&size=" + dimension, function(err, result){
                    if(err)
                    {
                        console.error("Error deleting thumbnail " + self.uri + "?thumbnail&size=" + dimension);
                    }
                });
            }
        }
    }
};

File.prototype.delete = function(callback, uriOfUserDeletingTheFile, reallyDelete)
{
    const self = this;

    if(self.ddr.deleted && reallyDelete)
    {
        self.deleteAllMyTriples(function(err, result){
            if(!err)
            {
                self.unlinkFromParent(function(err, result){
                    if(!err)
                    {
                        gfs.connection.delete(self.uri, function(err, result)
                        {
                            self.deleteThumbnails();
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

        self.save(function(err, result){
            return callback(err, result);
        }, true, uriOfUserDeletingTheFile);
    }
};

File.prototype.undelete = function(callback, uriOfUserUnDeletingTheFile)
{
    const self = this;
    self.updateDescriptors(
        [
            new Descriptor({
                prefixedForm : "ddr:deleted",
                value : null
            })
        ]
    );

    self.save(function(err, result){
        if(!err)
        {
            return callback(null, self);
        }
        else
        {
            return callback(err, result);
        }
    }, true, uriOfUserUnDeletingTheFile);
};

File.prototype.saveIntoFolder = function(destinationFolderAbsPath, includeMetadata, includeTempFileLocations, includeOriginalNodes, callback)
{
    const self = this;
    const fs = require('fs');

    fs.exists(destinationFolderAbsPath, function(exists){
        if(!exists)
        {
            return callback(1, "Destination Folder :" + destinationFolderAbsPath + " does not exist .");
        }
        else
        {
            const fs = require('fs');
            const tempFilePath = destinationFolderAbsPath + path.sep + self.nie.title;

            const writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri, writeStream, function(err, result){
                if(!err)
                {
                    return callback(0, tempFilePath);
                }
                else
                {
                    return callback(1, result);
                }
            });
        }
    });
};

File.prototype.writeToTempFile = function(callback)
{
    let self = this;
    const tmp = require('tmp');

    let fetchMetadataCallback = function (err, tempFolderPath) {
        if (!err)
        {
            let writeToFileCallback = function(callback)
            {
                const tempFilePath = tempFolderPath + path.sep + self.nie.title;

                console.log("Temp file location: " + tempFilePath);

                const fs = require('fs');
                const writeStream = fs.createWriteStream(tempFilePath);
                gfs.connection.get(self.uri, writeStream, function(err, result){
                    if(!err)
                    {
                        return callback(null, tempFilePath);
                    }
                    else
                    {
                        return callback(1, result);
                    }
                });
            };

            if(isNull(self.nie.title))
            {
                self.findByUri(function(err)
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
            dir : Config.tempFilesDir
        },
        fetchMetadataCallback);
};

File.prototype.getThumbnail = function(size, callback)
{
    let self = this;
    const tmp = require('tmp');
    const fs = require('fs');

    if(isNull(size))
    {
        size = Config.thumbnails.size_parameters.icon.description;
    }

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tempFolderPath){

            const tempFilePath = tempFolderPath + path.sep + path.basename(self.nie.title) + "_thumbnail_" + size + path.extname(self.nie.title);
            let writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri + "?thumbnail&size=" + size, writeStream, function(err, result){
                if(err === 404)
                {
                    //try to regenerate thumbnails, fire and forget
                    self.generateThumbnails(function(err, result){
                        return callback(0, Config.absPathInPublicFolder("images/icons/extensions/file_generating_thumbnail.png"));
                    })
                }
                else if(!err)
                {
                    console.log("Thumbnail temp file location: " + tempFilePath);
                    return callback(0, tempFilePath);
                }
                else
                {
                    return callback(1, result);
                }
            });
        });
};

File.prototype.loadFromLocalFile = function(localFile, callback)
{
    const self = this;
    const tmp = require('tmp');
    const fs = require('fs');

    self.getOwnerProject(function(err, ownerProject){
        if(isNull && project instanceof Project)
        {
            /**SAVE FILE**/
            gfs.connection.put(
                self.uri,
                fs.createReadStream(localFile),
                function(err, result)
                {
                    if(isNull(err))
                    {
                        return callback(null, self);
                    }
                    else
                    {
                        console.log("Error [" + err + "] saving file in GridFS :" + result);
                        return callback(err, result);
                    }

                },
                {
                    project : ownerProject,
                    type : "nie:File"
                }
            );
        }
        else
        {
            callback(err, ownerProject);
        }
    });


};

File.prototype.extract_text = function(callback)
{
    let self = this;

    if(!isNull(Config.indexableFileExtensions[self.ddr.fileExtension]))
    {
        self.writeToTempFile(function(err, locationOfTempFile)
        {
            const textract = require('textract');
            textract.fromFileWithPath(locationOfTempFile, function(err, textContent){

                //delete temporary file, we are done with it
                const fs = require('fs');
                fs.unlink(locationOfTempFile, function (err) {
                    if (err)
                    {
                        console.log("Error deleting file " + locationOfTempFile);
                    }
                    else
                    {
                        console.log("successfully deleted " + locationOfTempFile);
                    }
                });
                
                if(!err)
                {
                    return callback(null, textContent);
                }
                else
                {
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

File.estimateUnzippedSize = function(pathOfZipFile, callback)
{
    const path = require('path');
    const exec = require('child_process').exec;

    const command = 'unzip -l ' + pathOfZipFile + " | tail -n 1";
    const parentFolderPath = path.resolve(pathOfZipFile, "..");


    exec(command, {cwd : parentFolderPath},  function (error, stdout, stderr) {
        if(!error)
        {
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
    const fs = require('fs');
    const exec = require('child_process').exec;
    const tmp = require('tmp');

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tmpFolderPath)
        {
            if(!err)
            {
                var command = 'unzip -qq -o ' + pathOfFile;

                const unzip = exec(command, {cwd: tmpFolderPath}, function (error, stdout, stderr) {
                    if (!error) {
                        console.log("Contents are in folder " + tmpFolderPath);
                        return callback(null, tmpFolderPath);

                    } else {
                        const errorMessage = "[INFO] There was an error unzipping file with command " + command + " on folder " + tmpFolderPath + ". Code Returned by Zip Command " + JSON.stringify(error);
                        console.error(errorMessage);
                        return callback(1, tmpFolderPath);
                    }
                });
            }
            else
            {
                const errorMessage = "Error unzipping the backup file with command "+ command +" on folder " + tmpFolderPath +". Code Returned by Zip Command " + JSON.stringify(tmpFolderPath);
                console.error(errorMessage);
                return callback(1, errorMessage);
            }

        }
    );
};

File.prototype.connectToMongo = function (callback) {
    const MongoClient = require('mongodb').MongoClient;
    const url = 'mongodb://' + Config.mongoDBHost + ':' + Config.mongoDbPort + '/' + Config.mongoDbCollectionName;
    MongoClient.connect(url, function(err, db) {
        if(!err)
        {
            console.log("Connected successfully to MongoDB");
            return callback(null, db);
        }
        else
        {
            const msg = 'Error connecting to MongoDB';
            return callback(true, msg);
        }
    });
};

File.prototype.findFileInMongo = function (db, callback) {
    const collection = db.collection('fs.files');
    collection.find({filename: this.uri}).toArray(function(err, files) {

        if(Config.debug.files.log_file_version_fetches)
        {
            console.log("Found the following Files");
            console.log(files);
        }

        if(!err)
        {
            return callback(null, files);
        }
        else
        {
            const msg = 'Error findind document with uri: ' + this.uri + ' in Mongo';
            return callback(true, msg);
        }
    });
};

File.prototype.loadMetadata = function(node, callback, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    const self = this;
    if(!isNull(node))
    {
        const metadata = node.metadata;
        if(!isNull(metadata) && metadata instanceof Array)
        {
            var descriptors = [];
            for(let i = 0; i < metadata.length; i++)
            {
                descriptors.push(
                    new Descriptor(
                        metadata[i]
                    )
                );
            }
        }

        self.replaceDescriptors(descriptors, excludedDescriptorTypes, exceptionedDescriptorTypes);

        self.save(function(err, result){
            if(!err)
            {
                return callback(null, result);
            }
            else
            {
                return callback(err, result);
            }

        }, true, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
    }
    else
    {
        return callback(1, "Cannot load metadata from an empty node.");
    }
};

File.rdfType = "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject";

File.prototype.generateThumbnails = function(callback)
{
    let self = this;

    const generateThumbnail = function(localFile, ownerProject, sizeTag, cb)
    {
        let easyimg = require('easyimage');
        const fileName = path.basename(localFile, path.extname(localFile));
        const parentDir = path.dirname(localFile);
        const thumbnailFile = path.join(parentDir, fileName + "_thumbnail_"+ sizeTag +"." + Config.thumbnails.thumbnail_format_extension);
        const fs = require('fs');

        easyimg.resize(
            {
                src:localFile,
                dst: thumbnailFile,
                width: Config.thumbnails.size_parameters[sizeTag].width,
                height: Config.thumbnails.size_parameters[sizeTag].height,
                x: 0,
                y: 0
            }).then(function(image) {
                console.log('Resized and cropped: ' + image.width + ' x ' + image.height);

                gfs.connection.put(
                        self.uri + "?thumbnail&size=" + sizeTag,
                    fs.createReadStream(thumbnailFile),
                    function(err, result)
                    {
                        if(!isNull(err))
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
                        project : ownerProject,
                        type : "nie:File",
                        thumbnail : true,
                        thumbnailOf : self.uri,
                        size : sizeTag
                    }
                );
            })
            .catch(function(err){
                return callback(err,  + "Error saving thumbnail for file " + self.uri + " . \nCheck that you have the xpdf ghostscript-x tesseract-ocr dependencies installed in the server." + err);
            });
    };

    self.getOwnerProject(function(err, project){
        if(!err)
        {
            if(!isNull(Config.thumbnailableExtensions[self.ddr.fileExtension]))
            {
                self.writeToTempFile(function(err, tempFileAbsPath){
                    if(!err)
                    {
                        async.map(Config.thumbnails.sizes, function(thumbnailSize, callback){
                                generateThumbnail(tempFileAbsPath, project.uri, thumbnailSize, callback);
                            },
                            function(err, results){
                                if(!err)
                                {
                                    return callback(null, null);
                                }
                                else
                                {
                                    return callback(err, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + JSON.stringify(results));
                                }
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
};

File.createBlankTempFile = function(fileName, callback)
{
    const tmp = require('tmp');
    const path = require('path');

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tempFolderAbsPath)
        {
            const tempFilePath = path.join(tempFolderAbsPath, fileName);

            if(!err)
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

File.createBlankFileRelativeToAppRoot = function(relativePathToFile, callback)
{
    const fs = require('fs');
    
    const absPathToFile = Config.absPathInApp(relativePathToFile);
    const parentFolder = path.resolve(absPathToFile, "..");

    fs.stat(absPathToFile, function(err, stat) {
        if(isNull(err)) {
            return callback(0, absPathToFile, parentFolder);
        } else if(err.code === 'ENOENT') {
            // file does not exist
            const mkpath = require('mkpath');

            mkpath(parentFolder, function (err) {
                if (err)
                {
                    return callback(1, "Error creating file " + err);
                }
                else
                {
                    const fs = require("fs");
                    fs.open(absPathToFile, "wx", function (err, fd) {
                        // handle error
                        fs.close(fd, function (err) {
                            console.log('Directory structure ' + parentFolder + ' created. File ' + absPathToFile + " also created.");
                            return callback(0, absPathToFile, parentFolder);
                        });
                    });
                }
            });
        }
        else
        {
            return callback(1, "Error creating file " + err);
        }
    });
};

File.deleteOnLocalFileSystem = function(err, callback)
{
    const exec = require('child_process').exec;
    const command = "rm absPath";
    const rm = exec(command, {}, function (error, stdout, stderr) {
        return callback(error, stdout, stderr);
    });
};

File.prefixedRDFType = "nfo:FileDataObject";

File = Class.extend(File, InformationElement);

module.exports.File = File;
