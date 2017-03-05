var Config = function() { return GLOBAL.Config; }();

var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var UploadManager =  require(Config.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;
var FileVersion = require(Config.absPathInSrcFolder("/models/versions/file_version.js")).FileVersion;

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

exports.download = function(req, res){
    var self = this;
    if(req.params.is_project_root)
    {
        var requestedResourceURI = req.params.requestedResource + "/data";
    }
    else
    {
        var requestedResourceURI = req.params.requestedResource;
    }

    var filePath = req.params.filepath;

    var downloadFolder = function(requestedResourceURI, res)
    {
        Folder.findByUri(requestedResourceURI, function(err, folderToDownload)
        {
            if(!err)
            {
                var mimeType = Config.mimeType("zip");
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
                                var mimeType = Config.mimeType(file.ddr.fileExtension);;

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
                var mimeType = Config.mimeType("zip");
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
                                var mimeType = Config.mimeType(file.ddr.fileExtension);

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
                            var mimeType = Config.mimeType(file.ddr.fileExtension);

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
            var mimeType = Config.mimeType(file.ddr.fileExtension);

            if(Config.thumbnailableExtensions[file.ddr.fileExtension] != null)
            {
                file.getThumbnail(size, function(err, writtenFilePath)
                {
                    if(!err)
                    {
                        if(writtenFilePath != null)
                        {
                            const fs = require('fs');
                            const path = require('path');
                            let fileStream = fs.createReadStream(writtenFilePath);
                            let filename = path.basename(writtenFilePath);

                            res.writeHead(200,
                                {
                                    'Content-disposition': 'filename="' + filename+"\"",
                                    'Content-type': mimeType
                                });

                            fileStream.pipe(res);
                        }
                        else
                        {
                            const error = "There was an error streaming the requested resource : " + requestedResourceURI;
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

exports.upload = function(req, res)
{
    var upload_id = req.query.upload_id;
    var upload = UploadManager.get_upload_by_id(upload_id);
    var username = req.query.username;
    var file_md5 = req.query.md5_checksum;
    var filename = req.query.filename;
    var size = req.query.size;
    var restart = req.query.restart;

    if (req.originalMethod == "GET")
    {
        if (
            upload_id != null &&
            upload_id != "" &&
            username != null
        )
        {
            if (req.session.upload_manager != null && req.session.user != null)
            {
                if (upload != null)
                {
                    if (upload.username === upload.username && req.session.user != null && req.session.user.ddr.username == username)
                    {
                        if(restart)
                        {
                            upload.restart(function (err, result)
                            {
                                if(!err)
                                {
                                    res.json({
                                        size: upload.loaded
                                    });
                                }
                                else
                                {
                                    res.status(400).json({
                                        result : "result",
                                        message : "Error resetting upload."
                                    });
                                }

                            });
                        }
                        else
                        {
                            res.json({
                                size: upload.loaded
                            });
                        }
                    }
                    else
                    {
                        res.status(400).json(
                            {
                                result: "error",
                                message: "Unable to validate upload request. Are you sure that the username and upload_id parameters are correct?"
                            });
                    }
                }
                else
                {
                    res.status(400).json(
                        {
                            result: "error",
                            message: "The upload id is invalid."
                        });
                }

            }
        }
        else
        {
            if (username != null)
            {
                if (
                    filename != null &&
                    filename != "" &&

                    file_md5 != null &&
                    file_md5 != "" &&

                    req.params.requestedResource != null &&
                    req.params.requestedResource != ""
                )
                {
                    UploadManager.add_upload(
                        username,
                        filename,
                        size,
                        file_md5,
                        req.params.requestedResource,
                        function (err, newUpload)
                        {
                            if (!err)
                            {
                                res.json({
                                    size: newUpload.loaded,
                                    upload_id: newUpload.id
                                });
                            }
                            else
                            {
                                res.status(500).json({
                                    result: "error",
                                    message: "There was an error registering the new upload.",
                                    error: err
                                });
                            }

                        });
                }
                else
                {
                    res.status(400).json({
                        result: "error",
                        message: "Request must include: the 'filename' field. which is the title of the uploaded file, complete with its file type extension ; the 'md5_checksum' field, which is the md5 checksum of the uploaded file."
                    });
                }
            }
            else
            {
                res.status(400).json({
                    result: "error",
                    message: "User must be authenticated in the system to upload files."
                });
            }
        }
    }
    else if (req.originalMethod == "POST")
    {
        var requestedResourceURI = req.params.requestedResource;
        var currentUserUri = req.session.user.uri;

        var processFiles = function (callback)
        {
            var fileNames = [];

            var getFilesArray = function(req)
            {
                var files = [];

                if (req.files instanceof Object)
                {
                    if (req.files.file instanceof Object)
                    {
                        files[0] = req.files.file
                    }
                    else
                    {
                        files[0] = req.files;
                    }

                    return files;
                }
                else if (req.files.files != null && req.files.files instanceof Array)
                {
                    files = req.files.files;
                    return files;
                }
                else
                {
                    return null;
                }
            }

            var files = getFilesArray(req);

            if(files instanceof Array)
            {
                var async = require('async');
                async.map(files, function (file, callback)
                {
                    fileNames.push({
                        name: file.name
                    });

                    var newFile = new File({
                        nie: {
                            title: file.name,
                            isLogicalPartOf: requestedResourceURI
                        }
                    });

                    var fs = require('fs');

                    const md5File = require('md5-file')

                    /* Async usage */
                    md5File(file.path, function(err, hash)
                    {
                        if (!err)
                        {
                            if(hash != upload.md5_checksum)
                            {
                                callback(400, {
                                    result : "error",
                                    message : "File was corrupted during transfer. Please repeat.",
                                    error : "invalid_checksum",
                                    calculated_at_server : hash,
                                    calculated_at_client : upload.md5_checksum
                                });
                            }
                            else
                            {
                                newFile.loadFromLocalFile(file.path, function (err, result) {
                                    if (err == null)
                                    {
                                        newFile.save(function (err, result) {
                                            if (err == null)
                                            {
                                                console.log("File " + newFile.uri + " is now saved in GridFS");
                                                newFile.connectToMongo(function (err, db) {
                                                    if (!err)
                                                    {
                                                        newFile.findFileInMongo(db, function (error, fileVersionsInMongoDb) {
                                                            if (!error)
                                                            {
                                                                async.map(fileVersionsInMongoDb, function (fileVersion, cb) {
                                                                    FileVersion.findByUri(fileVersion.filename, function(err, fileVersion){
                                                                        if(!err)
                                                                        {
                                                                            if(fileVersion == null)
                                                                            {
                                                                                console.log('FileinfoFromMongo: ', fileVersion);
                                                                                var newFileVersion = new FileVersion({
                                                                                    nfo: {
                                                                                        fileName: fileVersion.filename,
                                                                                        hashValue: fileVersion.md5,
                                                                                        hashAlgorithm: 'md5'
                                                                                    },
                                                                                    nie: {
                                                                                        contentLastModified: fileVersion.uploadDate,
                                                                                        byteSize: fileVersion.length
                                                                                    },
                                                                                    ddr: {
                                                                                        contentType: fileVersion.contentType,
                                                                                        chunkSize: fileVersion.chunkSize,
                                                                                        projectUri: fileVersion.metadata.project,
                                                                                        itemType: fileVersion.metadata.type,
                                                                                        creatorUri: currentUserUri
                                                                                    }
                                                                                });

                                                                                newFileVersion.save(function (err, fileVersion)
                                                                                {
                                                                                    if (!err)
                                                                                    {
                                                                                        cb(null, fileVersion);
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                        cb(true, fileVersion);
                                                                                    }
                                                                                }, false, null, null, null, null, db_social.graphUri)
                                                                            }
                                                                            else
                                                                            {
                                                                                cb(null, fileVersion);
                                                                            }
                                                                        }
                                                                        else
                                                                        {
                                                                            cb(1, "Error fetching file version with URI " + fileVersion.uri);
                                                                        }
                                                                    });
                                                                }, function (err, results)
                                                                {
                                                                    if (!err)
                                                                    {
                                                                        callback(null, {
                                                                            result: "success",
                                                                            message: "File submitted successfully. Message returned : " + result,
                                                                            files: files
                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        var msg = "Error saving file version";
                                                                        callback(500, {
                                                                            result: "error",
                                                                            message: msg
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                            else
                                                            {
                                                                var msg = "Database error";
                                                                callback(500, {
                                                                    result: "error",
                                                                    message: msg
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else
                                                    {
                                                        var msg = "Error submitting file : " + result;
                                                        callback(500, {
                                                            result: "error",
                                                            message: msg,
                                                            files: files
                                                        });
                                                    }
                                                });

                                                //try to generate thumbnails
                                                newFile.generateThumbnails(function (err, result)
                                                {
                                                    if(err != null)
                                                    {
                                                        console.error("Error generating thumbnails for file " + newFile.uri + " : " + result);
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                var msg = "Error [" + err + "]saving file [" + newFile.uri + "]in GridFS :" + result;
                                                callback(500, {
                                                    result: "error",
                                                    message: msg,
                                                    files: fileNames
                                                });
                                            }
                                        });
                                    }
                                    else
                                    {
                                        console.log("Error [" + err + "] saving file [" + newFile.uri + "]in GridFS :" + result);
                                        callback(500, {
                                            result: "error",
                                            message: "Error saving the file : " + result,
                                            files: files
                                        });
                                    }
                                });
                            }

                        }
                        else
                        {
                            callback(401, {
                                result: "error",
                                message: "Unable to calculate the MD5 checksum of the uploaded file: " + newFile.filename,
                                error: result
                            });
                        }
                    })
                }, function(err, results){
                    callback(err, results);
                });
            }
            else
            {
                callback(500, {
                    result: "error",
                    message: "Unknown error submitting files. Malformed message?",
                    files: fileNames
                });
            }
        }

        if (upload != null)
        {
            var multiparty = require('multiparty');
            var form = new multiparty.Form({maxFieldSize: 8192, maxFields: 10, autoFiles: false});

            form.on('error', function (err)
            {
                UploadManager.destroy_upload(upload.id, function (err)
                {
                    if (err)
                    {
                        console.log("Error destroying upload " + upload.id);
                    }
                });
            });

            form.on('aborted', function ()
            {
                UploadManager.destroy_upload(upload.id, function (err)
                {
                    if (err)
                    {
                        console.log("Error destroying upload " + upload.id);
                    }
                });
            });

            /*form.on('progress', function (bytesReceived, bytesExpected)
            {
                console.log(upload.filename + " ---> " + upload.temp_file + ".  " + ((bytesReceived / bytesExpected) * 100) + "% uploaded");
                console.log("Size of " + upload.temp_file + " : " + upload.loaded);
            });*/


            // Parts are emitted when parsing the form
            form.on('part', function(part) {

                if (!part.filename) {
                    part.resume();
                }

                if (part.filename) {
                    // filename is defined when this is a file
                    console.log('got file named ' + part.name);

                    upload.pipe(part, function(err){
                        if(!err)
                        {
                            if(upload.is_finished())
                            {
                                req.files = {
                                    path: upload.temp_file,
                                    name: upload.filename
                                };

                                processFiles(function(status, responseObject){
                                    if (status == null)
                                    {
                                        res.json(responseObject);
                                    }
                                    else
                                    {
                                        res.status(status).json(responseObject);
                                    }
                                });
                            }
                            else
                            {
                                res.json(
                                    {
                                        size: upload.size
                                    });
                            }
                        }
                        else
                        {
                            res.status(500).json(
                                {
                                    result: "error",
                                    message: "There was an error writing a part of the upload to the server."
                                });
                        }
                    });
                }

                part.on('error', function(err) {
                    // decide what to do
                });
            });

            // Parse req
            form.parse(req);
        }
        else
        {
            res.status(500).json(
                {
                    result: "error",
                    message: "Upload ID not recognized. Please restart uploading " + req.query.filename + "from the beginning."
                });
        }
    };
};

exports.resume = function(req, res)
{
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');


    if (req.originalMethod == "GET")
    {
        var resume = req.query.resume;
        var upload_id = req.query.upload_id;
        var username = req.query.username;

        if(resume != null)
        {
            if(req.session.upload_manager != null)
            {
                if (upload_id != null)
                {
                    var upload = UploadManager.get_upload_by_id(upload_id);

                    if (upload.username == username)
                    {
                        res.json({
                            size: upload.loaded
                        });
                    }
                    else
                    {
                        var msg = "The upload does not belong to the user currently trying to resume."
                        console.error(msg);
                        res.status(400).json({
                            result: "error",
                            msg: msg
                        });
                    }
                }
                else
                {
                    res.json({
                        size: 0
                    });
                }
            }
            else
            {
                var msg = "The user does not have a session initiated."
                console.error(msg);
                res.status(400).json({
                    result: "error",
                    msg: msg
                });
            }
        }
        else
        {
            var msg = "Invalid Request, does not contain the 'resume' query parameter."
            console.error(msg);
            res.status(400).json({
                result: "error",
                msg: msg
            });
        }
    }
    else
    {
        if(acceptsJSON && !acceptsHTML)
        {
            var msg = "This is only accessible via GET method";
            req.flash('error', "Invalid Request");
            console.log(msg);
            res.status(400).render('',
                {
                }
            );
        }
        else
        {
            res.status(400).json({
                result : "error",
                msg : "This API functionality is only accessible via GET method."
            });
        }

    }
}


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
        var requestedResourceUri = req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle + "/data";

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

    if(req.params.is_project_root)
    {
        var parentFolderURI = req.params.requestedResource + "/data";
    }
    else
    {
        var parentFolderURI = req.params.requestedResource;
    }

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

exports.thumbnail = function(req, res)
{
    if(req.params.filepath != null)
    {
        var path = require('path');
        var requestedExtension = path.extname(req.params.filepath).replace(".", "");

        if(requestedExtension == null)
        {
            exports.serve_static(req, res, "/images/icons/document_empty.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
        }
        else if(requestedExtension != null && Config.thumbnailableExtensions[requestedExtension] != null)
        {
            exports.get_thumbnail(req, res);
        }
        else if(requestedExtension === "" || requestedExtension === "folder")
        {
            exports.serve_static(req, res, "/images/icons/folder.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
        }
        else
        {
            if(Config.iconableFileExtensions[requestedExtension])
            {
                exports.serve_static(req, res, "/images/icons/extensions/file_extension_" + requestedExtension + ".png", "/images/icons/file.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
            }
            else
            {
                exports.serve_static(req, res, "/images/icons/document_empty.png", "/images/icons/document_empty.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
            }
        }
    }
    else
    {
        exports.serve_static(req, res, "/images/icons/blank_document.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
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
        var mimeType = Config.mimeType(extension);
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

    var requestedExtension = path.extname(req.params.filepath).replace(".", "");

    if(files.dataParsers[requestedExtension] != null)
    {
        var resourceURI = req.params.requestedResource;

        File.findByUri(resourceURI, function(err, file){
            if(!err)
            {
                var mimeType = Config.mimeType(file.ddr.fileExtension);

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
    }
    else
    {
        var projects = require(Config.absPathInSrcFolder("/controllers/projects.js"));
        projects.show(req, res);
    }
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
