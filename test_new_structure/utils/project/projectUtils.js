var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);


var listAllMyProjects = function (jsonOnly, agent, cb) {
    var path = "/projects/my";
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var listAllProjects = function (jsonOnly, agent, cb) {
    var path = "/projects";
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getNewProjectPage = function (jsonOnly, agent, cb) {
    var path = "/projects/new";
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var createNewProject = function (jsonOnly, agent, projectData, cb) {
    if(jsonOnly)
    {
        agent
            .post('/projects/new')
            .set('Accept', 'application/json')
            .send(projectData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/projects/new')
            .send(projectData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var viewProject = function (jsonOnly, agent, projectHandle, cb) {
    if(jsonOnly)
    {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var updateMetadataWrongRoute = function (jsonOnly, agent, projectHandle, metadata, cb) {
    if(jsonOnly)
    {
        agent
            .post('/project/' + projectHandle +'?update_metadata')
            .set('Accept', 'application/json')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/project/' + projectHandle +'?update_metadata')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


var updateMetadataCorrectRoute = function (jsonOnly, agent, projectHandle, folderPath, metadata, cb) {
    ///project/:handle/data/folderpath?update_metadata
    var path = '/project/' + projectHandle +'/data/'+ folderPath + '?update_metadata';
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getMetadataRecomendationsForProject = function (jsonOnly, agent, projectHandle, cb) {
    if(jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set('Accept', 'text/html')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getRecommendationOntologiesForProject = function (jsonOnly, agent, projectHandle, cb) {
    //recommendation_ontologies
    var path = '/project/' + projectHandle + '?recommendation_ontologies';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


var getProjectRootContent = function (jsonOnly, agent, projectHandle, cb) {
    if(jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '?ls')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?ls')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


var getResourceMetadata = function (jsonOnly, agent, projectHandle, folderPath, cb) {
    //http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    var path = '/project/' + projectHandle +'/data/'+ folderPath + '?metadata';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getProjectMetadata = function (jsonOnly, agent, projectHandle, cb) {
    var path = '/project/' + projectHandle + '?metadata';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getProjectMetadataDeep = function (jsonOnly, agent, projectHandle, cb) {
    var path = '/project/' + projectHandle + '?metadata&deep';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var removeDescriptorFromFolder = function (jsonOnly, agent, projectHandle, folderPath, prefixedForm, cb) {
    getResourceMetadata(jsonOnly, agent, projectHandle, folderPath, function (err, res) {
        var descriptors = JSON.parse(res.text).descriptors;
        var newDescriptors = _.reject(descriptors, function (descriptor) {
            return descriptor.prefixedForm == prefixedForm;
        });
        updateMetadataCorrectRoute(jsonOnly, agent, projectHandle, folderPath, newDescriptors, function (error, response) {
            cb(error, response);
        });
    });
};

var getProjectVersion = function (jsonOnly, agent, projectHandle, version, cb) {
    //project/:handle?version
    var path = '/project/' + projectHandle;
    if(jsonOnly)
    {
        agent
            .get(path)
            .query({version : version})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .query({version : version})
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var importProjectHTMLPage = function (jsonOnly, agent, cb) {
    // /projects/import
    var path = "/projects/import";
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var importProject = function (jsonOnly, agent, projectBackupPath, cb) {
    // /projects/import
    var path = "/projects/import";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .attach('file', projectBackupPath)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .attach('file', projectBackupPath)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getRequestProjectAccessPage = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/request_access
    var path = "/project/"+ projectHandle + "/request_access";
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var requestAccessToProject = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/request_access
    var path = "/project/"+ projectHandle + "/request_access";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var deleteProject = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/delete
    var path = "/project/"+ projectHandle + "/delete";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var undeleteProject = function (jsonOnly, agent, projectHandle, cb) {
    // /project/:handle/undelete
    var path = "/project/"+ projectHandle + "/undelete";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var createFolderInProjectRoot = function (jsonOnly, agent, projectHandle, folderName, cb) {
    // /project/:handle?mkdir
    var path = "/project/"+ projectHandle;
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .query({mkdir : folderName})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .query({mkdir : folderName})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getProjectRecentChanges = function (jsonOnly, agent, projectHandle, cb) {
    ///project/:handle?recent_changes
    var path = '/project/' + projectHandle +'?recent_changes';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var administer = function (agent, modify, projectData, projectHandle, cb) {
    if(modify) {
        agent
            .post('/project/' + projectHandle + '?administer')
            .send(projectData)
            .end(function (err, res) {
                cb(err, res);
            });
    } else{
        agent
            .get('/project/' + projectHandle + '?administer')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var backup = function(agent, projectHandle, filepath, cb){
    agent
        .get('/project/' + projectHandle + filepath + '?backup')
        .end(function (err, res) {
            cb(err, res);
        });
};

var bagit = function(agent, projectHandle, filepath, cb){
    agent
        .get('/project/' + projectHandle + filepath + '?bagit')
        .end(function (err, res) {
            cb(err, res);
        });
};

var download = function (agent, projectHandle, filepath, cb) {
    agent
        .get('/project/' + projectHandle + filepath + '?download')
        .end(function (err, res) {
            cb(err, res);
        });
};

var serve = function(agent, projectHandle, filepath, cb){
    agent
        .get('/project/' + projectHandle + filepath + '?serve')
        .end(function (err, res) {
            cb(err, res);
        });
};

var descriptors_autocomplete = function(jsonOnly, projectHandle, folderPath, descriptor, cb){
    ///project/:handle?descriptors_autocomplete
    var projectFolder = projectHandle;
    if(folderPath){
        projectFolder += "/data/" + folderPath;
    }
    var path = '/project/' + projectFolder +'?descriptors_autocomplete&descriptor_autocomplete=' + descriptor;
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var thumbnail = function(agent, filepath, projectHandle, cb){
    agent
        .get('/project/' + projectHandle + filepath + '?thumbnail')
        .end(function (err, res) {
            cb(err, res);
        })
};

var upload = function(agent, modify, filepath, projectHandle, query,  cb){
    if(modify){
        agent
            .post('/project/' + projectHandle + filepath + '?upload' + query)
            .send()
            .end(function(err, res){
                cb(err, res);
            });
    }else {
        agent
            .get('/project/' + projectHandle + filepath + '?upload' + query)
            .end(function(err, res){
                cb(err, res);
            });
    }
};

var getProjectContributors = function (agent, projectHandle, cb) {
    //project/proj1?get_contributors
    var path = "/project/" + projectHandle + "?get_contributors";
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
    upload : upload,
    descriptors_autocomplete : descriptors_autocomplete,
    getProjectContributors: getProjectContributors,
    getRecommendationOntologiesForProject: getRecommendationOntologiesForProject,
    getProjectMetadata: getProjectMetadata,
    getProjectMetadataDeep: getProjectMetadataDeep
};
