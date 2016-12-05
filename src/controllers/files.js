var Config = require('../models/meta/config.js').Config;

var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var FileVersions = require(Config.absPathInSrcFolder("/models/versions/file_versions.js")).FileVersions;
var MongoClient = require('mongodb').MongoClient;
var async = require('async');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

exports.download = function(req, res){
    var self = this;
    var requestedResourceURI = req.params.requestedResource;
    var filePath = req.params.filepath;

    var downloadFolder = function(requestedResourceURI, res)
    {
        Folder.findByUri(requestedResourceURI, function(err, folderToDownload)
        {
            if(!err)
            {
                var mimeType = File.mimeTypes["zip"];
                var fileName = folderToDownload.nie.title + ".zip";

                res.writeHead(200,
                    {
                        'Content-disposition': 'attachment; filename="' + fileName+"\"",
                        'Content-Type': mimeType
                    }
                );

                var includeMetadata = (req.query.backup != null);
                var bagIt = (req.query.bagit != null);

                var async = require('async');

                async.series([
                    function(cb)
                    {
                        if(bagIt)
                        {
                            var bagitOptions = {
                                cryptoMethod: 'sha256'
                            };

                            folderToDownload.bagit(bagitOptions, function(err, result, absolutePathOfFinishedFolder, parentFolderPath)
                            {
                                var path = require('path');

                                var finishedZipFileName = "bagit_backup.zip";
                                var finishedZipFileAbsPath = path.join(parentFolderPath, finishedZipFileName);

                                Folder.zip(absolutePathOfFinishedFolder, finishedZipFileAbsPath, function(err, zipFileFullPath){
                                    cb(err, zipFileFullPath);
                                }, finishedZipFileName, true);
                            });
                        }
                        else
                        {
                            folderToDownload.zipAndDownload(includeMetadata, function(err, writtenFilePath)
                            {
                                cb(err, writtenFilePath);
                            });
                        }
                    }
                ],
                function(err, results)
                {
                    if(!err)
                    {
                        if(results != null && results[0] != null)
                        {
                            var writtenFilePath = results[0];

                            var fs = require('fs');
                            var fileStream = fs.createReadStream(writtenFilePath);

                            res.on('end', function () {
                                File.deleteOnLocalFileSystem(writtenFilePath, function(err, stdout, stderr){
                                    if(err)
                                    {
                                        console.error("Unable to delete " + writtenFilePath);
                                    }
                                    else
                                    {
                                        console.log("Deleted " + writtenFilePath);
                                    }
                                });
                            });

                            fileStream.pipe(res);
                        }
                        else
                        {
                            var error = "There was an error attempting to fetch the requested resource : " + requestedResourceURI;
                            console.error(error);
                            res.write("500 Error : "+ error +"\n");
                            res.end();
                        }
                    }
                    else
                    {
                        if(err == 404)
                        {
                            var error = "There was already a prior attempt to delete this folder. The folder is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else
                        {
                            console.error("Unable to produce temporary file to download "+self.uri + " Error returned : " + writtenFilePath);
                        }

                    }
                });
            }
            else
            {
                var error = "Non-existent folder : " + requestedResourceURI;
                console.error(error);
                res.writeHead(404, error);
                res.end();
            }
        });
    }

    //we are fetching the root folder of a project
    if(filePath == null)
    {
        downloadFolder(requestedResourceURI, res);
    }
    else
    {
        InformationElement.getType(requestedResourceURI,
            function(err, type){
                if(!err)
                {
                    var path = require('path');
                    if(type == File)
                    {
                        File.findByUri(requestedResourceURI, function(err, file){
                            if(!err)
                            {
                                var mimeType = null;
                                if(File.mimeTypes.hasOwnProperty(file.ddr.fileExtension))
                                {
                                    mimeType = File.mimeTypes[file.ddr.fileExtension];
                                }
                                else
                                {
                                    mimeType = File.mimeTypes.default;
                                }

                                file.writeToTempFile(function(err, writtenFilePath)
                                {
                                    if(!err)
                                    {
                                        if(writtenFilePath != null)
                                        {
                                            var fs = require('fs');
                                            var fileStream = fs.createReadStream(writtenFilePath);

                                            res.writeHead(200,
                                                {
                                                    'Content-disposition': 'attachment; filename="' + file.nie.title+"\"",
                                                    'Content-type': mimeType
                                                });

                                            res.on('end', function () {
                                                Folder.deleteOnLocalFileSystem(writtenFilePath, function(err, stdout, stderr){
                                                    if(err)
                                                    {
                                                        console.error("Unable to delete " + writtenFilePath);
                                                    }
                                                    else
                                                    {
                                                        console.log("Deleted " + writtenFilePath);
                                                    }
                                                });
                                            });

                                            fileStream.pipe(res);
                                        }
                                        else
                                        {
                                            var error = "There was an error streaming the requested resource : " + requestedResourceURI;
                                            console.error(error);
                                            res.writeHead(500, error);
                                            res.end();
                                        }
                                    }
                                    else
                                    {
                                        if(err == 404)
                                        {
                                            var error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                                            console.error(error);
                                            res.writeHead(404, error);
                                            res.end();
                                        }
                                        else
                                        {
                                            var error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                                            console.error(error);
                                            res.writeHead(500, error);
                                            res.end();
                                        }
                                    }
                                });
                            }
                            else
                            {
                                var error = "Non-existent file : " + requestedResourceURI;
                                console.error(error);
                                res.writeHead(404, error);
                                res.end();
                            }
                        });
                    }
                    else if(type == Folder)
                    {
                        downloadFolder(requestedResourceURI, res);
                    }
                    else
                    {
                        var error = "Unable to determine the type of the requested resource : " + requestedResourceURI;
                        console.error(error);
                        res.write("500 Error : "+ error +"\n");
                        res.end();
                    }
                }
                else
                {
                    var error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + type;
                    console.error(error);
                    res.write("500 Error : "+ error +"\n");
                    res.end();
                }
            });
    }
};
/*
Used to serve some files in html like images, text files...
 */
exports.serve = function(req, res){
    var self = this;
    var requestedResourceURI = req.params.requestedResource;
    var filePath = req.params.filepath;

    var downloadFolder = function(requestedResourceURI, res)
    {
        Folder.findByUri(requestedResourceURI, function(err, folderToDownload)
        {
            if(!err)
            {
                var mimeType = File.mimeTypes["zip"];
                var fileName = folderToDownload.nie.title + ".zip";

                res.writeHead(200,
                    {
                        'Content-disposition': 'attachment; filename="' + fileName+"\"",
                        'Content-Type': mimeType
                    }
                );

                var includeMetadata = (req.query.backup != null);

                folderToDownload.zipAndDownload(includeMetadata, function(err, writtenFilePath)
                {
                    if(!err)
                    {
                        if(writtenFilePath != null)
                        {
                            var fs = require('fs');
                            var fileStream = fs.createReadStream(writtenFilePath);

                            res.on('end', function () {
                                Folder.deleteOnLocalFileSystem(parentFolderPath, function(err, stdout, stderr){
                                    if(err)
                                    {
                                        console.error("Unable to delete " + writtenFilePath);
                                    }
                                    else
                                    {
                                        console.log("Deleted " + writtenFilePath);
                                    }
                                });
                            });

                            fileStream.pipe(res);
                        }
                        else
                        {
                            var error = "There was an error attempting to fetch the requested resource : " + requestedResourceURI;
                            console.error(error);
                            res.write("500 Error : "+ error +"\n");
                            res.end();
                        }
                    }
                    else
                    {
                        if(err == 404)
                        {
                            var error = "There was already a prior attempt to delete this folder. The folder is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else
                        {
                            console.error("Unable to produce temporary file to download "+self.uri + " Error returned : " + writtenFilePath);
                        }

                    }
                });
            }
            else
            {
                var error = "Non-existent folder : " + requestedResourceURI;
                console.error(error);
                res.writeHead(404, error);
                res.end();
            }
        });
    }

    //we are fetching the root folder of a project
    if(filePath == null)
    {
        downloadFolder(requestedResourceURI, res);
    }
    else
    {
        InformationElement.getType(requestedResourceURI,
            function(err, type){
                if(!err)
                {
                    var path = require('path');
                    if(type == File)
                    {
                        File.findByUri(requestedResourceURI, function(err, file){
                            if(!err)
                            {
                                var mimeType = null;
                                if(File.mimeTypes.hasOwnProperty(file.ddr.fileExtension))
                                {
                                    mimeType = File.mimeTypes[file.ddr.fileExtension];
                                }
                                else
                                {
                                    mimeType = File.mimeTypes.default;
                                }

                                file.writeToTempFile(function(err, writtenFilePath)
                                {
                                    if(!err)
                                    {
                                        if(writtenFilePath != null)
                                        {
                                            var fs = require('fs');
                                            var fileStream = fs.createReadStream(writtenFilePath);

                                            res.writeHead(200,
                                                {
                                                    'Content-disposition': 'filename="' + file.nie.title+"\"",
                                                    'Content-type': mimeType
                                                });

                                            res.on('end', function () {
                                                Folder.deleteOnLocalFileSystem(parentFolderPath, function(err, stdout, stderr){
                                                    if(err)
                                                    {
                                                        console.error("Unable to delete " + parentFolderPath);
                                                    }
                                                    else
                                                    {
                                                        console.log("Deleted " + parentFolderPath);
                                                    }
                                                });
                                            });

                                            fileStream.pipe(res);
                                        }
                                        else
                                        {
                                            var error = "There was an error streaming the requested resource : " + requestedResourceURI;
                                            console.error(error);
                                            res.writeHead(500, error);
                                            res.end();
                                        }
                                    }
                                    else
                                    {
                                        if(err == 404)
                                        {
                                            var error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                                            console.error(error);
                                            res.writeHead(404, error);
                                            res.end();
                                        }
                                        else
                                        {
                                            var error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                                            console.error(error);
                                            res.writeHead(500, error);
                                            res.end();
                                        }
                                    }
                                });
                            }
                            else
                            {
                                var error = "Non-existent file : " + requestedResourceURI;
                                console.error(error);
                                res.writeHead(404, error);
                                res.end();
                            }
                        });
                    }
                    else if(type == Folder)
                    {
                        downloadFolder(requestedResourceURI, res);
                    }
                    else
                    {
                        var error = "Unable to determine the type of the requested resource : " + requestedResourceURI;
                        console.error(error);
                        res.write("500 Error : "+ error +"\n");
                        res.end();
                    }
                }
                else
                {
                    var error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + type;
                    console.error(error);
                    res.write("500 Error : "+ error +"\n");
                    res.end();
                }
            });
    }
};
exports.serve_base64 = function(req, res){
    var requestedResourceURI = req.params.requestedResource;

    InformationElement.getType(requestedResourceURI,
        function(err, type){
            if(!err)
            {
                var path = require('path');
                if(type == File)
                {
                    File.findByUri(requestedResourceURI, function(err, file){
                        if(!err)
                        {
                            var mimeType = null;
                            if(File.mimeTypes.hasOwnProperty(file.ddr.fileExtension))
                            {
                                mimeType = File.mimeTypes[file.ddr.fileExtension];
                            }
                            else
                            {
                                mimeType = File.mimeTypes.default;
                            }

                            file.writeToTempFile(function(err, writtenFilePath)
                            {
                                if(!err)
                                {
                                    if(writtenFilePath != null)
                                    {
                                        var fs = require('fs');
                                        var fileStream = fs.createReadStream(writtenFilePath);

                                        res.on('end', function(){
                                            console.log("close");
                                            deleteTempFile(writtenFilePath);
                                        });
                                        var base64 = require('base64-stream');

                                        res.on('end', function () {
                                            Folder.deleteOnLocalFileSystem(writtenFilePath, function(err, stdout, stderr){
                                                if(err)
                                                {
                                                    console.error("Unable to delete " + writtenFilePath);
                                                }
                                                else
                                                {
                                                    console.log("Deleted " + writtenFilePath);
                                                }
                                            });
                                        });

                                        fileStream.pipe(base64.encode()).pipe(res);
                                    }
                                    else
                                    {
                                        var error = "There was an error streaming the requested resource : " + requestedResourceURI;
                                        console.error(error);
                                        res.writeHead(500, error);
                                        res.end();
                                    }
                                }
                                else
                                {
                                    if(err == 404)
                                    {
                                        var error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                                        console.error(error);
                                        res.writeHead(404, error);
                                        res.end();
                                    }
                                    else
                                    {
                                        var error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                                        console.error(error);
                                        res.writeHead(500, error);
                                        res.end();
                                    }
                                }
                            });
                        }
                        else
                        {
                            var error = "Non-existent file : " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                    });
                }
                else if(type == Folder)
                {
                    var error = "Resource : " + requestedResourceURI + " is a folder and cannot be represented in Base64";
                    console.error(error);
                    res.write("500 Error : "+ error +"\n");
                    res.end();
                }
                else
                {
                    var error = "Unable to determine the type of the requested resource : " + requestedResourceURI;
                    console.error(error);
                    res.write("500 Error : "+ error +"\n");
                    res.end();
                }
            }
            else
            {
                var error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + type;
                console.error(error);
                res.write("500 Error : "+ error +"\n");
                res.end();
            }
        });

};
exports.get_thumbnail = function(req, res) {
    var requestedResourceURI = req.params.requestedResource;
    var size = req.query.size;

    File.findByUri(requestedResourceURI, function(err, file){
        if(!err)
        {
            var mimeType = null;
            if(File.mimeTypes.hasOwnProperty(file.ddr.fileExtension))
            {
                mimeType = File.mimeTypes[file.ddr.fileExtension];
            }
            else
            {
                mimeType = File.mimeTypes.default;
            }

            if(Config.thumbnailableExtensions[file.ddr.fileExtension] != null)
            {
                file.getThumbnail(size, function(err, writtenFilePath)
                {
                    if(!err)
                    {
                        if(writtenFilePath != null)
                        {
                            var fs = require('fs');
                            var path = require('path');
                            var fileStream = fs.createReadStream(writtenFilePath);
                            var filename = path.basename(writtenFilePath);

                            res.writeHead(200,
                                {
                                    'Content-disposition': 'filename="' + filename+"\"",
                                    'Content-type': mimeType
                                });

                            fileStream.pipe(res);
                        }
                        else
                        {
                            var error = "There was an error streaming the requested resource : " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }
                    }
                    else
                    {
                        if(err == 404)
                        {
                            var error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else
                        {
                            //try to regenerate thumbnails
                            file.generateThumbnails(function(err, result)
                            {
                                var error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                                console.error(error);
                            });

                            res.writeHead(404, error);
                            res.end();
                        }
                    }
                });
            }
            else
            {
                exports.serve_static(
                    req,
                    res,
                    Config.absPathInPublicFolder("/images/icons/extensions/file_extension_" + file.ddr.fileExtension + ".png"),
                    Config.absPathInPublicFolder("/images/icons/file.png"),
                    Config.cache.static.etag_cache_active
                );
            }
        }
        else
        {
            var error = "Non-existent file : " + requestedResourceURI;
            console.error(error);
            res.writeHead(404, error);
            res.end();
        }
    });
};

//Temp function
var connectToMongo = function (callback) {
    var MongoClient = require('mongodb').MongoClient;
    var url = 'mongodb://192.168.56.101:27017/dendro_data_dev';
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

var findFileInMongo = function (db, fileUri, callback) {
    var collection = db.collection('fs.files');
    collection.find({filename: fileUri}).toArray(function(err, files) {
        console.log("Found the following Files");
        console.log(files);
        if(!err)
        {
            callback(null, files);
        }
        else
        {
            var msg = 'Error findind document with uri: ' + fileUri + ' in Mongo';
            callback(true, msg);
        }
    });
};

exports.upload = function(req, res){
   if (req.originalMethod == "GET")
    {
        res.render('files/upload',
            {

            }
        );
    }
    else if (req.originalMethod == "POST")
    {
        var requestedResourceURI = req.params.requestedResource;
        var currentUserUri = req.session.user.uri;

        var processFiles = function()
        {
            var files = [];

            for(var i=0; i < req.files.files.length; i++)
            {
                var file = req.files.files[i];
                files[i] = {
                    name : file.name
                };

                var newFile = new File({
                    nie :
                    {
                        title : file.name,
                        isLogicalPartOf : requestedResourceURI
                    }
                });

                var fs = require('fs');

                newFile.loadFromLocalFile(file.path, function(err, result){
                    if(err == null)
                    {
                        newFile.save(function(err, result){
                            if(err == null)
                            {
                                console.log("File " + newFile.uri + " is now saved in GridFS");
                                //TODO get info from mongo for that fileUri
                                //TODO build a new file_versions for that file
                                connectToMongo(function (err, db) {
                                   if(!err)
                                   {
                                       findFileInMongo(db, newFile.uri, function (error, filesInfo) {
                                           if(!error)
                                           {
                                                console.log(filesInfo);
                                               //TODO check array length-> there is repeated files
                                               async.map(filesInfo, function (fileInfo, cb) {
                                                   console.log('FileinfoFromMongo: ', fileInfo);
                                                   var newFileVersion = new FileVersions({
                                                       nfo: {
                                                           fileName: fileInfo.filename,
                                                           hashValue: fileInfo.md5,
                                                           hashAlgorithm: 'md5'
                                                       },
                                                       nie: {
                                                           contentLastModified: fileInfo.uploadDate,
                                                           byteSize: fileInfo.length
                                                       },
                                                       ddr: {
                                                           contentType: fileInfo.contentType,
                                                           chunkSize: fileInfo.chunkSize,
                                                           projectUri: fileInfo.metadata.project,
                                                           itemType: fileInfo.metadata.type,
                                                           creatorUri: currentUserUri
                                                       }
                                                   });

                                                   newFileVersion.save(function (err, fileVersion) {
                                                       if(!err)
                                                       {
                                                           newFile.generateThumbnails(function(err, result){
                                                               if(!err)
                                                               {
                                                                   /*
                                                                   res.json({
                                                                       result : "success",
                                                                       message : "File submitted successfully. Message returned : " + result,
                                                                       files : files
                                                                   });*/
                                                                   cb(null, result);
                                                               }
                                                               else
                                                               {
                                                                   /*
                                                                   res.json({
                                                                       result : "success",
                                                                       message : "File submitted successfully. However, there was an error generating the thumbnails: " + result,
                                                                       files : files
                                                                   });
                                                                   */
                                                                   cb(true, result);
                                                               }
                                                           });
                                                       }
                                                       else
                                                       {
                                                           /*
                                                           res.status(500).json({
                                                               result : "error",
                                                               message : "Error saving file version",
                                                           });
                                                           */
                                                           cb(true, fileVersion);
                                                       }
                                                   }, false,null,null,null,null,db_social.graphUri)
                                               }, function (err, allFilesInfo) {
                                                   if(!err)
                                                   {
                                                       res.json({
                                                           result : "success",
                                                           message : "File submitted successfully",
                                                           files : files
                                                       });
                                                   }
                                                   else
                                                   {
                                                       var msg = "Error saving file version";
                                                       res.status(500).json({
                                                           result : "error",
                                                           message : msg,
                                                       });
                                                   }
                                               });
                                           }
                                           else
                                           {
                                               res.status(500).json({
                                                   result : "error",
                                                   message : "Database error",
                                               });
                                           }
                                       });
                                   }
                                    else
                                   {
                                       res.status(500).json({
                                           result : "error",
                                           message : "Error submitting file : " + result,
                                           files : files
                                       });
                                   }
                                });
                                /*
                                newFile.generateThumbnails(function(err, result){
                                    if(!err)
                                    {
                                        res.json({
                                            result : "success",
                                            message : "File submitted successfully. Message returned : " + result,
                                            files : files
                                        });
                                    }
                                    else
                                    {
                                        res.json({
                                            result : "success",
                                            message : "File submitted successfully. However, there was an error generating the thumbnails: " + result,
                                            files : files
                                        });
                                    }
                                });*/
                            }
                            else
                            {
                                res.status(500).json({
                                    result : "error",
                                    message : "Error submitting file : " + result,
                                    files : files
                                });
                            }

                        });
                    }
                    else
                    {
                        console.log("Error ["+err+"]saving file ["+newFile.uri+"]in GridFS :" + result);
                        res.status(500).json(
                            {
                                result : "error",
                                message : "Error saving the file : "+ result,
                                files : files
                            });
                    }
                });
            }
        };

        if(req.form.ended)
        {
            processFiles();
        }
        else
        {
            req.form.on('error', function(err) {
                res.status(500).json(
                    {
                        result : "error",
                        message : "an error occurred on file upload"
                    });
            });

            req.form.on('aborted', function() {
                res.status(500).json(
                    {
                        result : "aborted",
                        message : "request aborted by user"
                    });
            });

            req.form.on('end', function() {
                processFiles();
            });
        }
    }
};

exports.restore = function(req, res){

    if (req.originalMethod == "GET")
    {
        res.render('files/restore',
            {

            }
        );
    }
    else if (req.originalMethod == "POST")
    {
        var requestedResourceUri = req.params.requestedResource;

        req.form.on('error', function(err) {
            res.status(500).json(
                {
                    result : "error",
                    message : "an error occurred on file upload"
                });
        });

        req.form.on('aborted', function() {
            res.status(500).json(
                {
                    result : "aborted",
                    message : "request aborted by user"
                });
        });

        req.form.on('end', function() {

            if(req.files != null && req.files.files instanceof Array && req.files.files.length == 1)
            {
                var tempFilePath = req.files.files[0].path;
                var file = new File({
                    nie : {
                        title : req.files.files[0].name
                    }
                });

                if(file.ddr.fileExtension == "zip")
                {
                    //var restoringProjectRoot = (req.params.filepath == null || req.params.filepath.length == 0);

                    Folder.findByUri(requestedResourceUri, function(err, folder)
                    {
                        if(!err)
                        {
                            if(folder == null)
                            {
                                folder = new Folder({
                                    uri : requestedResourceUri
                                });
                            }

                            User.findByUri(req.session.user, function(err, user){
                                if(!err && user instanceof User)
                                {
                                    folder.restoreFromLocalBackupZipFile(tempFilePath, user, function(err, result){
                                        if(!err)
                                        {
                                            var msg = "Successfully restored zip file to folder " + requestedResourceUri + " : " + result;
                                            console.log(msg);

                                            res.status(200).json(
                                                {
                                                    "result" : "success",
                                                    "message" : msg
                                                }
                                            );
                                        }
                                        else
                                        {
                                            var msg = "Error restoring zip file to folder " + requestedResourceUri + " : " + result;
                                            console.log(msg);

                                            res.status(500).json(
                                                {
                                                    "result" : "error",
                                                    "message" : msg
                                                }
                                            );
                                        }
                                    });
                                }
                                else
                                {
                                    var msg = "Error fetching currently logged in user during restore operation of zip file to folder " + requestedResourceUri + " : " + result;
                                    res.status(500).json(
                                        {
                                            "result" : "error",
                                            "message" : msg
                                        }
                                    );
                                }
                            });
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    "result" : "error",
                                    "message" : "resource with uri : " + requestedResourceUri + " is not a folder."
                                }
                            );
                        }
                    });
                }
                else
                {
                    res.status(500).json(
                        {
                            "result" : "error",
                            "message" : "Backup file is not a .zip file"
                        }
                    );
                }
            }
            else
            {
                res.status(500).json(
                    {
                        "result" : "error",
                        "message" : "invalid request"
                    }
                );
            }
        });
    }
};

exports.rm = function(req, res){
    var resourceToDelete = req.params.requestedResource;

    try{
        var reallyDelete = JSON.parse(req.query.really_delete);
    }
    catch(e)
    {
        var reallyDelete = false;
    }

    if(resourceToDelete != null)
    {
        InformationElement.getType(resourceToDelete, function(err, type)
        {
            if(!err)
            {
                if(type == File)
                {
                    File.findByUri(resourceToDelete, function(err, file){
                        if(!err)
                        {
                            if(req.session.user != null)
                            {
                                var userUri = req.session.user.uri;
                            }
                            else
                            {
                                var userUri = null;
                            }

                            file.delete(function(err, result){
                                if(!err)
                                {
                                    res.status(200).json({
                                        "result" : "success",
                                        "message" : "Successfully deleted " + resourceToDelete
                                    });
                                }
                                else
                                {
                                    if(err == 404)
                                    {
                                        var error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + resourceToDelete;
                                        console.error(error);
                                        res.writeHead(404, error);
                                        res.end();
                                    }
                                    else
                                    {
                                        res.status(500).json(
                                            {
                                                "result" : "error",
                                                "message" : "Error deleting " + resourceToDelete + ". Error reported : " + result
                                            }
                                        );
                                    }
                                }
                            }, userUri, reallyDelete);
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    "result" : "error",
                                    "message" : "Unable to retrieve resource with uri " + resourceToDelete
                                }
                            );
                        }
                    });
                }
                else if(type == Folder)
                {
                    Folder.findByUri(resourceToDelete, function(err, folder){
                        if(!err && folder != null)
                        {
                            if(req.session.user != null)
                            {
                                var userUri = req.session.user.uri;
                            }
                            else
                            {
                                var userUri = null;
                            }

                            folder.delete(function(err, result){
                                if(!err)
                                {
                                    res.status(200).json({
                                        "result" : "success",
                                        "message" : "Successfully deleted " + resourceToDelete
                                    });
                                }
                                else
                                {
                                    if(err == 404)
                                    {
                                        var error = "There was already a prior attempt to delete this folder. The folder is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. Error reported : " + result;
                                        console.error(error);
                                        res.writeHead(404, error);
                                        res.end();
                                    }
                                    else
                                    {
                                        res.status(500).json(
                                            {
                                                "result" : "error",
                                                "message" : "Error deleting " + resourceToDelete + ". Error reported : " + result
                                            }
                                        );
                                    }
                                }
                            }, userUri, true, req.query.really_delete);
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    "result" : "error",
                                    "message" : "Unable to retrieve resource with uri " + resourceToDelete + ". Error reported : " + folder
                                }
                            );
                        }
                    });
                }
            }
        });
    }
};

