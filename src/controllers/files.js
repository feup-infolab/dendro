const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;
const FileVersion = require(Pathfinder.absPathInSrcFolder("/models/versions/file_version.js")).FileVersion;

const async = require('async');

const db_social = function () {
    return Config.db.social;
}();

exports.download = function(req, res){
    const self = this;

    let requestedResourceURI = req.params.requestedResourceUri;

    const downloadFolder = function (requestedResourceURI, res) {
        Folder.findByUri(requestedResourceURI, function (err, folderToDownload) {
            if (isNull(err)) {
                const mimeType = Config.mimeType("zip");
                const fileName = folderToDownload.nie.title + ".zip";

                res.writeHead(200,
                    {
                        'Content-disposition': 'attachment; filename="' + fileName + "\"",
                        'Content-Type': mimeType
                    }
                );

                const includeMetadata = (!isNull(req.query.backup));
                const bagIt = (!isNull(req.query.bagit));

                const async = require('async');

                async.series([
                    function (cb) {
                        if (bagIt) {
                            const bagitOptions = {
                                cryptoMethod: 'sha256'
                            };

                            folderToDownload.bagit(bagitOptions, function (err, result, absolutePathOfFinishedFolder, parentFolderPath) {
                                const path = require('path');

                                const finishedZipFileName = "bagit_backup.zip";
                                const finishedZipFileAbsPath = path.join(parentFolderPath, finishedZipFileName);

                                Folder.zip(absolutePathOfFinishedFolder, finishedZipFileAbsPath, function (err, zipFileFullPath) {
                                    cb(err, zipFileFullPath);
                                }, finishedZipFileName, true);
                            });
                        }
                        else {
                            folderToDownload.zipAndDownload(includeMetadata, function (err, writtenFilePath) {
                                cb(err, writtenFilePath);
                            });
                        }
                    }
                ],
                function (err, results) {
                    if (isNull(err)) {
                        if (!isNull(results) && !isNull(results[0])) {
                            var writtenFilePath = results[0];

                            const fs = require('fs');
                            const fileStream = fs.createReadStream(writtenFilePath);

                            res.on('end', function () {
                                File.deleteOnLocalFileSystem(writtenFilePath, function (err, stdout, stderr) {
                                    if (err) {
                                        console.error("Unable to delete " + writtenFilePath);
                                    }
                                    else {
                                        console.log("Deleted " + writtenFilePath);
                                    }
                                });
                            });

                            fileStream.pipe(res);
                        }
                        else {
                            const error = "There was an error attempting to fetch the requested resource : " + requestedResourceURI;
                            console.error(error);
                            res.status(500).write("Error : " + error + "\n");
                            res.end();
                        }
                    }
                    else {
                        if (err === 404) {
                            const error = "There was already a prior attempt to delete this folder. The folder is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else {
                            console.error("Unable to produce temporary file to download " + self.uri + " Error returned : " + writtenFilePath);
                        }

                    }
                });
            }
            else {
                const error = "Non-existent folder : " + requestedResourceURI;
                console.error(error);
                res.writeHead(404, error);
                res.end();
            }
        });
    };
    const downloadFile = function(requestedResourceURI, res) {
        File.findByUri(requestedResourceURI, function(err, file){
            if(isNull(err))
            {
                const mimeType = Config.mimeType(file.ddr.fileExtension);
                file.writeToTempFile(function(err, writtenFilePath)
                {
                    if(isNull(err))
                    {
                        if(!isNull(writtenFilePath))
                        {
                            const fs = require('fs');
                            const fileStream = fs.createReadStream(writtenFilePath);

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
                            const error = "There was an error streaming the requested resource : " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }
                    }
                    else
                    {
                        if(err === 404)
                        {
                            const error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else
                        {
                            const error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }
                    }
                });
            }
            else
            {
                const error = "Non-existent file : " + requestedResourceURI;
                console.error(error);
                res.writeHead(404, error);
                res.end();
            }
        });
    };

    //we are fetching the root folder of a project
    if(req.params.is_project_root)
    {
        Project.findByUri(requestedResourceURI, function(err, project){
            if(isNull(err))
            {
                if(!isNull(project))
                {
                    project.getRootFolder(function(err, rootFolder){
                        if(isNull(err))
                        {
                            if(!(isNull(rootFolder)) && rootFolder instanceof Folder)
                            {
                                downloadFolder(rootFolder.uri, res);
                            }
                            else
                            {
                                const error = "Unable to determine the root folder of project : " + requestedResourceURI;
                                console.error(error);
                                res.status(500).write("Error : "+ error +"\n");
                                res.end();
                            }
                        }

                    });
                }
                else
                {
                    const error = "Non-existent project : " + requestedResourceURI;
                    console.error(error);
                    res.status(404).write("Error : "+ error +"\n");
                    res.end();
                }
            }
            else
            {
                const error = "Error occurred while retrieving project : " + requestedResourceURI;
                console.error(error);
                res.status(500).write("Error : "+ error +"\n");
                res.end();
            }
        });

    }
    else
    {
        InformationElement.findByUri(requestedResourceURI, function(err, ie){
            if(isNull(err))
            {
                if(!isNull(ie))
                {
                    const path = require('path');
                    if(ie.isA(File))
                    {
                        downloadFile(requestedResourceURI, res);
                    }
                    else if(ie.isA(Folder))
                    {
                        downloadFolder(requestedResourceURI, res);
                    }
                    else
                    {
                        const error = "Unable to determine the type of the requested resource : " + requestedResourceURI;
                        console.error(error);
                        res.status(500).write("Error : "+ error +"\n");
                        res.end();
                    }
                }
                else
                {
                    const error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + ie;
                    console.error(error);
                    res.status(404).write("error");
                    res.end();
                }
            }
            else
            {
                const error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + ie;
                console.error(error);
                res.status(500).write("Error : "+ error +"\n");
                res.end();
            }
        });
    }
};
/*
Used to serve some files in html like images, text files...
 */
exports.serve = function(req, res){
    const self = this;
    const requestedResourceURI = req.params.requestedResourceUri;

    const downloadFolder = function (requestedResourceURI, res) {
        Folder.findByUri(requestedResourceURI, function (err, folderToDownload) {
            if (isNull(err)) {
                const mimeType = Config.mimeType("zip");
                const fileName = folderToDownload.nie.title + ".zip";

                res.writeHead(200,
                    {
                        'Content-disposition': 'attachment; filename="' + fileName + "\"",
                        'Content-Type': mimeType
                    }
                );

                const includeMetadata = (!isNull(req.query.backup));

                folderToDownload.zipAndDownload(includeMetadata, function (err, writtenFilePath) {
                    if (isNull(err)) {
                        if (!isNull(writtenFilePath)) {
                            const fs = require('fs');
                            const fileStream = fs.createReadStream(writtenFilePath);

                            res.on('end', function () {
                                Folder.deleteOnLocalFileSystem(parentFolderPath, function (err, stdout, stderr) {
                                    if (err) {
                                        console.error("Unable to delete " + writtenFilePath);
                                    }
                                    else {
                                        console.log("Deleted " + writtenFilePath);
                                    }
                                });
                            });

                            fileStream.pipe(res);
                        }
                        else {
                            const error = "There was an error attempting to fetch the requested resource : " + requestedResourceURI;
                            console.error(error);
                            res.status(500).write("Error : " + error + "\n");
                            res.end();
                        }
                    }
                    else {
                        if (err === 404) {
                            const error = "There was already a prior attempt to delete this folder. The folder is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else {
                            console.error("Unable to produce temporary file to download " + self.uri + " Error returned : " + writtenFilePath);
                        }

                    }
                });
            }
            else {
                const error = "Non-existent folder : " + requestedResourceURI;
                console.error(error);
                res.writeHead(404, error);
                res.end();
            }
        });
    };

    //we are fetching the root folder of a project
    if(req.params.is_project_root)
    {
        downloadFolder(requestedResourceURI, res);
    }
    else
    {
        InformationElement.findByUri(requestedResourceURI,
            function(err, ie){
                if(isNull(err))
                {
                    const path = require('path');
                    if(ie.isA(File))
                    {
                        File.findByUri(requestedResourceURI, function(err, file){
                            if(isNull(err))
                            {
                                const mimeType = Config.mimeType(file.ddr.fileExtension);

                                file.writeToTempFile(function(err, writtenFilePath)
                                {
                                    if(isNull(err))
                                    {
                                        if(!isNull(writtenFilePath))
                                        {
                                            const fs = require('fs');
                                            const fileStream = fs.createReadStream(writtenFilePath);

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
                                            const error = "There was an error streaming the requested resource : " + requestedResourceURI;
                                            console.error(error);
                                            res.writeHead(500, error);
                                            res.end();
                                        }
                                    }
                                    else
                                    {
                                        if(err === 404)
                                        {
                                            const error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                                            console.error(error);
                                            res.writeHead(404, error);
                                            res.end();
                                        }
                                        else
                                        {
                                            const error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                                            console.error(error);
                                            res.writeHead(500, error);
                                            res.end();
                                        }
                                    }
                                });
                            }
                            else
                            {
                                const error = "Non-existent file : " + requestedResourceURI;
                                console.error(error);
                                res.writeHead(404, error);
                                res.end();
                            }
                        });
                    }
                    else if(ie.isA(Folder))
                    {
                        downloadFolder(requestedResourceURI, res);
                    }
                    else
                    {
                        const error = "Unable to determine the type of the requested resource : " + requestedResourceURI;
                        console.error(error);
                        res.status(500).write("Error : "+ error +"\n");
                        res.end();
                    }
                }
                else
                {
                    const error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + ie;
                    console.error(error);
                    res.status(500).write("Error : "+ error +"\n");
                    res.end();
                }
            });
    }
};
exports.serve_base64 = function(req, res){
    const requestedResourceURI = req.params.requestedResourceUri;

    InformationElement.getType(requestedResourceURI,
        function(err, type){
            if(isNull(err))
            {
                const path = require('path');
                if(type === File)
                {
                    File.findByUri(requestedResourceURI, function(err, file){
                        if(isNull(err))
                        {
                            const mimeType = Config.mimeType(file.ddr.fileExtension);

                            file.writeToTempFile(function(err, writtenFilePath)
                            {
                                if(isNull(err))
                                {
                                    if(!isNull(writtenFilePath))
                                    {
                                        const fs = require('fs');
                                        const fileStream = fs.createReadStream(writtenFilePath);

                                        res.on('end', function(){
                                            console.log("close");
                                            deleteTempFile(writtenFilePath);
                                        });
                                        const base64 = require('base64-stream');

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
                                        const error = "There was an error streaming the requested resource : " + requestedResourceURI;
                                        console.error(error);
                                        res.writeHead(500, error);
                                        res.end();
                                    }
                                }
                                else
                                {
                                    if(err === 404)
                                    {
                                        const error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                                        console.error(error);
                                        res.writeHead(404, error);
                                        res.end();
                                    }
                                    else
                                    {
                                        const error = "Unable to produce temporary file to download "+requestedResourceURI +". Error reported :" + writtenFilePath;
                                        console.error(error);
                                        res.writeHead(500, error);
                                        res.end();
                                    }
                                }
                            });
                        }
                        else
                        {
                            const error = "Non-existent file : " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                    });
                }
                else if(type === Folder)
                {
                    const error = "Resource : " + requestedResourceURI + " is a folder and cannot be represented in Base64";
                    console.error(error);
                    res.status(500).write("Error : "+ error +"\n");
                    res.end();
                }
                else
                {
                    const error = "Unable to determine the type of the requested resource : " + requestedResourceURI;
                    console.error(error);
                    res.status(500).write("Error : "+ error +"\n");
                    res.end();
                }
            }
            else
            {
                const error = "Unable to determine the type of the requested resource, error 2 : " + requestedResourceURI + type;
                console.error(error);
                res.status(500).write("Error : "+ error +"\n");
                res.end();
            }
        });

};
exports.get_thumbnail = function(req, res) {
    const requestedResourceURI = req.params.requestedResourceUri;
    const size = req.query.size;



    InformationElement.findByUri(requestedResourceURI, function(err, ie){
        if(isNull(err))
        {
            if(!isNull(ie))
            {
                if(ie.isA(Folder))
                {
                    exports.serve_static(req, res, "/images/icons/folder.png", "/images/icons/folder.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                }
                else if(ie.isA(File))
                {
                    File.findByUri(requestedResourceURI, function(err, file){
                        if(isNull(err))
                        {
                            if(!isNull(file))
                            {
                                const mimeType = Config.mimeType(file.ddr.fileExtension);

                                if(!isNull(Config.thumbnailableExtensions[file.ddr.fileExtension]))
                                {
                                    file.getThumbnail(size, function(err, writtenFilePath)
                                    {
                                        if(isNull(err))
                                        {
                                            if(!isNull(writtenFilePath))
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
                                            if(err === 404)
                                            {
                                                const error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + requestedResourceURI;
                                                console.error(error);
                                                res.writeHead(404, error);
                                                res.end();
                                            }
                                            else
                                            {
                                                //try to regenerate thumbnails
                                                file.generateThumbnails(function(err, result)
                                                {
                                                    const error = "Unable to produce temporary file to download " + requestedResourceURI + ". Error reported :" + writtenFilePath;
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
                                        Pathfinder.absPathInPublicFolder("/images/icons/extensions/file_extension_" + file.ddr.fileExtension + ".png"),
                                        Pathfinder.absPathInPublicFolder("/images/icons/file.png"),
                                        Config.cache.static.etag_cache_active
                                    );
                                }
                            }
                            else
                            {
                                const error = "Non-existent file : " + requestedResourceURI;
                                console.error(error);
                                res.writeHead(404, error);
                                res.end();
                            }
                        }
                        else
                        {
                            const error = "Error fetching thumbnail for file " + requestedResourceURI;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }
                    });
                }
                else
                {
                    exports.serve_static(req, res, "/images/icons/document_empty.png", "/images/icons/document_empty.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds, 500);
                }
            }
            else
            {
                exports.serve_static(req, res, "/images/icons/document_empty.png", "/images/icons/document_empty.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds, 404);
            }
        }
        else
        {
            exports.serve_static(req, res, "/images/icons/document_empty.png", "/images/icons/document_empty.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds, 500);
        }
    });


};

exports.upload = function(req, res)
{
    const upload_id = req.query.upload_id;
    const upload = UploadManager.get_upload_by_id(upload_id);
    const username = req.query.username;
    const file_md5 = req.query.md5_checksum;
    const filename = req.query.filename;
    const size = req.query.size;
    const restart = req.query.restart;

    if (req.originalMethod === "GET")
    {
        if (
            !isNull(upload_id) &&
            upload_id !== "" &&
            !isNull(username)
        )
        {
            if (typeof req.session.upload_manager !== "undefined" && !isNull(req.user))
            {
                if (!isNull(upload))
                {
                    if (upload.username === upload.username && !isNull(req.user) && req.user.ddr.username === username)
                    {
                        if(restart)
                        {
                            upload.restart(function (err, result)
                            {
                                if(isNull(err))
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
            if (!isNull(username))
            {
                if (
                    !isNull(filename) &&
                    filename !== "" &&

                    typeof file_md5 !== "undefined" &&
                    file_md5 !== "" &&

                    !isNull(req.params.requestedResourceUri) &&
                    req.params.requestedResourceUri !== ""
                )
                {
                    UploadManager.add_upload(
                        username,
                        filename,
                        size,
                        file_md5,
                        req.params.requestedResourceUri,
                        function (err, newUpload)
                        {
                            if (isNull(err))
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
    else if (req.originalMethod === "POST")
    {
        const requestedResourceURI = req.params.requestedResourceUri;


        const currentUserUri = req.user.uri;

        const processFiles = function (callback) {
            const fileNames = [];

            const getFilesArray = function (req) {
                let files = [];

                if (req.files instanceof Object) {
                    if (req.files.file instanceof Object) {
                        files[0] = req.files.file
                    }
                    else {
                        files[0] = req.files;
                    }

                    return files;
                }
                else if (!isNull(req.files.files) && req.files.files instanceof Array) {
                    files = req.files.files;
                    return files;
                }
                else {
                    return null;
                }
            };

            var files = getFilesArray(req);

            if (files instanceof Array) {
                const async = require('async');
                async.map(files, function (file, callback) {
                    fileNames.push({
                        name: file.name
                    });

                    const getNewFileParentFolder = function(callback)
                    {
                        async.tryEach([
                            function(callback)
                            {
                                if(req.params.is_project_root)
                                {
                                    Project.findByUri(requestedResourceURI, function(err, project){
                                        if(isNull(err))
                                        {
                                            if(!isNull(project))
                                            {
                                                callback(true, project.ddr.rootFolder);
                                            }
                                            else
                                            {
                                                callback(false);
                                            }

                                        }
                                        else
                                        {
                                            callback(false, err);
                                        }
                                    });
                                }
                                else
                                {
                                    callback(true, requestedResourceURI);
                                }
                            }
                        ], function(ok, result)
                        {
                            if(ok)
                                callback(null, result);
                            else
                                callback(1, result);
                        });
                    };


                    const fs = require('fs');
                    const md5File = require('md5-file');


                    //TODO OMG this needs to be flattened using async!!! Callback onion!!
                    md5File(file.path, function (err, hash) {
                        if (isNull(err)) {
                            if (hash !== upload.md5_checksum) {
                                return callback(400, {
                                    result: "error",
                                    message: "File was corrupted during transfer. Please repeat.",
                                    error: "invalid_checksum",
                                    calculated_at_server: hash,
                                    calculated_at_client: upload.md5_checksum
                                });
                            }
                            else {
                                getNewFileParentFolder(function(err, parentFolderUri){
                                    if(isNull(err))
                                    {
                                        const newFile = new File({
                                            nie: {
                                                title: file.name,
                                                isLogicalPartOf: parentFolderUri
                                            }
                                        });

                                        newFile.save(function (err, result) {
                                            if (isNull(err)) {
                                                newFile.loadFromLocalFile(file.path, function (err, result) {
                                                    if (isNull(err)) {
                                                        //console.log("File " + newFile.uri + " is now saved in GridFS");
                                                        //try to generate thumbnails

                                                        newFile.generateThumbnails(function (err, result) {
                                                            if (!isNull(err)) {
                                                                console.error("Error generating thumbnails for file " + newFile.uri + " : " + result);
                                                            }


                                                            newFile.extract_text(function(err, text)
                                                            {
                                                                if(isNull(err))
                                                                {
                                                                    if(!isNull(text))
                                                                    {
                                                                        newFile.nie.plainTextContent = text;
                                                                    }
                                                                    else
                                                                    {
                                                                        delete newFile.nie.plainTextContent;
                                                                    }
                                                                }

                                                                newFile.save(function (err, result) {
                                                                    if(!err)
                                                                    {
                                                                        newFile.reindex(req.index, function (err, data) {
                                                                            if(isNull(err))
                                                                            {
                                                                                return callback(null, {
                                                                                    result: "success",
                                                                                    message: "File submitted successfully. Message returned : " + result,
                                                                                    files: files
                                                                                });
                                                                            }
                                                                            else
                                                                            {
                                                                                const msg = "Error [" + err + "]reindexing file [" + newFile.uri + "]in GridFS :" + data;
                                                                                return callback(500, {
                                                                                    result: "error",
                                                                                    message: msg,
                                                                                    files: files
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        const msg = "Error [" + err + "]saving file [" + newFile.uri + "]in GridFS :" + result;
                                                                        return callback(500, {
                                                                            result: "error",
                                                                            message: msg,
                                                                            files: fileNames
                                                                        });
                                                                    }

                                                                });
                                                            });
                                                        });
                                                    }
                                                    else {
                                                        const msg = "Error [" + err + "]saving file [" + newFile.uri + "]in GridFS :" + result;
                                                        return callback(500, {
                                                            result: "error",
                                                            message: msg,
                                                            files: fileNames
                                                        });
                                                    }
                                                });
                                            }
                                            else {
                                                console.log("Error [" + err + "] saving file [" + newFile.uri + "]in GridFS :" + result);
                                                return callback(500, {
                                                    result: "error",
                                                    message: "Error saving the file : " + result,
                                                    files: files
                                                });
                                            }
                                        });
                                    }
                                    else
                                    {
                                        const msg = "Error determining the parent folder of the new file : " + parentFolderUri;
                                        return callback(500, {
                                            result: "error",
                                            message: msg,
                                            files: files
                                        });
                                    }
                                });
                            }

                        }
                        else {
                            return callback(401, {
                                result: "error",
                                message: "Unable to calculate the MD5 checksum of the uploaded file: " + newFile.filename,
                                error: result
                            });
                        }
                    })
                }, function (err, results) {
                    return callback(err, results);
                });
            }
            else {
                return callback(500, {
                    result: "error",
                    message: "Unknown error submitting files. Malformed message?",
                    files: fileNames
                });
            }
        };

        if (!isNull(upload))
        {
            const multiparty = require('multiparty');
            const form = new multiparty.Form({maxFieldSize: 8192, maxFields: 10, autoFiles: false});

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
                        if(isNull(err))
                        {
                            if(upload.is_finished())
                            {
                                req.files = {
                                    path: upload.temp_file,
                                    name: upload.filename
                                };

                                processFiles(function(status, responseObject){
                                    if (isNull(status))
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
    }
};

exports.resume = function(req, res)
{
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');


    if (req.originalMethod === "GET")
    {
        const resume = req.query.resume;
        const upload_id = req.query.upload_id;
        const username = req.query.username;

        if(!isNull(resume))
        {
            if(typeof req.session.upload_manager !== "undefined")
            {
                if (typeof upload_id !== "undefined")
                {
                    const upload = UploadManager.get_upload_by_id(upload_id);

                    if (upload.username === username)
                    {
                        res.json({
                            size: upload.loaded
                        });
                    }
                    else
                    {
                        const msg = "The upload does not belong to the user currently trying to resume.";
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
                const msg = "The user does not have a session initiated.";
                console.error(msg);
                res.status(400).json({
                    result: "error",
                    msg: msg
                });
            }
        }
        else
        {
            const msg = "Invalid Request, does not contain the 'resume' query parameter.";
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
            const msg = "This is only accessible via GET method";
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
};


exports.restore = function(req, res){

    if (req.originalMethod === "GET")
    {
        res.render('files/restore',
            {

            }
        );
    }
    else if (req.originalMethod === "POST")
    {
        const requestedResourceUri = req.params.requestedResourceUri;

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

            if(!isNull(req.files) && req.files.files instanceof Array && req.files.files.length === 1)
            {
                const tempFilePath = req.files.files[0].path;
                const file = new File({
                    nie: {
                        title: req.files.files[0].name
                    }
                });

                if(file.ddr.fileExtension === "zip")
                {
                    //var restoringProjectRoot = (req.params.filepath == null || req.params.filepath.length == 0);

                    Folder.findByUri(requestedResourceUri, function(err, folder)
                    {
                        if(isNull(err))
                        {
                            if(isNull(folder))
                            {
                                folder = new Folder({
                                    uri : requestedResourceUri
                                });
                            }

                            User.findByUri(req.user, function(err, user){
                                if(isNull(err) && user instanceof User)
                                {
                                    folder.restoreFromLocalBackupZipFile(tempFilePath, user, function(err, result){
                                        if(isNull(err))
                                        {
                                            const msg = "Successfully restored zip file to folder " + requestedResourceUri + " : " + result;
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
                                            const msg = "Error restoring zip file to folder " + requestedResourceUri + " : " + result;
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
                                    const msg = "Error fetching currently logged in user during restore operation of zip file to folder " + requestedResourceUri + " : " + result;
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
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)
    {
        const resourceToDelete = req.params.requestedResourceUri;

        let reallyDelete;

        try{
            reallyDelete = JSON.parse(req.query.really_delete);
        }
        catch(e)
        {
            reallyDelete = false;
        }

        if(!isNull(resourceToDelete))
        {
            InformationElement.findByUri(resourceToDelete, function(err, result){
                if(isNull(err))
                {
                    if(isNull(result))
                    {
                        res.status(404).json({
                            "result" : "error",
                            "message" : "Unable to find resource " + resourceToDelete
                        });
                    }
                    else
                    {
                        function deleteFolder(callback)
                        {
                            Folder.findByUri(resourceToDelete, function(err, folder){
                                if(isNull(err))
                                {
                                    if(isNull(folder))
                                    {
                                        callback(null, null);
                                    }
                                    else
                                    {
                                        let userUri;
                                        if(!isNull(req.user))
                                        {
                                            userUri = req.user.uri;
                                        }
                                        else
                                        {
                                            userUri = null;
                                        }

                                        folder.delete(function(err, result){
                                            if(isNull(err))
                                            {
                                                res.status(200).json({
                                                    "result" : "success",
                                                    "message" : "Successfully deleted " + resourceToDelete
                                                });
                                                callback(true, result);
                                            }
                                            else
                                            {
                                                if(err === 404)
                                                {
                                                    const error = "There was already a prior attempt to delete this folder. The folder is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. Error reported : " + result;
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
                                                    callback(err);
                                                }
                                            }
                                        }, userUri, true, req.query.really_delete);
                                    }
                                }
                                else
                                {
                                    res.status(500).json(
                                        {
                                            "result" : "error",
                                            "message" : "Unable to retrieve resource with uri " + resourceToDelete + ". Error reported : " + folder
                                        }
                                    );
                                    callback(err);
                                }
                            });
                        }

                        function deleteFile(callback)
                        {
                            File.findByUri(resourceToDelete, function(err, file){
                                if(isNull(err))
                                {
                                    if(isNull(file))
                                    {
                                        callback(null, null);
                                    }
                                    else
                                    {
                                        let userUri = null;
                                        if(!isNull(req.user))
                                        {
                                            userUri = req.user.uri;
                                        }

                                        file.delete(function(err, result){
                                            if(isNull(err))
                                            {
                                                res.status(200).json({
                                                    "result" : "success",
                                                    "message" : "Successfully deleted " + resourceToDelete
                                                });
                                                callback(err);
                                            }
                                            else
                                            {
                                                if(err === 404)
                                                {
                                                    const error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + resourceToDelete;
                                                    console.error(error);
                                                    res.writeHead(404, error);
                                                    res.end();
                                                    callback(err);
                                                }
                                                else
                                                {
                                                    res.status(500).json(
                                                        {
                                                            "result" : "error",
                                                            "message" : "Error deleting " + resourceToDelete + ". Error reported : " + result
                                                        }
                                                    );
                                                    callback(err);
                                                }
                                            }
                                        }, userUri, reallyDelete);
                                    }
                                }
                                else
                                {
                                    res.status(500).json(
                                        {
                                            "result" : "error",
                                            "message" : "Unable to retrieve resource with uri " + resourceToDelete
                                        }
                                    );
                                    callback(err);
                                }
                            });
                        }

                        const async = require('async');
                        async.tryEach([
                            deleteFolder,
                            deleteFile
                        ]);
                    }
                }
                else
                {
                    res.status(500).json({
                        "result" : "error",
                        "message" : "Error trying to determine if resource " + resourceToDelete + " exists.",
                        "error" : result
                    });
                }
            });
        }
        else
        {
            res.status(405).json({
                "result" : "error",
                "message" : "Invalid request. Unable to determine requested resource URI"
            });
        }
    }
    else
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
};

exports.undelete = function(req, res){
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)
    {
        const resourceToUnDelete = req.params.requestedResourceUri;

        if(!isNull(resourceToUnDelete))
        {
            InformationElement.findByUri(resourceToUnDelete, function(err, result)
            {
                if (isNull(err))
                {
                    if (isNull(result))
                    {
                        res.status(404).json({
                            "result": "error",
                            "message": "Unable to find resource " + resourceToDelete
                        });
                    }
                    else
                    {
                        function undeleteFile(callback)
                        {
                            File.findByUri(resourceToUnDelete, function (err, file)
                            {
                                if (isNull(err))
                                {
                                    file.undelete(function (err, result)
                                    {
                                        if (isNull(err))
                                        {
                                            res.status(200).json({
                                                "result": "success",
                                                "message": "Successfully undeleted " + resourceToUnDelete
                                            });
                                        }
                                        else
                                        {
                                            res.status(500).json(
                                                {
                                                    "result": "error",
                                                    "message": "Error undeleting " + resourceToUnDelete + ". Error reported : " + result
                                                }
                                            );
                                        }

                                        callback(err);
                                    });
                                }
                                else
                                {
                                    res.status(500).json(
                                        {
                                            "result": "error",
                                            "message": "Unable to retrieve resource with uri " + resourceToUnDelete
                                        }
                                    );

                                    callback(err);
                                }
                            });
                        }

                        function unDeleteFolder(callback)
                        {
                            Folder.findByUri(resourceToUnDelete, function (err, folder)
                            {
                                if (isNull(err))
                                {
                                    folder.undelete(function (err, result)
                                    {
                                        if (isNull(err))
                                        {
                                            res.status(200).json({
                                                "result": "success",
                                                "message": "Successfully undeleted " + resourceToUnDelete
                                            });
                                        }
                                        else
                                        {
                                            res.status(500).json(
                                                {
                                                    "result": "error",
                                                    "message": "Error undeleting " + resourceToUnDelete + ". Error reported : " + result
                                                }
                                            );
                                        }

                                        callback(err);
                                    });
                                }
                                else
                                {
                                    res.status(500).json(
                                        {
                                            "result": "error",
                                            "message": "Unable to retrieve resource with uri " + resourceToUnDelete + ". Error reported : " + folder
                                        }
                                    );

                                    callback(err);
                                }
                            });
                        }

                        const async = require('async');
                        async.tryEach([
                            unDeleteFolder,
                            undeleteFile
                        ]);
                    }
                }
                else
                {
                    res.status(500).json({
                        "result": "error",
                        "message": "Error trying to determine if resource " + resourceToUnDelete + " exists.",
                        "error": result
                    });
                }
            });
        }
        else
        {
            res.status(405).json({
                "result" : "error",
                "message" : "Invalid request. Unable to determine requested resource URI"
            });
        }
    }
    else
    {
        res.status(400).json({
            result : "error",
            msg : "HTML Request not valid for this route."
        });
    }
};

exports.mkdir = function(req, res){
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)
    {

        let validateFolderName = function(callback) {
            const newFolderTitle = req.query.mkdir;

            if(!newFolderTitle.match(/^[^\\\/:*?"<>|]{1,}$/g))
            {
                res.status(500).json(
                    {
                        "result" : "error",
                        "message" : "invalid file name specified"
                    }
                );
                
                callback(1);
            }
            else
            {
                callback(null);
            }
        };

        let getProjectRootFolder = function(projectUri, callback)
        {
            Project.findByUri(projectUri, function(err, project){
                if(isNull(err))
                {
                    if(!isNull(project) || !(project instanceof Project))
                    {
                        if(!isNull(project.ddr.rootFolder))
                        {
                            callback(null, project.ddr.rootFolder);
                        }
                        else
                        {
                            callback(1, "Unable to determine root folder of project " + projectUri);
                        }
                    }
                    else
                    {
                        callback(1, "There is no project with uri " + projectUri + ".");
                    }
                }
                else
                {
                    callback(err, project);
                }
            });
        };

        let processRequest = function(parentFolderURI, callback)
        {
            Folder.findByUri(parentFolderURI, function(err, parentFolder)
            {
                if(isNull(err) && !isNull(parentFolder))
                {
                    const newChildFolder = new Folder({
                        nie: {
                            title: req.query.mkdir,
                            isLogicalPartOf: parentFolderURI
                        },
                        ddr : {
                            humanReadableURI : parentFolder.ddr.humanReadableURI + "/" + req.query.mkdir
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
                            if(isNull(err))
                            {
                                newChildFolder.save(function(err, result)
                                {
                                    if(isNull(err))
                                    {
                                        res.json(
                                            {
                                                "status" : "1",
                                                "id" : newChildFolder.uri,
                                                "result" : "ok",
                                                "new_folder" : Descriptor.removeUnauthorizedFromObject(result, [Config.types.private], [Config.types.api_readable])
                                            }
                                        );

                                        callback(null);
                                    }
                                    else
                                    {
                                        res.status(500).json(
                                            {
                                                "result" : "error",
                                                "message" : "error 1 saving new folder :" + result
                                            }
                                        );
                                        
                                        callback(1);
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
                                
                                callback(1);
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
                    
                    callback(1);
                }
            });
        };

        async.waterfall(
            [
                validateFolderName,
                function(callback)
                {
                    if (req.params.is_project_root)
                    {
                        getProjectRootFolder(req.params.requestedResourceUri, function (err, projectUri)
                        {
                            if (err)
                            {
                                callback(err, projectUri);
                            }
                            else
                            {
                                callback(null, projectUri);
                            }
                        });
                    }
                    else
                    {
                        callback(null, req.params.requestedResourceUri);
                    }
                },
                function (parentFolderUri, callback)
                {
                    processRequest(parentFolderUri, callback);
                }
            ]
        );
    }
    else
    {
        res.status(400).send("HTML Request not valid for this route.");
    }
};

exports.ls = function(req, res){
    const resourceURI = req.params.requestedResourceUri;
    let show_deleted = req.query.show_deleted;

    if(req.params.is_project_root)
    {
        Project.findByUri(resourceURI, function(err, project) {
            if(isNull(err))
            {
                if(!isNull(project))
                {
                    project.getFirstLevelDirectoryContents(function(err, files){
                        if(isNull(err))
                        {
                            if(!show_deleted)
                            {
                                const _ = require('underscore');
                                files = _.reject(files, function(file) { return file.ddr.deleted; });
                            }

                            res.json(files);
                        }
                        else
                        {
                            res.status(500).json({
                                result : "error",
                                message : "Unable to fetch project root folder contents."
                            })
                        }
                    });
                }
                else
                {
                    res.status(404).json({
                        result : "error",
                        message : "Unable to fetch project with uri : " + req.params.requestedResourceUri + ". Project not found! "
                    });
                }
            }
            else
            {
                res.status(500).json({
                    result : "error",
                    message : "Unable to fetch project with uri : " + req.params.requestedResourceUri
                })
            }
        });
    }
    else
    {
        Folder.findByUri(resourceURI, function(err, containingFolder)
        {
            if(isNull(err) && !isNull(containingFolder))
            {
                containingFolder.getLogicalParts(function(err, children)
                {

                    if(isNull(err))
                    {
                        if(!show_deleted)
                        {
                            const _ = require('underscore');
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

exports.extension_icon = function(req, res)
{
    const extension = req.params[0];
    if(!isNull(extension) && !isNull(Config.iconableFileExtensions[extension]))
    {
        exports.serve_static(req, res, "/images/icons/extensions/file_extension_" + requestedExtension + ".png", "/images/icons/file.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
    }
    else
    {
        exports.serve_static(req, res, "/images/icons/document_empty.png", "/images/icons/document_empty.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
    }
};

exports.thumbnail = function(req, res)
{
    if(!req.params.is_project_root)
    {
        const path = require('path');

        InformationElement.findByUri(req.params.requestedResourceUri, function(err, resource){
            if(!err)
            {
                if(!isNull(resource))
                {
                    const requestedExtension = resource.ddr.fileExtension;

                    if(isNull(requestedExtension))
                    {
                        exports.serve_static(req, res, "/images/icons/document_empty.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                    }
                    else if(!isNull(requestedExtension) && !isNull(Config.thumbnailableExtensions[requestedExtension]))
                    {
                        exports.get_thumbnail(req, res);
                    }
                    else if(requestedExtension === "" || requestedExtension === "folder")
                    {
                        exports.serve_static(req, res, "/images/icons/folder.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                    }
                    else
                    {
                        if(!isNull(Config.iconableFileExtensions[requestedExtension]))
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
                    exports.serve_static(req, res, "/images/icons/emotion_question.png", "/images/icons/emotion_question.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds, 404);
                }
            }
            else
            {
                exports.serve_static(req, res, "/images/icons/exclamation.png", "/images/icons/exclamation.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds, 500);
            }
        });
    }
    else
    {
        exports.serve_static(req, res, "/images/icons/box_closed.png", "/images/icons/emotion_question.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
    }
};

exports.serve_static = function(req, res, pathOfIntendedFileRelativeToProjectRoot, pathOfFileToServeOnError, staticFileCaching, cachePeriodInSeconds, statusCode){
    const fs = require('fs');
    const path = require('path');
        appDir = path.dirname(require.main.filename);

    if(isNull(statusCode))
        statusCode = 200;

    const pipeFile = function (absPathOfFileToServe, filename, res, lastModified, cachePeriodInSeconds) {
        fs.createReadStream(absPathOfFileToServe);

        if (staticFileCaching === true && (typeof cachePeriodInSeconds === "number")) {
            res.setHeader('Last-Modified', lastModified);
            res.setHeader('Cache-Control', 'public, max-age=' + cachePeriodInSeconds);
            res.setHeader('Date', new Date().toString());
        }

        res.writeHead(statusCode,
            {
                'Content-disposition': 'filename="' + filename + "\"",
                'Content-type': mimeType
            });

        const fileStream = fs.createReadStream(absPathOfFileToServe);
        fileStream.pipe(res);
    };

    if(typeof pathOfIntendedFileRelativeToProjectRoot === "string")
    {
        const fileName = path.basename(pathOfIntendedFileRelativeToProjectRoot);
        const extension = path.extname(pathOfIntendedFileRelativeToProjectRoot).replace(".", "");
        var mimeType = Config.mimeType(extension);
        var absPathOfFileToServe = Pathfinder.absPathInPublicFolder(pathOfIntendedFileRelativeToProjectRoot);

        fs.exists(absPathOfFileToServe, function(exists){
            if(exists)
            {
                fs.stat(absPathOfFileToServe, function(err, stats){
                    if(stats.isFile())
                    {
                        if(staticFileCaching)
                        {
                            let clientLastModifiedTimestamp = req.get("If-Modified-Since");

                            if(!isNull(clientLastModifiedTimestamp))
                            {
                                clientLastModifiedTimestamp = new Date(clientLastModifiedTimestamp);

                                const util = require('util');
                                const mtime = new Date(util.inspect(stats.mtime));

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


                        }
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
                if(!isNull(pathOfFileToServeOnError))
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

exports.recent_changes = function(req, res) {
    const acceptsHTML = req.accepts('html');
    let acceptsJSON = req.accepts('json');

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
    else
    {
        InformationElement.findByUri(req.params.requestedResourceUri, function(err, fileOrFolder){
            if(isNull(err))
            {
                if(!isNull(fileOrFolder) && fileOrFolder instanceof InformationElement)
                {
                    const offset = parseInt(req.query.offset);
                    const limit = parseInt(req.query.limit);

                    fileOrFolder.getOwnerProject(function(err, project){
                        if(isNull(err))
                        {
                            if(!isNull(project) && project instanceof Project)
                            {
                                project.getRecentProjectWideChanges(function(err, changes){
                                    if(isNull(err))
                                    {
                                        res.json(changes);
                                    }
                                    else
                                    {
                                        res.status(500).json({
                                            result : "error",
                                            message : "Error getting recent changes from project : " + project.ddr.humanReadableURI + " : " + changes
                                        });
                                    }
                                },offset , limit);
                            }
                            else
                            {
                                res.status(404).json({
                                    result : "error",
                                    message : "Unable to find owner project of : " + fileOrFolder.ddr.humanReadableURI
                                });
                            }
                        }
                        else
                        {
                            res.status(500).json({
                                result : "error",
                                message : "Error occurred while trying to get the owner project of resource : " + req.params.requestedResourceUri + " : " + project
                            });
                        }
                    });


                }
                else
                {
                    res.status(404).json({
                        result : "error",
                        message : "Unable to find file or folder with uri : " + req.params.requestedResourceUri
                    });
                }
            }
            else
            {
                res.status(500).json({
                    result : "error",
                    message : "Invalid project : " + req.params.requestedResourceUri +  " : " + project
                });
            }
        });
    }
};

exports.data = function(req, res){
    let path = require('path');
    const requestedExtension = path.extname(req.params.filepath).replace(".", "");

    if(!isNull(exports.dataParsers[requestedExtension]))
    {
        const resourceURI = req.params.requestedResourceUri;

        File.findByUri(resourceURI, function(err, file){
            if(isNull(err))
            {
                const mimeType = Config.mimeType(file.ddr.fileExtension);

                file.writeToTempFile(function(err, writtenFilePath)
                {
                    if(isNull(err))
                    {
                        if(!isNull(writtenFilePath))
                        {
                            if(!isNull(exports.dataParsers[file.ddr.fileExtension]))
                            {
                                exports.dataParsers[file.ddr.fileExtension](req, res, writtenFilePath);
                            }
                            else
                            {
                                const error = "Doesn't exist data parser for this format file : " + resourceURI;
                                console.error(error);
                                res.writeHead(500, error);
                                res.end();
                            }


                        }
                        else
                        {
                            const error = "There was an error streaming the requested resource : " + resourceURI;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }
                    }
                    else
                    {
                        if(err === 404)
                        {
                            const error = "There was already a prior attempt to delete this file. The file is now deleted but still appears in the file explorer due to a past error. Try deleting it again to fix the issue. " + resourceURI;
                            console.error(error);
                            res.writeHead(404, error);
                            res.end();
                        }
                        else
                        {
                            const error = "Unable to produce temporary file to download "+resourceURI +". Error reported :" + writtenFilePath;
                            console.error(error);
                            res.writeHead(500, error);
                            res.end();
                        }
                    }
                });
            }
            else
            {
                const error = "Non-existent file : " + resourceURI;
                console.error(error);
                res.writeHead(404, error);
                res.end();
            }
        });
    }
    else
    {
        const projects = require(Pathfinder.absPathInSrcFolder("/controllers/projects.js"));
        projects.show(req, res);
    }
};


exports.owner_project = function(req, res){
    const resourceURI = req.params.requestedResourceUri;

    InformationElement.findByUri(resourceURI, function(err, ie){
        if(isNull(err))
        {
            if(!isNull(ie))
            {
                ie.getOwnerProject(function(err, ownerProject){
                    if(isNull(err))
                    {
                        if(!isNull(ownerProject))
                        {
                            res.json({
                                result : "ok",
                                uri : ownerProject.uri
                            });
                        }
                        else
                        {
                            const error = "Resource : " + resourceURI  + " does not have an owner project.";
                            console.error(error);
                            res.status(404).json({
                                result : "error",
                                message : error
                            });
                        }
                    }
                    else
                    {
                        const error = "Error fetching owner project of resource : " + resourceURI + ":" + ownerProject;
                        console.error(error);
                        res.status(500).json({
                            result : "error",
                            message : error
                        });
                    }
                });
            }
            else
            {
                const error = "Non-existent resource : " + resourceURI;
                console.error(error);
                res.status(404).json({
                    result : "error",
                    message : error
                });
            }
        }
        else
        {
            const error = "Error accessing resource : " + resourceURI + ":" + ie;
            console.error(error);
            res.status(500).json({
                result : "error",
                message : error
            });
        }

    });
};

xlsFileParser = function (req, res, filePath){
    const excelParser = require('excel-parser');

    excelParser.parse({
        inFile: filePath,
        worksheet: 1,
        skipEmpty: false
    },function(err, records){
        deleteTempFile(filePath);
        if(err){
        const error = "Unable to produce JSON representation of file :" + filePath + "Error reported: " + err + ".\n Cause : " + records + " \n ";
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


    const fs = require('fs');
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) throw err;
        deleteTempFile(filePath);
        const CSV = require('csv-string'),
            arr = CSV.parse(data);
        res.json(arr);
    });
};

textFileParser = function (req,res,filePath){
    const fs = require('fs');
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

};

deleteTempFile = function(filePath){
    const fs = require('fs');

    fs.unlink(filePath, function (err) {
        if (err) throw err;
        console.log('successfully deleted temporary file ' +filePath);
    });
};
