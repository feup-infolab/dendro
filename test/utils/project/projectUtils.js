const chai = require("chai");
const fs = require("fs");
const tmp = require("tmp");
const path = require("path");
const async = require("async");
const chaiHttp = require("chai-http");
const _ = require("underscore");
const recursive = require("recursive-readdir");

chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const File = require(Pathfinder.absPathInSrcFolder("models/directory_structure/file.js")).File;

const binaryParser = function (res, cb) {
    res.setEncoding("binary");
    res.data = "";
    res.on("data", function (chunk) {
        res.data += chunk;
    });
    res.on("end", function () {
        cb(null, new Buffer(res.data, "binary"));
    });
};

const listAllMyProjects = function (jsonOnly, agent, cb) {
    const path = "/projects/my";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const listAllProjects = function (jsonOnly, agent, cb) {
    const path = "/projects";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getNewProjectPage = function (jsonOnly, agent, cb) {
    const path = "/projects/new";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const createNewProject = function (jsonOnly, agent, projectData, cb) {
    if (jsonOnly) {
        agent
            .post('/projects/new')
            .set("Accept", "application/json")
            .send(projectData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post('/projects/new')
            .send(projectData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const viewProject = function (jsonOnly, agent, projectHandle, cb) {
    if (jsonOnly) {
        agent
            .get('/project/' + projectHandle)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const updateMetadataWrongRoute = function (jsonOnly, agent, projectHandle, metadata, cb) {
    if (jsonOnly) {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .set("Accept", "application/json")
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


const updateMetadataCorrectRoute = function (jsonOnly, agent, projectHandle, folderPath, metadata, cb) {
    ///project/:handle/data/folderpath?update_metadata
    const path = '/project/' + projectHandle + '/data/' + folderPath + '?update_metadata';
    if (jsonOnly) {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set("Content-Type", "application/json")
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getMetadataRecomendationsForProject = function (jsonOnly, agent, projectHandle, cb) {
    if (jsonOnly) {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set('Accept', 'text/html')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getRecommendationOntologiesForProject = function (jsonOnly, agent, projectHandle, cb) {
    //recommendation_ontologies
    const path = '/project/' + projectHandle + '?recommendation_ontologies';
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


const getProjectRootContent = function (jsonOnly, agent, projectHandle, cb) {
    if (jsonOnly) {
        agent
            .get('/project/' + projectHandle + '?ls')
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get('/project/' + projectHandle + '?ls')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


const getResourceMetadata = function (jsonOnly, agent, projectHandle, folderPath, cb) {
    //http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    const path = '/project/' + projectHandle + '/data/' + folderPath + '?metadata';
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getProjectMetadata = function (jsonOnly, agent, projectHandle, cb) {
    const path = '/project/' + projectHandle + '?metadata';
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getProjectMetadataDeep = function (jsonOnly, agent, projectHandle, cb) {
    const path = '/project/' + projectHandle + '?metadata&deep';
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const removeDescriptorFromFolder = function (jsonOnly, agent, projectHandle, folderPath, prefixedForm, cb) {
    getResourceMetadata(jsonOnly, agent, projectHandle, folderPath, function (err, res) {
        const descriptors = JSON.parse(res.text).descriptors;
        const newDescriptors = _.reject(descriptors, function (descriptor) {
            return descriptor.prefixedForm == prefixedForm;
        });
        updateMetadataCorrectRoute(jsonOnly, agent, projectHandle, folderPath, newDescriptors, function (error, response) {
            cb(error, response);
        });
    });
};

const getProjectVersion = function (jsonOnly, agent, projectHandle, version, cb) {
    //project/:handle?version
    const path = '/project/' + projectHandle;
    if (jsonOnly) {
        agent
            .get(path)
            .query({version: version})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({version: version})
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const importProjectHTMLPage = function (jsonOnly, agent, cb) {
    // /projects/import
    const path = "/projects/import";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const importProject = function (jsonOnly, agent, projectBackupPath, cb) {
    // /projects/import
    const path = "/projects/import";
    if (jsonOnly) {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .attach('file', projectBackupPath)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set("Content-Type", "application/json")
            .attach('file', projectBackupPath)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getRequestProjectAccessPage = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/request_access
    const path = "/project/" + projectHandle + "?request_access";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const requestAccessToProject = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/request_access
    const path = "/project/" + projectHandle + "?request_access";
    if (jsonOnly) {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const deleteProject = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/delete
    const path = "/project/" + projectHandle + "?delete";
    if (jsonOnly) {
        agent
            .delete(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .delete(path)
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const undeleteProject = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/undelete
    const path = "/project/" + projectHandle + "?undelete";
    if (jsonOnly) {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const createFolderInProjectRoot = function (jsonOnly, agent, projectHandle, folderName, cb) {
    // /project/:handle?mkdir
    const path = "/project/" + projectHandle;
    if (jsonOnly) {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .query({mkdir: folderName})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .query({mkdir: folderName})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getProjectRecentChanges = function (jsonOnly, agent, projectHandle, cb) {
    ///project/:handle?recent_changes
    const path = '/project/' + projectHandle + '?recent_changes';
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const administer = function (agent, modify, projectData, projectHandle, cb) {
    if (modify) {
        agent
            .post('/project/' + projectHandle + '?administer')
            .send(projectData)
            .end(function (err, res) {
                cb(err, res);
            });
    } else {
        agent
            .get('/project/' + projectHandle + '?administer')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const bagit = function (agent, projectHandle, cb) {
    agent
        .get('/project/' + projectHandle + '?bagit')
        .buffer()
        .parse(binaryParser)
        .end(function (err, res) {
            cb(err, res);
        });
};

const getProjectContributors = function (agent, projectHandle, cb) {
    //project/proj1?get_contributors
    const path = "/project/" + projectHandle + "?get_contributors";
    agent
        .get(path)
        .end(function (err, res) {
            cb(err, res);
        });
};

const getContentsOfFile = function(zipPath, callback)
{
    File.unzip(zipPath, function(err, pathOfUnzippedContents){
        let contentsOfZippedFile = "";
        recursive(pathOfUnzippedContents, function (err, files)
        {
            if (!err)
            {
                for(let i = 0; i < files.length; i++)
                {
                    let file = files[i];
                    file = files[i].replace(pathOfUnzippedContents, "");
                    contentsOfZippedFile += file;
                }

                callback(null, contentsOfZippedFile);
            }
            else
            {
                callback(err);
            }
        });
    });
};

const getMetadataFromBackup = function(zipPath, callback)
{
    File.unzip(zipPath, function(err, pathOfUnzippedContents){
        const metadataFilePath = path.join(pathOfUnzippedContents, "bag-info.txt");
        const metadataContents = fs.readFileSync(metadataFilePath, "utf8");
        callback(err, metadataContents);
    });
};

const metadataMatchesBackup = function (project, bodyBuffer, callback) {
    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath) {
            if(!err)
            {
                const tempBackupFilePath = path.join(tempFolderPath, project.handle + ".zip");
                const mockBackupFilePath = Pathfinder.absPathInTestsFolder(path.join("mockdata", "projects", "projectBackups", project.handle + ".zip"));
                fs.writeFileSync(tempBackupFilePath, bodyBuffer);

                getMetadataFromBackup(tempBackupFilePath, function(err1, result1){
                    getMetadataFromBackup(mockBackupFilePath, function(err2, result2){
                        if(!err1 && !err2)
                        {
                            callback(null, result1 === result2);
                        }
                        else
                        {
                            callback(1);
                        }
                    });
                });
            }
            else
            {
                callback(err);
            }
        });
};

const contentsMatchBackup = function (project, bodyBuffer, callback) {
    const fs = require("fs");
    const tmp = require("tmp");
    const path = require("path");

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath) {
            if(!err)
            {
                const tempBackupFilePath = path.join(tempFolderPath, project.handle + ".zip");
                const mockBackupFilePath = Pathfinder.absPathInTestsFolder(path.join("mockdata", "projects", "projectBackups", project.handle + ".zip"));
                fs.writeFileSync(tempBackupFilePath, bodyBuffer);

                getContentsOfFile(tempBackupFilePath, function(err1, result1){
                    getContentsOfFile(mockBackupFilePath, function(err2, result2){
                        if(!err1 && !err2)
                        {
                            callback(null, result1 === result2);
                        }
                        else
                        {
                            callback(1);
                        }
                    });
                });
            }
            else
            {
                callback(err);
            }
        });

};

module.exports = {
    updateMetadataCorrectRoute : updateMetadataCorrectRoute,
    listAllMyProjects : listAllMyProjects,
    listAllProjects : listAllProjects,
    getNewProjectPage : getNewProjectPage,
    createNewProject : createNewProject,
    viewProject : viewProject,
    updateMetadataWrongRoute : updateMetadataWrongRoute,
    getMetadataRecomendationsForProject : getMetadataRecomendationsForProject,
    getProjectRootContent : getProjectRootContent,
    getResourceMetadata : getResourceMetadata,
    removeDescriptorFromFolder : removeDescriptorFromFolder,
    getProjectRecentChanges : getProjectRecentChanges,
    getProjectVersion : getProjectVersion,
    importProjectHTMLPage: importProjectHTMLPage,
    importProject: importProject,
    getRequestProjectAccessPage: getRequestProjectAccessPage,
    requestAccessToProject: requestAccessToProject,
    deleteProject: deleteProject,
    undeleteProject: undeleteProject,
    createFolderInProjectRoot: createFolderInProjectRoot,
    administer : administer,
    bagit : bagit,
    getProjectContributors: getProjectContributors,
    getRecommendationOntologiesForProject: getRecommendationOntologiesForProject,
    getProjectMetadata: getProjectMetadata,
    getProjectMetadataDeep: getProjectMetadataDeep,
    contentsMatchBackup : contentsMatchBackup,
    metadataMatchesBackup : metadataMatchesBackup
};
