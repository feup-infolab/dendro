//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

var Config = function() { return GLOBAL.Config; }();
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();
var path = require('path');
var async = require('async');

function File (object)
{
    File.baseConstructor.call(this, object);
    var self = this;

    if(self.uri == null)
    {
        if(object.uri == null && object.nie != null)
        {
            self.uri = object.nie.isLogicalPartOf +  path.sep + object.nie.title;
        }
        else
        {
            self.uri = object.uri;
        }
    }

    if(object.nie != null)
    {
        self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        self.nie.title = object.nie.title;
    }

    self.rdf.type = File.prefixedRDFType;

    var re = /(?:\.([^.]+))?$/;
    var ext = re.exec(self.nie.title)[1];   // "txt"

    if(ext == null)
    {
        self.ddr.fileExtension = "default";
    }
    else
    {
        self.ddr.fileExtension = ext;
    }

    return self;
}

File.prototype.save = function(callback)
{
    var self = this;

    var newDescriptorsOfParent = [
        new Descriptor({
            prefixedForm : "nie:hasLogicalPart",
            value : self.uri
        })
    ];

    self.extract_text(function(err, text)
    {
        if(!err)
        {
            if(text != null)
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
                if(err == null)
                {
                    var objectOfParentClass = new self.baseConstructor(self);

                    objectOfParentClass.save(
                        function(err, result)
                        {
                            if(err == null)
                            {
                                callback(null, self);
                            }
                            else
                            {
                                console.error("Error adding child file descriptors : " + result);
                                callback(1, "Error adding child file descriptors : " + result);
                            }
                        }
                    );
                }
                else
                {
                    console.error("Error adding parent file descriptors : " + result);
                    callback(1, "Error adding parent file descriptors: " + result);
                }
            }
        );
    });
};

File.prototype.deleteThumbnails = function()
{
    var self = this;
    if(Config.thumbnailableExtensions[self.ddr.fileExtension] != null)
    {
        for(var i = 0; i < Config.thumbnails.sizes.length; i++)
        {
            var dimension = Config.thumbnails.sizes[i];
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
    var self = this;

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
                            callback(err, result);
                        });
                    }
                    else
                    {
                        callback(err, "Error unlinking file " + self.uri + " from its parent. Error reported : " + result);
                    }
                });
            }
            else
            {
                callback(err, "Error clearing descriptors for deleting file " + self.uri + ". Error reported : " + result);
            }
        });
    }
    else
    {
        self.ddr.deleted = true;

        self.save(function(err, result){
            callback(err, result);
        }, true, uriOfUserDeletingTheFile);
    }
};

File.prototype.undelete = function(callback, uriOfUserUnDeletingTheFile)
{
    var self = this;
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
            callback(null, self);
        }
        else
        {
            callback(err, result);
        }
    }, true, uriOfUserUnDeletingTheFile);
};

File.prototype.saveIntoFolder = function(destinationFolderAbsPath, includeMetadata, includeTempFileLocations, includeOriginalNodes, callback)
{
    var self = this;
    var fs = require('fs');

    fs.exists(destinationFolderAbsPath, function(exists){
        if(!exists)
        {
            callback(1, "Destination Folder :" + destinationFolderAbsPath + " does not exist .");
        }
        else
        {
            var fs = require('fs');
            var tempFilePath = destinationFolderAbsPath + path.sep + self.nie.title;

            var writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri, writeStream, function(err, result){
                if(!err)
                {
                    callback(0, tempFilePath);
                }
                else
                {
                    callback(1, result);
                }
            });
        }
    });
}

File.prototype.writeToTempFile = function(callback)
{
    var self = this;
    var tmp = require('tmp');

    var fetchMetadataCallback = function (err, tempFolderPath) {
        if (!err)
        {
            var writeToFileCallback = function(callback)
            {
                if(!err)
                {
                    var tempFilePath = tempFolderPath + path.sep + self.nie.title;

                    console.log("Temp file location: " + tempFilePath);

                    var fs = require('fs');
                    var writeStream = fs.createWriteStream(tempFilePath);
                    gfs.connection.get(self.uri, writeStream, function(err, result){
                        if(!err)
                        {
                            callback(0, tempFilePath);
                        }
                        else
                        {
                            callback(1, result);
                        }
                    });
                }
                else
                {
                    callback(1, err);
                }
            };

            if(self.nie.title == null)
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
            callback(1, err);
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
    var self = this;
    var tmp = require('tmp');
    var fs = require('fs');

    if(size == null)
    {
        size = Config.thumbnails.size_parameters.icon.description;
    }

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tempFolderPath){

            var tempFilePath = tempFolderPath + path.sep + path.basename(self.nie.title) + "_thumbnail_" + size + path.extname(self.nie.title);
            var writeStream = fs.createWriteStream(tempFilePath);
            gfs.connection.get(self.uri + "?thumbnail&size=" + size, writeStream, function(err, result){
                if(!err)
                {
                    console.log("Thumbnail temp file location: " + tempFilePath);
                    callback(0, tempFilePath);
                }
                else
                {
                    if(err == 404)
                    {
                        //try to regenerate thumbnails, fire and forget
                        self.generateThumbnails(function(){});
                    }

                    callback(1, result);
                }
            });
        });
}

