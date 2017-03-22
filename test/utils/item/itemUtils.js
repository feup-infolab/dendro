var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);


var createFolder = function (jsonOnly, agent, projectHandle, parentFolderName, newFolderName, cb) {
    // /project/:handle/data/:foldername?mkdir
    var path = '/project/' + projectHandle +'/data/'+ parentFolderName;
    if(jsonOnly)
    {
        agent
            .post(path)
            .query({mkdir : newFolderName})
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
            .query({mkdir : newFolderName})
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var updateItemMetadata = function (jsonOnly, agent, projectHandle, itemPath, metadata, cb) {
    ///project/:handle/data/itemPath?update_metadata
    var path = '/project/' + projectHandle +'/data/'+ itemPath + '?update_metadata';
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

var getItemMetadata = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    //http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    var path = '/project/' + projectHandle +'/data/'+ itemPath + '?metadata';
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

var getItemRecentChanges = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    // /project/:handle/data/foldername?recent_changes
    var path = '/project/' + projectHandle +'/data/'+ itemPath + '?recent_changes';
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

var getItemVersion = function (jsonOnly, agent, projectHandle, itemPath, itemVersion, cb) {
    // /project/:handle/data/foldername?version
    var path = '/project/' + projectHandle +'/data/'+ itemPath + '?version';
    if(jsonOnly)
    {
        agent
            .get(path)
            .query({version: itemVersion})
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
            .query({version: itemVersion})
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var deleteItem = function (jsonOnly, agent, projectHandle, itemPath, cb, reallyDelete) {
    ///project/:handle/data/:foldername
    var path = '/project/' + projectHandle +'/data/'+ itemPath;
    var reallyDelete = reallyDelete ? reallyDelete : false;
    if(jsonOnly)
    {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var undeleteItem = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    var path = '/project/' + projectHandle +'/data/'+ itemPath + "?undelete";
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

var itemRestoreMetadataVersion = function (jsonOnly, agent, projectHandle, itemPath, version, cb) {
    // /project/:handle/data/foldername?restore_metadata_version
    var path = '/project/' + projectHandle +'/data/'+ itemPath + "?restore_metadata_version";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({version : version})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send({version : version})
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getItemChangeLog = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    // /project/:handle/data/foldername?change_log
    var path = '/project/' + projectHandle +'/data/'+ itemPath + '?change_log';
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

module.exports = {
    updateItemMetadata: updateItemMetadata,
    getItemMetadata: getItemMetadata,
    getItemRecentChanges: getItemRecentChanges,
    getItemVersion: getItemVersion,
    deleteItem: deleteItem,
    undeleteItem: undeleteItem,
    itemRestoreMetadataVersion: itemRestoreMetadataVersion,
    getItemChangeLog: getItemChangeLog,
    createFolder: createFolder
};