exports.undelete = function(req, res){
    var resourceToUnDelete = req.params.requestedResource;

    if(resourceToUnDelete != null)
    {
        InformationElement.getType(resourceToUnDelete, function(err, type)
        {
            if(!err)
            {
                if(type == File)
                {
                    File.findByUri(resourceToUnDelete, function(err, file){
                        if(!err)
                        {
                            file.undelete(function(err, result){
                                if(!err)
                                {
                                    res.status(200).json({
                                        "result" : "success",
                                        "message" : "Successfully undeleted " + resourceToUnDelete
                                    });
                                }
                                else
                                {
                                    res.status(500).json(
                                        {
                                            "result" : "error",
                                            "message" : "Error undeleting " + resourceToUnDelete + ". Error reported : " + result
                                        }
                                    );
                                }
                            });
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    "result" : "error",
                                    "message" : "Unable to retrieve resource with uri " + resourceToUnDelete
                                }
                            );
                        }
                    });
                }
                else if(type == Folder)
                {
                    Folder.findByUri(resourceToUnDelete, function(err, folder){
                        if(!err)
                        {
                            folder.undelete(function(err, result){
                                if(!err)
                                {
                                    res.status(200).json({
                                        "result" : "success",
                                        "message" : "Successfully undeleted " + resourceToUnDelete
                                    });
                                }
                                else
                                {
                                    res.status(500).json(
                                        {
                                            "result" : "error",
                                            "message" : "Error undeleting " + resourceToUnDelete + ". Error reported : " + result
                                        }
                                    );
                                }
                            });
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    "result" : "error",
                                    "message" : "Unable to retrieve resource with uri " + resourceToUnDelete + ". Error reported : " + folder
                                }
                            );
                        }
                    });
                }
            }
        });
    }
};

