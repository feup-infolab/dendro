const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('underscore');
chai.use(chaiHttp);


const listAllMyProjects = function (jsonOnly, agent, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/projects/my')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/projects/my')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const listAllProjects = function (agent, cb)
{
    agent
        .get('/projects')
        .end(function (err, res)
        {
            cb(err, res);
        });
};

const getNewProjectPage = function (agent, cb)
{
    agent
        .get('/projects/new')
        .end(function (err, res)
        {
            cb(err, res);
        });
};

const createNewProject = function (jsonOnly, agent, projectData, cb)
{
    if (jsonOnly)
    {
        agent
            .post('/projects/new')
            .set('Accept', 'application/json')
            .send(projectData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/projects/new')
            .send(projectData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const viewProject = function (jsonOnly, agent, projectHandle, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const updateMetadataWrongRoute = function (jsonOnly, agent, projectHandle, metadata, cb)
{
    if (jsonOnly)
    {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .set('Accept', 'application/json')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};


const updateMetadataCorrectRoute = function (jsonOnly, agent, projectHandle, folderPath, metadata, cb)
{
    ///project/:handle/data/folderpath?update_metadata
    const path = '/project/' + projectHandle + '/data/' + folderPath + '?update_metadata';
    if (jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getMetadataRecomendationsForProject = function (jsonOnly, agent, projectHandle, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};


const getProjectRootContent = function (jsonOnly, agent, projectHandle, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '?ls')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?ls')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};


const getResourceMetadata = function (jsonOnly, agent, projectHandle, folderPath, cb)
{
    //http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    const path = '/project/' + projectHandle + '/data/' + folderPath + '?metadata';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const removeDescriptorFromFolder = function (jsonOnly, agent, projectHandle, folderPath, prefixedForm, cb)
{
    getResourceMetadata(jsonOnly, agent, projectHandle, folderPath, function (err, res)
    {
        const descriptors = JSON.parse(res.text).descriptors;
        const newDescriptors = _.reject(descriptors, function (descriptor)
        {
            return descriptor.prefixedForm == prefixedForm;
        });
        updateMetadataCorrectRoute(jsonOnly, agent, projectHandle, folderPath, newDescriptors, function (error, response)
        {
            cb(error, response);
        });
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
    removeDescriptorFromFolder : removeDescriptorFromFolder
};
