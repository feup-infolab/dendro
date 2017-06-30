const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('underscore');
chai.use(chaiHttp);


const createFolder = function (jsonOnly, agent, projectHandle, parentFolderName, newFolderName, cb) {
    // /project/:handle/data/:foldername?mkdir
    const path = '/project/' + projectHandle + '/data/' + parentFolderName;
    if (jsonOnly) {
        agent
            .post(path)
            .query({mkdir: newFolderName})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .query({mkdir: newFolderName})
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const updateItemMetadata = function (jsonOnly, agent, projectHandle, itemPath, metadata, cb) {
    ///project/:handle/data/itemPath?update_metadata
    const path = '/project/' + projectHandle + '/data/' + itemPath + '?update_metadata';
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
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getItemMetadata = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    //http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    const path = '/project/' + projectHandle + '/data/' + itemPath + '?metadata';
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

const getItemMetadataDeep = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    //http://127.0.0.1:3001/project/testproject1/data/folder1?metadata&deep
    const path = '/project/' + projectHandle + '/data/' + itemPath + '?metadata&deep';
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

const getItemParentMetadata = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    //http://127.0.0.1:3001/project/testproject1/data/folder1?parent_metadata
    const path = '/project/' + projectHandle + '/data/' + itemPath + '?parent_metadata';
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

const getItemRecentChanges = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    // /project/:handle/data/foldername?recent_changes
    const path = '/project/' + projectHandle + '/data/' + itemPath + '?recent_changes';
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

const getItemVersion = function (jsonOnly, agent, projectHandle, itemPath, itemVersion, cb) {
    // /project/:handle/data/foldername?version
    const path = '/project/' + projectHandle + '/data/' + itemPath;
    if (jsonOnly) {
        agent
            .get(path)
            .query({version: itemVersion})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({version: itemVersion})
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const deleteItem = function (jsonOnly, agent, projectHandle, itemPath, cb, reallyDelete) {
    ///project/:handle/data/:foldername
    const path = '/project/' + projectHandle + '/data/' + itemPath;
    var reallyDelete = reallyDelete ? reallyDelete : false;
    if (jsonOnly) {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const undeleteItem = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    const path = '/project/' + projectHandle + '/data/' + itemPath + "?undelete";
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

const itemRestoreMetadataVersion = function (jsonOnly, agent, projectHandle, itemPath, version, cb) {
    // /project/:handle/data/foldername?restore_metadata_version
    const path = '/project/' + projectHandle + '/data/' + itemPath + "?restore_metadata_version";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({version: version})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .send({version: version})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getItemChangeLog = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    // /project/:handle/data/foldername?change_log
    const path = '/project/' + projectHandle + '/data/' + itemPath + '?change_log';
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

const getItemMetadataRecommendations = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    const path = '/project/' + projectHandle + "/data/" + itemPath + '?metadata_recommendations';
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

const getItemRecommendationOntologies = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    //recommendation_ontologies
    const path = '/project/' + projectHandle + "/data/" + itemPath + '?recommendation_ontologies';
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

const viewItem = function (jsonOnly, agent, projectHandle, itemPath, cb) {
    const path = '/project/' + projectHandle + "/data/" + itemPath;
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
    createFolder: createFolder,
    getItemMetadataRecommendations: getItemMetadataRecommendations,
    getItemRecommendationOntologies: getItemRecommendationOntologies,
    getItemMetadataDeep: getItemMetadataDeep,
    getItemParentMetadata: getItemParentMetadata,
    viewItem: viewItem
};