exports.mkdir = function(req, res){

    var parentFolderURI = req.params.requestedResource;
    var newFolderTitle = req.query.mkdir;

    if(!newFolderTitle.match(/^[^\\\/:*?"<>|]{1,}$/g))
    {
        res.status(500).json(
            {
                "result" : "error",
                "message" : "invalid file name specified"
            }
        );
    }

    Folder.findByUri(parentFolderURI, function(err, parentFolder)
    {
        if(!err)
        {
            var newChildFolder = new Folder({
                nie :
                {
                    title : newFolderTitle,
                    isLogicalPartOf : parentFolderURI
                }
            });

            //save parent folder
            parentFolder.insertDescriptors([new Descriptor ({
                    prefixedForm : "nie:hasLogicalPart",
                    value : newChildFolder.uri
                })
            ],
            function(err, result)
            {
                if(!err)
                {
                    newChildFolder.save(function(err, result)
                    {
                        if(!err)
                        {
                            res.json(
                                {
                                    "status" : "1",
                                    "id" : newChildFolder.uri,
                                    "result" : "ok"
                                }
                            );
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    "result" : "error",
                                    "message" : "error 1 saving new folder :" + result
                                }
                            );
                        }
                    });
                }
                else
                {
                    res.status(500).json(
                        {
                            "result" : "error",
                            "message" : "error 2 saving new folder :" + result
                        }
                    );
                }
            });
        }
        else
        {
            res.status(500).json(
                {
                    "result" : "error",
                    "message" : "error 3 saving new folder :" + parentFolder
                }
            );
        }
    });
};

exports.ls = function(req, res){
    var resourceURI = req.params.requestedResource;
    var filepath = req.params.filepath;
    var show_deleted = req.query.show_deleted;

    if(filepath == null)
    {
        Project.findByHandle(req.params.handle, function(err, project) {
            if(!err)
            {
                project.getFirstLevelDirectoryContents(function(err, files){
                    if(!err)
                    {
                        if(!show_deleted)
                        {
                            var _ = require('underscore');
                            files = _.reject(files, function(file) { return file.ddr.deleted; });
                        }

                        res.json(files);
                    }
                    else
                    {
                        res.status(500).json({
                            result : "error",
                            message : "Unable to fetch project foot folder contents."
                        })
                    }
                });
            }
            else
            {
                res.status(500).json({
                    result : "error",
                    message : "Unable to fetch project with handle : " + req.params.handle
                })
            }
        });
    }
    else
    {
        Folder.findByUri(resourceURI, function(err, containingFolder)
        {
            if(!err && containingFolder != null)
            {
                containingFolder.getLogicalParts(function(err, children)
                {

                    if(!err)
                    {
                        if(!show_deleted)
                        {
                            var _ = require('underscore');
                            children = _.reject(children, function(child) { return child.ddr.deleted; });
                        }

                        res.json(children);
                    }
                });
            }
            else
            {
                res.status(500).json({
                    result : "Error",
                    message : "Non-existent folder"
                });
            }
        });
    }
};

exports.serve_static = function(req, res, pathOfIntendedFileRelativeToProjectRoot, pathOfFileToServeOnError, staticFileCaching, cachePeriodInSeconds){
    var fs = require('fs');
    var path = require('path');
        appDir = path.dirname(require.main.filename);

    var pipeFile = function(absPathOfFileToServe, filename, res, lastModified, cachePeriodInSeconds)
    {
        fs.createReadStream(absPathOfFileToServe);

        if(staticFileCaching === true && (typeof cachePeriodInSeconds === "number"))
        {
            res.setHeader('Last-Modified', lastModified);
            res.setHeader('Cache-Control', 'public, max-age=' + cachePeriodInSeconds);
            res.setHeader('Date', new Date().toString());
        }

        res.writeHead(200,
            {
                'Content-disposition': 'filename="' + filename+"\"",
                'Content-type': mimeType
            });

        var fileStream = fs.createReadStream(absPathOfFileToServe);
        fileStream.pipe(res);
    };

    if(typeof pathOfIntendedFileRelativeToProjectRoot === "string")
    {
        var fileName = path.basename(pathOfIntendedFileRelativeToProjectRoot);
        var extension = path.extname(pathOfIntendedFileRelativeToProjectRoot).replace(".", "");
        var mimeType = Config.mimeTypes[extension];
        var absPathOfFileToServe = Config.absPathInPublicFolder(pathOfIntendedFileRelativeToProjectRoot);

        fs.exists(absPathOfFileToServe, function(exists){
            if(exists)
            {
                fs.stat(absPathOfFileToServe, function(err, stats){
                    if(stats.isFile())
                    {
                        if(staticFileCaching)
                        {
                            var clientLastModifiedTimestamp = req.get("If-Modified-Since");

                            if(clientLastModifiedTimestamp != null)
                            {
                                clientLastModifiedTimestamp = new Date(clientLastModifiedTimestamp);

                                var util = require('util');
                                var mtime = new Date(util.inspect(stats.mtime));

                                if (mtime > clientLastModifiedTimestamp)
                                {
                                    pipeFile(absPathOfFileToServe, fileName, res, mtime);
                                }
                                else
                                {
                                    res.writeHead(304,
                                        {
                                            'Date' :  new Date().toString()
                                        });

                                    res.end();
                                }
                            }
                            else
                            {
                                pipeFile(absPathOfFileToServe, fileName, res, null, cachePeriodInSeconds)
                            }
                        }
                        else
                        {


                        };
                    }
                    else
                    {
                        res.status(404)        // HTTP status 404: NotFound
                            .send('Not found');
                    }
                });
            }
            else
            {
                if(pathOfFileToServeOnError != null)
                {
                    exports.serve_static(req,res, pathOfFileToServeOnError);
                }
                else
                {
                    res.status(404)        // HTTP status 404: NotFound
                        .send('Not found');
                }
            }
        });
    }
    else
    {
        res.status(500)        // HTTP status 404: NotFound
            .send('Error serving static file. Path not valid ' + pathOfIntendedFileRelativeToProjectRoot);
    }
};

exports.data = function(req, res){
    var resourceURI = req.params.requestedResource;

    File.findByUri(resourceURI, function(err, file){
        if(!err)
        {
            var mimeType = null;
            if(File.mimeTypes.hasOwnProperty(file.ddr.fileExtension))
            {
                mimeType = File.mimeTypes[file.ddr.fileExtension];
            }
            else
            {
                mimeType = File.mimeTypes.default;
            }

            file.writeToTempFile(function(err, writtenFilePath)
            {
                if(!err)
                {
                    if(writtenFilePath != null)
                    {
                        if(exports.dataParsers[file.ddr.fileExtension] != null)
                        {
                            exports.dataParsers[file.ddr.fileExtension](req, res, writtenFilePath);
                        }
                        else
                        {
                            var error = "Doesn't exist data parser for this format file : " + resourceURI;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }


                    }
                    else
                    {
                        var error = "There was an error streaming the requested resource : " + resourceURI;
                        console.error(error);
                        res.writeHead(500, error);
                        res.end();
                    }
                }
                else
                {
                    if(err == 404)
                    {
                        var error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + resourceURI;
                        console.error(error);
                        res.writeHead(404, error);
                        res.end();
                    }
                    else
                    {
                        var error = "Unable to produce temporary file to download "+resourceURI +". Error reported :" + writtenFilePath;
                        console.error(error);
                        res.writeHead(500, error);
                        res.end();
                    }
                }
            });
        }
        else
        {
            var error = "Non-existent file : " + resourceURI;
            console.error(error);
            res.writeHead(404, error);
            res.end();
        }
    });
};


xlsFileParser = function (req, res, filePath){
    var excelParser = require('excel-parser');

    excelParser.parse({
        inFile: filePath,
        worksheet: 1,
        skipEmpty: false
    },function(err, records){
        deleteTempFile(filePath);
        if(err){
        var error = "Unable to produce JSON representation of file :" + filePath + "Error reported: " + err + ".\n Cause : " + records + " \n ";
            console.error(err);
            res.writeHead(500, error);
            res.end();
        }
        else{
            res.json(records);
        }

    });
};

csvFileParser = function (req,res,filePath){


    var fs = require('fs');
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) throw err;
        deleteTempFile(filePath);
        var CSV = require('csv-string'),
        arr = CSV.parse(data);
        res.json(arr);
    });
};

textFileParser = function (req,res,filePath){
    var fs = require('fs');
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) throw err;
        deleteTempFile(filePath);
        res.send(data);
    });
};

exports.dataParsers = {
    "xls" : xlsFileParser,
    "xlsx" : xlsFileParser,
    "csv" : csvFileParser,
    "txt" : textFileParser,
    "log" : textFileParser,
    "xml" : textFileParser

}

deleteTempFile = function(filePath){
    var fs = require('fs');

    fs.unlink(filePath, function (err) {
        if (err) throw err;
        console.log('successfully deleted temporary file ' +filePath);
    });
}