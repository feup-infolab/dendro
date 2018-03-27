const path = require("path");
const Pathfinder = global.Pathfinder;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const projects = require(Pathfinder.absPathInSrcFolder("/controllers/projects.js"));
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

//TODO Class ImportProjectJob
//TODO Job.js(class) na raiz pasta jobs
    //TODO methods start, finish
module.exports = function (agenda) {
    agenda.define("import project", function (job, done) {
        let uploadedBackupAbsPath = job.attrs.data.uploadedBackupAbsPath;
        let userAndSessionInfo = job.attrs.data.userAndSessionInfo;
        let newProject = job.attrs.data.newProject;
        let runAsJob = true;
        projects.processImport(newProject.uri, uploadedBackupAbsPath, userAndSessionInfo, function (err, info) {
            if (isNull(err))
            {
                Logger.log("info", "Project with uri: " + newProject.uri + " was successfully restored");
                Logger.log("info", "Will remove job");
                done();
            }
            else
            {
                Logger.log("error", "Error restoring a project with uri: " + newProject.uri + ", error: " + JSON.stringify(info));
                if(!isNull(newProject))
                {
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
        }, runAsJob);
    });
};