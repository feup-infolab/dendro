const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('underscore');
chai.use(chaiHttp);


const listAllMyProjects = function (jsonOnly, agent, cb) {
    const path = "/projects/my";
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const updateMetadataWrongRoute = function (jsonOnly, agent, projectHandle, metadata, cb) {
    if (jsonOnly) {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({version: version})
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .attach('file', projectBackupPath)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
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
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .query({mkdir: folderName})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
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
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
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

const backup = function (agent, projectHandle, filepath, cb) {
    agent
        .get('/project/' + projectHandle + filepath + '?backup')
        .end(function (err, res) {
            cb(err, res);
        });
};

const bagit = function (agent, projectHandle, filepath, cb) {
    agent
        .get('/project/' + projectHandle + filepath + '?bagit')
        .end(function (err, res) {
            cb(err, res);
        });
};

const download = function (agent, projectHandle, filepath, cb) {
    agent
        .get('/project/' + projectHandle + filepath + '?download')
        .end(function (err, res) {
            cb(err, res);
        });
};

const serve = function (agent, projectHandle, filepath, cb) {
    agent
        .get('/project/' + projectHandle + filepath + '?serve')
        .end(function (err, res) {
            cb(err, res);
        });
};



const thumbnail = function (agent, filepath, projectHandle, cb) {
    agent
        .get('/project/' + projectHandle + filepath + '?thumbnail')
        .end(function (err, res) {
            cb(err, res);
        })
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
    backup : backup,
    bagit : bagit,
    download : download,
    serve : serve,
    thumbnail : thumbnail,
    getProjectContributors: getProjectContributors,
    getRecommendationOntologiesForProject: getRecommendationOntologiesForProject,
    getProjectMetadata: getProjectMetadata,
    getProjectMetadataDeep: getProjectMetadataDeep
};
