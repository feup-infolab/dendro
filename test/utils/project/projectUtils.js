var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);


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

exports.updateMetadataWrongRoute = function (jsonOnly, agent, projectHandle, metadata, cb) {
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


exports.updateMetadataCorrectRoute = function (jsonOnly, agent, projectHandle, folderPath, metadata, cb) {
    ///project/:handle/data/folderpath?update_metadata
    var path = '/project/' + projectHandle +'/data'+ folderPath + '?update_metadata';
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

exports.getMetadataRecomendationsForProject = function (jsonOnly, agent, projectHandle, cb) {
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
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


exports.getProjectRootContent = function (jsonOnly, agent, projectHandle, cb) {
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