File.prototype.loadFromLocalFile = function(localFile, callback)
{
    var self = this;
    var tmp = require('tmp');
    var fs = require('fs');

    var ownerProject = self.getOwnerProjectFromUri();

    /**SAVE FILE**/
    gfs.connection.put(
        self.uri,
        fs.createReadStream(localFile),
        function(err, result)
        {
            if(err == null)
            {
                callback(null, self);
            }
            else
            {
                console.log("Error [" + err + "] saving file in GridFS :" + result);
                callback(err, result);
            }

        },
        {
            project : ownerProject,
            type : "nie:File"
        }
    );
};

File.prototype.extract_text = function(callback)
{
    var self = this;

    if(Config.indexableFileExtensions[self.ddr.fileExtension] != null)
    {
        self.writeToTempFile(function(err, locationOfTempFile)
        {
            var textract = require('textract');
            textract(locationOfTempFile, function(err, textContent){
                if(!err)
                {
                    callback(null, textContent);
                }
                else
                {
                    callback(1, err);
                }

                //delete temporary file, we are done with it
                var fs = require('fs');
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
            });
        });
    }
    else
    {
        callback(null, null);
    }
}

File.estimateUnzippedSize = function(pathOfZipFile, callback)
{
    var path = require('path');
    var exec = require('child_process').exec;

    var command = 'unzip -l ' + pathOfZipFile + " | tail -n 1";
    var parentFolderPath = path.resolve(pathOfZipFile, "..");


    exec(command, {cwd : parentFolderPath},  function (error, stdout, stderr) {
        if(!error)
        {
            var regex = new RegExp(" *[0-9]* [0-9]* file[s]?");

            var size = stdout.replace(regex, "");
            size = size.replace(/ /g, "");
            size = size.replace(/\n/g, "");
            console.log("Estimated unzipped file size is " + size);
            callback(null, Number.parseInt(size));

        } else {
            var errorMessage = "[INFO] There was an error estimating unzipped file size with command "+ command +". Code Returned by Zip Command " + JSON.stringify(error);
            console.error(errorMessage);
            callback(1, errorMessage);
        }
    });
}

/**
 * unzip a file into a directory
 * @param pathOfFile absolute path of file to be unzipped
 * @param callback
 */
File.unzip = function(pathOfFolder, callback) {
    var fs = require('fs');
    var exec = require('child_process').exec;
    var tmp = require('tmp');

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tmpFolderPath)
        {
            if(!err)
            {
                var command = 'unzip -qq -o ' + pathOfFolder;

                var unzip = exec(command, {cwd : tmpFolderPath},  function (error, stdout, stderr) {
                    if(!error)
                    {
                        console.log("Contents are in folder " + tmpFolderPath);
                        callback(null, tmpFolderPath);

                    } else {
                        var errorMessage = "[INFO] There was an error unzipping file with command "+ command +" on folder " + tmpFolderPath +". Code Returned by Zip Command " + JSON.stringify(error);
                        console.error(errorMessage);
                        callback(1, tmpFolderPath);
                    }
                });
            }
            else
            {
                var errorMessage = "Error unzipping the backup file with command "+ command +" on folder " + tmpFolderPath +". Code Returned by Zip Command " + JSON.stringify(tmpFolderPath);
                console.error(errorMessage);
                callback(1, errorMessage);
            }

        }
    );
};

File.prototype.connectToMongo = function (callback) {
    var MongoClient = require('mongodb').MongoClient;
    var url = 'mongodb://'+Config.mongoDBHost+':'+Config.mongoDbPort+'/'+Config.mongoDbCollectionName;
    MongoClient.connect(url, function(err, db) {
        if(!err)
        {
            console.log("Connected successfully to MongoDB");
            callback(null, db);
        }
        else
        {
            var msg = 'Error connecting to MongoDB';
            callback(true, msg);
        }
    });
};

File.prototype.findFileInMongo = function (db, callback) {
    var collection = db.collection('fs.files');
    collection.find({filename: this.uri}).toArray(function(err, files) {

        if(Config.debug.files.log_file_version_fetches)
        {
            console.log("Found the following Files");
            console.log(files);
        }

        if(!err)
        {
            callback(null, files);
        }
        else
        {
            var msg = 'Error findind document with uri: ' + this.uri + ' in Mongo';
            callback(true, msg);
        }
    });
};

