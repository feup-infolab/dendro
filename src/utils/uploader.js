const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

const async = require("async");
const fs = require("fs");
const md5File = require("md5-file");
const multiparty = require("multiparty");
const tmp = require("tmp");

const Uploader = function()
{

};

Uploader.prototype.handleUpload = function(req, res, uploadCompleteCallback)
{
    const upload_id = req.query.upload_id;
    const upload = UploadManager.get_upload_by_id(upload_id);
    const username = req.query.username;
    const filename = req.query.filename;
    const size = req.query.size;
    const restart = req.query.restart;
    let md5_checksum = req.query.md5_checksum;

    const processChunkedUpload = function(upload, callback) {
        if (!isNull(upload))
        {
            const form = new multiparty.Form({maxFieldSize: 8192, maxFields: 10, autoFiles: false});

            form.on('error', function (err)
            {
                UploadManager.destroy_upload(upload.id, function (err)
                {
                    if (err)
                    {
                        console.error("Error destroying upload " + upload.id);
                        console.error(err);
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

            // Parts are emitted when parsing the form
            form.on('part', function(part) {

                if (!part.filename) {
                    part.resume();
                }

                if (part.filename) {
                    upload.pipe(part, function(err){
                        if(isNull(err))
                        {
                            if(upload.is_finished())
                            {
                                req.files = [{
                                    path: upload.temp_file,
                                    name: upload.filename
                                }];

                                md5File(upload.temp_file, function (err, hash) {
                                    if (isNull(err)) {
                                        if (md5_checksum !== hash) {
                                            callback(400, {
                                                result: "error",
                                                message: "File was corrupted during transfer. Please repeat this upload.",
                                                error: "invalid_checksum",
                                                calculated_at_server: hash,
                                                calculated_at_client: md5_checksum
                                            });
                                        }
                                        else
                                        {
                                            //TODO replace with final processing of files (Saving + metadata)
                                            uploadCompleteCallback(null, req.files);
                                        }
                                    }
                                    else {
                                        callback(500, {
                                            result: "error",
                                            message: "Unable to calculate the MD5 checksum of the uploaded file: " + file.name,
                                            error: hash
                                        });
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
                            callback(500, {
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

    const processNormalUpload = function(callback) {
        const readFilesFromRequestBody = function(callback) {
            let files = [],
                filesCounter = 0,
                allFinished = false,
                fstream;

            function allDone(filesCounter, finished)
            {
                if(finished)
                {
                    allFinished = true;
                }

                if(filesCounter === 0 && allFinished)
                {
                    callback(null, files);
                }
            }

            req.busboy.on('file', function (fieldname, file, filename) {
                ++filesCounter;

                tmp.dir({dir : Config.tempFilesDir}, function _tempDirCreated(err, tempFolderPath) {
                    if(isNull(err))
                    {
                        let newFileLocalPath = path.join(tempFolderPath, filename);
                        fstream = fs.createWriteStream(newFileLocalPath);

                        fstream.on('error', function () {
                            return callback(1, "Error saving file from request into temporary file");
                        });

                        fstream.on('finish', function() {
                            --filesCounter;

                            files.push({
                                path : newFileLocalPath,
                                name : filename
                            });

                            allDone(filesCounter, false);
                        });

                        file.pipe(fstream);
                    }
                    else
                    {
                        return uploadCompleteCallback(1, "Error creating temporary folder for receiving file from request into temporary file");
                    }
                });
            });

            req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
                req.resume();
            });

            req.busboy.on('finish', function() {
                allDone(filesCounter, true);
            });

            req.pipe(req.busboy);
        };

        readFilesFromRequestBody(function(err, files)
        {
            callback(err, files);
        });
    };

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
                                    uploadCompleteCallback(400, {
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

                    typeof md5_checksum !== "undefined" &&
                    md5_checksum !== "" &&

                    !isNull(req.params.requestedResourceUri) &&
                    req.params.requestedResourceUri !== ""
                )
                {
                    UploadManager.add_upload(
                        username,
                        filename,
                        size,
                        md5_checksum,
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
                                uploadCompleteCallback(500, {
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
        if(!isNull(username) && !isNull(filename) && !isNull(size) && !isNull(md5_checksum))
        {
            if(!isNull(upload.md5_checksum) && upload.md5_checksum.match(/^[a-f0-9]{32}$/))
            {
                processChunkedUpload(upload, uploadCompleteCallback);
            }
            else
            {
                return uploadCompleteCallback(400, {
                    result: "error",
                    message: "Missing md5_checksum parameter or invalid parameter specified. It must match regex /^[a-f0-9]{32}$/. You need to supply a valid MD5 sum of your file for starting an upload.",
                    files: fileNames
                });
            }
        }
        else
        {
            processNormalUpload(uploadCompleteCallback);
        }
    }
}

module.exports.Uploader = Uploader;

