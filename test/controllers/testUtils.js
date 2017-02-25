var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

exports.loginUser = function (username, password, cb) {
    var app = GLOBAL.tests.app;
    agent = chai.request.agent(app);
    agent
        .post('/login')
        .send({'username': username, 'password': password})
        .end(function (err, res) {
            cb(err, agent);
        });
};


exports.listAllMyProjects = function (jsonOnly, agent, cb) {
    if(jsonOnly)
    {
        agent
            .get('/projects/my')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/projects/my')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.listAllProjects = function (agent, cb) {
    agent
        .get('/projects')
        .end(function (err, res) {
            cb(err, res);
        });
};

exports.getNewProjectPage = function (agent, cb) {
    agent
    .get('/projects/new')
    .end(function (err, res) {
        cb(err, res);
    });
};


exports.createNewProject = function (jsonOnly, agent, projectData, cb) {
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

exports.viewProject = function (jsonOnly, agent, projectHandle, cb) {
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
            .end(function (err, res) {
               cb(err, res);
            });
    }
};

exports.createFolderInProject = function(jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    if(jsonOnly)
    {
        ///project/PROJECTHANDLE?mkdir=FOLDERNAME
        agent
            .post('/project/' + projectHandle  + targetFolderInProject  + '?mkdir=' + folderName)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/project/' + projectHandle + targetFolderInProject  + '?mkdir=' + folderName)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.viewFolder= function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    var path = '/project/' + projectHandle + '/data/'  + targetFolderInProject + folderName;
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
            .get('/project/' + projectHandle + '/data/'  + targetFolderInProject + '/' + folderName)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};