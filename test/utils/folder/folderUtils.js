const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const _ = require('underscore');
const binaryParser = require('../file/fileUtils.js').binaryParser;

exports.createFolderInProject = function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb)
{
    let uri = '/project/' + projectHandle;

    if (targetFolderInProject)
    {
        uri = uri + '/data/' + targetFolderInProject;
    }

    uri = uri + '?mkdir=' + folderName;

    if (jsonOnly)
    {
        // / project/PROJECTHANDLE?mkdir=FOLDERNAME
        agent
            .post(uri)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(uri)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.viewFolder = function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb)
{
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName;
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.downloadFolder = function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb)
{
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName + '?download';

    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .buffer()
            .parse(binaryParser)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .buffer()
            .parse(binaryParser)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.getFolderContents = function (jsonOnly, agent, projectHandle, folderName, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '/data/' + folderName + '?ls')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '/' + folderName + '?ls')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.getFolderContentsByUri = function (jsonOnly, agent, folderURI, cb)
{
    const path = folderURI + '?ls';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.backupFolder = function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb)
{
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName + '?backup';

    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .buffer()
            .parse(binaryParser)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .buffer()
            .parse(binaryParser)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.removeFolder = function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb)
{
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName + '?rm';

    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.renameFolderByUri = function (acceptsJSON, agent, folderUri, newName, cb)
{
    if (acceptsJSON)
    {
        agent
            .post(folderUri)
            .query(
                {
                    rename: newName
                })
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(folderUri)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.responseContainsAllMockFiles = function (res, mockFilesArray)
{
    const files = JSON.parse(res.text);

    for (let i = 0; i < mockFilesArray.length; i++)
    {
        const mockFile = mockFilesArray[i];

        let fileWithTitle = _.find(files, function (file)
        {
            return file.nie.title === mockFile.name;
        });

        if (!fileWithTitle)
        {
            return false;
        }
    }

    return true;
};

exports.responseContainsMockFile = function (res, mockFile)
{
    const files = JSON.parse(res.text);

    for (let i = 0; i < files.length; i++)
    {
        const file = files[i];

        if (file.nie.title === mockFile.name)
        {
            return true;
        }
    }

    return false;
};

module.exports.moveFilesIntoFolder = function (acceptsJSON, agent, fileUrisArray, destinationFolderUri, cb)
{
    if (acceptsJSON)
    {
        agent
            .post(destinationFolderUri)
            .send({
                files: fileUrisArray
            })
            .query(
                {
                    cut: ''
                })
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(destinationFolderUri)
            .send({
                files: fileUrisArray
            })
            .query(
                {
                    cut: ''
                })
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};
