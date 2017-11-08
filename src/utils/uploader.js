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

const Uploader = function ()
{

};

Uploader.prototype.handleUpload = function (req, res, callback)
{
    const restart = req.query.restart;
    const upload_id = req.query.upload_id;
    const upload = UploadManager.get_upload_by_id(upload_id);
    const username = req.query.username;
    const filename = req.query.filename;
    let size = req.query.size;

    if (!isNull(size))
    {
        try
        {
            size = parseInt(size);
        }
        catch (e)
        {
            return res.status(400).json({
                result: "error",
                message: "The 'size' field, which should be length of the uploaded file in bytes, is not a valid integer."
            });
        }
    }

    let md5_checksum = req.query.md5_checksum;

    const processChunkedUpload = function (upload, callback)
    {
    // console.log("Recebi um chunk do ficheiro " + filename + " para o upload id " + upload_id);

        if (isNull(username))
        {
            return res.status(400).json({
                result: "error",
                message: "Request is missing the 'username' field, which should be the currently logged in user."
            });
        }

        if (isNull(filename))
        {
            return res.status(400).json({
                result: "error",
                message: "Request is missing the 'filename' field, which should be the name of the file being uploaded."
            });
        }

        if (isNull(size))
        {
            return res.status(400).json({
                result: "error",
                message: "Request is missing the 'size' field, which should be length of the uploaded file in bytes."
            });
        }

        if (!isNull(upload) &&
            (
                upload.username !== username ||
                upload.filename !== filename ||
                upload.expected !== size ||
                upload.id !== upload_id
            )
        )
        {
            return res.status(400).json({
                result: "error",
                message: "Invalid request for appending data to upload : " + upload_id,
                error: {
                    invalid_username: !(upload.username === username),
                    invalid_filename: !(upload.filename === filename),
                    invalid_size: !(upload.expected === size),
                    id: !(upload.id === upload_id)
                }
            });
        }

        if (!isNull(upload) && upload !== "")
        {
            const form = new multiparty.Form({maxFieldSize: 8192, maxFields: 10, autoFiles: false});

            form.on("error", function (err)
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

            form.on("aborted", function ()
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
            form.on("part", function (part)
            {
                if (!part.filename)
                {
                    part.resume();
                }

                if (part.filename)
                {
                    upload.pipe(part, function (err)
                    {
                        if (isNull(err))
                        {
                            if (upload.is_finished())
                            {
                                req.files = [{
                                    path: upload.temp_file,
                                    name: upload.filename
                                }];

                                md5File(upload.temp_file, function (err, hash)
                                {
                                    if (isNull(err))
                                    {
                                        if (!isNull(hash) && hash !== md5_checksum)
                                        {
                                            res.status(400).json({
                                                result: "error",
                                                message: "File was corrupted during transfer. Please repeat this upload.",
                                                error: "invalid_checksum",
                                                calculated_at_server: hash,
                                                calculated_at_client: md5_checksum
                                            });
                                        }
                                        else
                                        {
                                            // TODO replace with final processing of files (Saving + metadata)
                                            callback(null, req.files);
                                        }
                                    }
                                    else
                                    {
                                        res.status(500).json({
                                            result: "error",
                                            message: "Unable to calculate the MD5 checksum of the uploaded file: " + file.name,
                                            error: hash
                                        });
                                    }
                                });
                            }
                            else
                            {
                                res.json({
                                    size: upload.expected
                                });
                            }
                        }
                        else
                        {
                            res.status(500).json({
                                result: "error",
                                message: "There was an error writing a part of the upload to the server."
                            });
                        }
                    });
                }

                part.on("error", function (err)
                {
                    // decide what to do
                });
            });

            // Parse req
            form.parse(req);
        }
        else
        {
            res.status(500).json({
                result: "error",
                message: "Upload ID not recognized. Please restart uploading " + req.query.filename + "from the beginning."
            });
        }
    };

    const processNormalUpload = function (callback)
    {
        const readFilesFromRequestBody = function (callback)
        {
            let files = [],
                filesCounter = 0,
                allFinished = false,
                fstream;

            function allDone (filesCounter, finished)
            {
                if (finished)
                {
                    allFinished = true;
                }

                if (filesCounter === 0 && allFinished)
                {
                    callback(null, files);
                }
            }

            req.busboy.on("file", function (fieldname, file, filename)
            {
                ++filesCounter;
                let fileSize = 0;

                tmp.dir({dir: Config.tempFilesDir}, function _tempDirCreated (err, tempFolderPath)
                {
                    if (isNull(err))
                    {
                        let newFileLocalPath = path.join(tempFolderPath, filename);
                        fstream = fs.createWriteStream(newFileLocalPath);

                        fstream.on("error", function ()
                        {
                            return callback(1, "Error saving file from request into temporary file");
                        });

                        file.on("data", function (data)
                        {
                            fileSize += data.length;
                        });

                        fstream.on("finish", function ()
                        {
                            --filesCounter;

                            if (fileSize === 0)
                            {
                                // if the file is empty push it to the array but with an error message of
                                files.push({
                                    path: newFileLocalPath,
                                    name: filename,
                                    error: "Invalid file size! You cannot upload empty files!"
                                });
                            }
                            else
                            {
                                files.push({
                                    path: newFileLocalPath,
                                    name: filename
                                });
                            }
                            allDone(filesCounter, false);
                        });

                        file.pipe(fstream);
                    }
                    else
                    {
                        return callback(1, "Error creating temporary folder for receiving file from request into temporary file");
                    }
                });
            });

            req.busboy.on("field", function (fieldname, val, fieldnameTruncated, valTruncated)
            {
                req.resume();
            });

            req.busboy.on("finish", function ()
            {
                allDone(filesCounter, true);
            });

            req.pipe(req.busboy);
        };

        readFilesFromRequestBody(function (err, files)
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
                        if (restart)
                        {
                            upload.restart(function (err, result)
                            {
                                if (isNull(err))
                                {
                                    res.json({
                                        size: upload.loaded
                                    });
                                }
                                else
                                {
                                    res.status(400).json({
                                        result: "result",
                                        message: "Error resetting upload."
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
                        res.status(400).json({
                            result: "error",
                            message: "Unable to validate upload request. Are you sure that the username and upload_id parameters are correct?"
                        });
                    }
                }
                else
                {
                    res.status(400).json({
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
                    md5_checksum !== ""
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
                    message: "You must supply the username of the user who is trying to perform the upload. Parameter 'username' is missing."
                });
            }
        }
    }
    else if (req.originalMethod === "POST")
    {
        if (!isNull(username) && !isNull(filename) && !isNull(size) && !isNull(md5_checksum))
        {
            if (!isNull(upload.md5_checksum) && upload.md5_checksum.match(/^[a-f0-9]{32}$/))
            {
                if (req.query.size && !isNaN(req.query.size) && req.query.size > 0)
                {
                    processChunkedUpload(upload, function (err, result)
                    {
                        if (isNull(err))
                        {
                            console.log("Completed upload of file " + filename + " !! " + new Date().toISOString());
                            callback(err, result);
                        }
                        else
                        {
                            res.status(err).json({
                                result: "error",
                                message: "There were errors processing your upload",
                                error: result,
                                files: fileNames
                            });
                        }
                    });
                }
                else
                {
                    res.status(412).json({
                        result: "error",
                        message: "Invalid file size! You cannot upload empty files!"
                    });
                }
            }
            else
            {
                res.status(400).json({
                    result: "error",
                    message: "Missing md5_checksum parameter or invalid parameter specified. It must match regex /^[a-f0-9]{32}$/. You need to supply a valid MD5 sum of your file for starting an upload.",
                    files: fileNames
                });
            }
        }
        else
        {
            processNormalUpload(callback);
        }
    }
};

exports.resume = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (req.originalMethod === "GET")
    {
        const resume = req.query.resume;
        const upload_id = req.query.upload_id;
        const username = req.query.username;

        if (!isNull(resume))
        {
            if (typeof req.session.upload_manager !== "undefined")
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
        if (acceptsJSON && !acceptsHTML)
        {
            const msg = "This is only accessible via GET method";
            req.flash("error", "Invalid Request");
            console.log(msg);
            res.status(400).render("",
                {
                }
            );
        }
        else
        {
            res.status(400).json({
                result: "error",
                msg: "This API functionality is only accessible via GET method."
            });
        }
    }
};

module.exports.Uploader = Uploader;