File.prototype.loadMetadata = function(node, callback, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    var self = this;
    if(node != null)
    {
        var metadata = node.metadata;
        if(metadata != null && metadata instanceof Array)
        {
            var descriptors = [];
            for(var i = 0; i < metadata.length; i++)
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
                callback(null, result);
            }
            else
            {
                callback(err, result);
            }

        }, true, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
    }
    else
    {
        callback(1, "Cannot load metadata from an empty node.");
    }
};

File.rdfType = "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject";

File.prototype.generateThumbnails = function(callback)
{
    var self = this;

    var generateThumbnail = function(localFile, ownerProject, sizeTag, cb)
    {
        var easyimg = require('easyimage');
        var fileName = path.basename(localFile, path.extname(localFile));
        var parentDir = path.dirname(localFile);
        var thumbnailFile = path.join(parentDir, fileName + "_thumbnail_"+ sizeTag +"." + Config.thumbnails.thumbnail_format_extension);
        var fs = require('fs');

        easyimg.resize(
            {
                src:localFile,
                dst: thumbnailFile,
                width: Config.thumbnails.size_parameters[sizeTag].width,
                height: Config.thumbnails.size_parameters[sizeTag].height,
                x: 0,
                y: 0
            },
            function(err, image) {
                if(!err)
                {
                    console.log('Resized and cropped: ' + image.width + ' x ' + image.height);

                    gfs.connection.put(
                            self.uri + "?thumbnail&size=" + sizeTag,
                        fs.createReadStream(thumbnailFile),
                        function(err, result)
                        {
                            if(err != null)
                            {
                                var msg = "Error saving thumbnail file in GridFS :" + result + " when generating " + sizeTag + " size thumbnail for file " + self.uri;
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
                }
                else
                {
                    callback(err,  + "Error saving thumbnail for file " + self.uri + " . \nCheck that you have the xpdf ghostscript-x tesseract-ocr dependencies installed in the server." + image);
                }
            }
        );
    };

    self.getOwnerProject(function(err, project){
        if(!err)
        {
            if(Config.thumbnailableExtensions[self.ddr.fileExtension] != null)
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
                                    callback(null, null);
                                }
                                else
                                {
                                    callback(err, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + JSON.stringify(results));
                                }
                            });
                    }
                    else
                    {
                        callback(1, "Error generating thumbnail for file " + self.uri + ". Errors reported by generator : " + tempFileAbsPath);
                    }
                });
            }
            else
            {
                callback(null, "Nothing to be done for this file, since " + self.ddr.fileExtension + " is not a thumbnailable extension.");
            }
        }
        else
        {
            callback(null, "Unable to retrieve owner project of " + self.uri + " for thumbnail generation.");
        }
    });
};

File.createBlankTempFile = function(fileName, callback)
{
    var tmp = require('tmp');
    var path = require('path');

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tempFolderAbsPath)
        {
            var tempFilePath = path.join(tempFolderAbsPath, fileName);

            if(!err)
            {
                console.log("Temp File Created! Location: " + tempFilePath);
            }
            else
            {
                console.error("Error creating temp file : " + tempFolderAbsPath);
            }

            callback(err, tempFilePath);
        }
    );
};

File.createBlankFileRelativeToAppRoot = function(relativePathToFile, callback)
{
    var fs = require('fs');
    
    var absPathToFile = Config.absPathInApp(relativePathToFile);
    var parentFolder = path.resolve(absPathToFile, "..");

    fs.stat(absPathToFile, function(err, stat) {
        if(err == null) {
            callback(0, absPathToFile, parentFolder);
        } else if(err.code == 'ENOENT') {
            // file does not exist
            var mkpath = require('mkpath');

            mkpath(parentFolder, function (err) {
                if (err)
                {
                    callback(1, "Error creating file " + err);
                }
                else
                {
                    var fs = require("fs");
                    fs.open(absPathToFile, "wx", function (err, fd) {
                        // handle error
                        fs.close(fd, function (err) {
                            console.log('Directory structure ' + parentFolder + ' created. File ' + absPathToFile + " also created.");
                            callback(0, absPathToFile, parentFolder);
                        });
                    });
                }
            });
        }
        else
        {
            callback(1, "Error creating file " + err);
        }
    });
};

File.deleteOnLocalFileSystem = function(err, callback)
{
    var exec = require('child_process').exec;
    var command = "rm absPath";
    var rm = exec(command, {}, function (error, stdout, stderr)
    {
        callback(error, stdout, stderr);
    });
}

File.prefixedRDFType = "nfo:FileDataObject";

File = Class.extend(File, InformationElement);

module.exports.File = File;
