const path = require("path");
const Pathfinder = global.Pathfinder;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

module.exports = function (agenda) {
    agenda.define("import project", function (job, done) {
        let uploadedBackupAbsPath = job.attrs.data.uploadedBackupAbsPath;
        let userAndSessionInfo = job.attrs.data.userAndSessionInfo;
        let newProject = job.attrs.data.newProject;
        const processImport = function (createdProject, callback)
        {
            const getMetadata = function (absPathOfBagItBackupRootFolder, callback)
            {
                const bagItMetadataFileAbsPath = path.join(absPathOfBagItBackupRootFolder, "bag-info.txt");
                const projectDescriptors = [];

                const lineReader = require("readline").createInterface({
                    input: require("fs").createReadStream(bagItMetadataFileAbsPath)
                });

                const getDescriptor = function (line)
                {
                    const fieldMatcher = {
                        "Source-Organization": "dcterms:publisher",
                        "Organization-Address": "schema:address",
                        "Contact-Name": "schema:provider",
                        "Contact-Phone": "schema:telephone",
                        "External-Description": "dcterms:description",
                        "Contact-Email": "schema:email"
                    };

                    const separator = line.indexOf(":");

                    if (separator)
                    {
                        const bagitField = line.substring(0, separator);
                        const bagitValue = line.substring(separator + 2); // 2 extra char after index of : must be rejected, which is the space.
                        const descriptor = fieldMatcher[bagitField];

                        if (descriptor)
                        {
                            return new Descriptor({
                                prefixedForm: descriptor,
                                value: bagitValue
                            });
                        }
                        return null;
                    }
                    return null;
                };

                lineReader.on("line", function (line)
                {
                    if (!isNull(line))
                    {
                        const descriptor = getDescriptor(line);
                        if (descriptor)
                        {
                            projectDescriptors.push(descriptor);
                        }
                    }
                });

                lineReader.on("close", function (line)
                {
                    callback(projectDescriptors);
                });
            };

            if (path.extname(uploadedBackupAbsPath) === ".zip")
            {
                Project.unzipAndValidateBagItBackupStructure(
                    uploadedBackupAbsPath,
                    Config.maxProjectSize,
                    userAndSessionInfo,
                    function (err, valid, absPathOfDataRootFolder, absPathOfUnzippedBagIt)
                    {
                        const parentPath = path.resolve(uploadedBackupAbsPath, "..");
                        if(!isNull(parentPath))
                        {
                            File.deleteOnLocalFileSystem(parentPath, function (err, result)
                            {
                                if (!isNull(err))
                                {
                                    Logger.log("error", "Error occurred while deleting backup zip file at " + parentPath + " : " + JSON.stringify(result));
                                }
                            });
                        }
                        else
                        {
                            Logger.log("error", "Could not calculate parent path of: " + uploadedBackupAbsPath);
                        }

                        if (isNull(err))
                        {
                            if (valid)
                            {
                                getMetadata(absPathOfUnzippedBagIt, function (descriptors)
                                {
                                    // by default the project is private on import
                                    Project.findByUri(newProject.uri, function (err, createdProject) {
                                        if(isNull(err))
                                        {
                                            if(!isNull(createdProject))
                                            {
                                                createdProject.updateDescriptors(descriptors);

                                                // all imported projects will use default storage by default.
                                                // later we will add parameters for storage in the import screen
                                                // and projects can be imported directly to any kind of storage
                                                Project.createAndInsertFromObject(createdProject, function (err, createdProject)
                                                {
                                                    if (isNull(err))
                                                    {
                                                        //newProject.restoreFromFolder(absPathOfDataRootFolder, req.user, true, true, function (err, result)
                                                        createdProject.restoreFromFolder(absPathOfDataRootFolder, userAndSessionInfo.user, true, true, function (err, result)
                                                        {
                                                            File.deleteOnLocalFileSystem(absPathOfUnzippedBagIt, function (err, result)
                                                            {
                                                                if (!isNull(err))
                                                                {
                                                                    Logger.log("error", "Error occurred while deleting absPathOfUnzippedBagIt at " + absPathOfUnzippedBagIt + " : " + JSON.stringify(result));
                                                                }
                                                            });

                                                            if (isNull(err))
                                                            {
                                                                delete createdProject.ddr.is_being_imported;
                                                                createdProject.save(function (err, result)
                                                                {
                                                                    if (isNull(err))
                                                                    {
                                                                        callback(null,
                                                                            {
                                                                                result: "ok",
                                                                                message: "Project imported successfully.",
                                                                                new_project: createdProject.uri
                                                                            }
                                                                        );
                                                                    }
                                                                    else
                                                                    {
                                                                        callback(500,
                                                                            {
                                                                                result: "error",
                                                                                message: "Error marking project restore as complete.",
                                                                                error: result
                                                                            }
                                                                        );
                                                                    }
                                                                });
                                                            }
                                                            else
                                                            {
                                                                callback(500,
                                                                    {
                                                                        result: "error",
                                                                        message: "Error restoring project contents from unzipped backup folder",
                                                                        error: result
                                                                    }
                                                                );
                                                            }
                                                        });
                                                    }
                                                    else
                                                    {
                                                        File.deleteOnLocalFileSystem(absPathOfUnzippedBagIt, function (err, result)
                                                        {
                                                            if (!isNull(err))
                                                            {
                                                                Logger.log("error", "Error occurred while deleting absPathOfUnzippedBagIt at " + absPathOfUnzippedBagIt + " : " + JSON.stringify(result));
                                                            }
                                                        });

                                                        callback(500,
                                                            {
                                                                result: "error",
                                                                message: "Error creating new project record before import operation could start",
                                                                error: createdProject
                                                            }
                                                        );
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                Logger.log("error", "Error at importProjectJob, project with uri: " + newProject.uri +  " does not exist");
                                                Logger.log("error", "Will remove job");
                                                job.remove(function(err) {
                                                    if(isNull(err))
                                                    {
                                                        Logger.log("info", 'Successfully removed job from collection');
                                                    }
                                                    else
                                                    {
                                                        Logger.log("error", 'Could not remove job from collection');
                                                    }
                                                })
                                            }
                                        }
                                        else
                                        {
                                            Logger.log("error", "Error at importProjectJob, error: " + JSON.stringify(newProject));
                                            Logger.log("error", "Will remove job");
                                            job.remove(function(err) {
                                                if(isNull(err))
                                                {
                                                    Logger.log("info", 'Successfully removed job from collection');
                                                }
                                                else
                                                {
                                                    Logger.log("error", 'Could not remove job from collection');
                                                }
                                            })
                                        }
                                    });
                                });
                            }
                            else
                            {
                                File.deleteOnLocalFileSystem(absPathOfUnzippedBagIt, function (err, result)
                                {
                                    if (!isNull(err))
                                    {
                                        Logger.log("error", "Error occurred while deleting absPathOfUnzippedBagIt at " + absPathOfUnzippedBagIt + " : " + JSON.stringify(result));
                                    }
                                });
                                callback(400,
                                    {
                                        result: "error",
                                        message: "Invalid project structure. Is this a BagIt-format Zip file?",
                                        error: valid
                                    }
                                );
                            }
                        }
                        else
                        {
                            File.deleteOnLocalFileSystem(absPathOfUnzippedBagIt, function (err, result)
                            {
                                if (!isNull(err))
                                {
                                    Logger.log("error", "Error occurred while deleting absPathOfUnzippedBagIt at " + absPathOfUnzippedBagIt + " : " + JSON.stringify(result));
                                }
                            });

                            const msg = "Error restoring zip file to folder : " + valid;
                            Logger.log("error", msg);

                            callback(500, {
                                result: "error",
                                message: msg
                            });
                        }
                    });
            }
            else
            {
                callback(400, {
                    result: "error",
                    message: "Backup file is not a .zip file"
                });
            }
        };

        processImport(newProject, function (err, info) {
            if (isNull(err))
            {
                Logger.log("info", "Project with uri: " + newProject.uri + " was successfully restored");
                Logger.log("info", "Will remove job");
                done();
                /*job.remove(function(err) {
                    if(isNull(err))
                    {
                        Logger.log("info", 'Successfully removed job from collection');
                    }
                    else
                    {
                        Logger.log("error", 'Could not remove job from collection');
                    }
                    done();
                });*/
            }
            else
            {
                Logger.log("error", "Error restoring a project with uri: " + newProject.uri + ", error: " + JSON.stringify(info));
                if(!isNull(newProject))
                {
                    /*delete newProject.ddr.is_being_imported;
                    newProject.ddr.hasErrors = "There was an error during a project restore, error message : " + JSON.stringify(info);
                    newProject.save(function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error when saving a project error message from a restore operation, error: " + JSON.stringify(result));
                        }
                        done(JSON.stringify(info))
                    });*/
                    Project.findByUri(newProject.uri, function (err, createdProject) {
                        if(isNull(err))
                        {
                            if(!isNull(createdProject))
                            {
                                delete createdProject.ddr.is_being_imported;
                                createdProject.ddr.hasErrors = "There was an error during a project restore, error message : " + JSON.stringify(info);
                                createdProject.save(function (err, result)
                                {
                                    if (!isNull(err))
                                    {
                                        Logger.log("error", "Error when saving a project error message from a restore operation, error: " + JSON.stringify(result));
                                    }
                                    done(JSON.stringify(info))
                                });
                            }
                            else
                            {
                                Logger.log("error", "Error at importProjectJob, project with uri: " + newProject.uri +  " does not exist");
                                Logger.log("error", "Will remove job");
                                job.remove(function(err) {
                                    if(isNull(err))
                                    {
                                        Logger.log("info", 'Successfully removed job from collection');
                                    }
                                    else
                                    {
                                        Logger.log("error", 'Could not remove job from collection');
                                    }
                                })
                            }
                        }
                        else
                        {
                            Logger.log("error", "Error at importProjectJob, error: " + JSON.stringify(createdProject));
                            Logger.log("error", "Will remove job");
                            job.remove(function(err) {
                                if(isNull(err))
                                {
                                    Logger.log("info", 'Successfully removed job from collection');
                                }
                                else
                                {
                                    Logger.log("error", 'Could not remove job from collection');
                                }
                            })
                        }
                    });
                }
            }
        });
    });
};