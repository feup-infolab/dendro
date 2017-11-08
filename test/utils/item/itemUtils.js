const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);

module.exports.createFolder = function (jsonOnly, agent, projectHandle, parentFolderName, newFolderName, cb)
{
    // /project/:handle/data/:foldername?mkdir
    const path = "/project/" + projectHandle + "/data/" + parentFolderName;
    // console.log(path);
    if (jsonOnly)
    {
        agent
            .post(path)
            .query({mkdir: newFolderName})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                if (err)
                {
                    cb(err, res);
                }
                else
                {
                    cb(err, res);
                }
            });
    }
    else
    {
        agent
            .post(path)
            .query({mkdir: newFolderName})
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.updateItemMetadata = function (jsonOnly, agent, projectHandle, itemPath, metadata, cb)
{
    // / project/:handle/data/itemPath?update_metadata
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?update_metadata";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
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
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.updateItemMetadataByUri = function (jsonOnly, agent, itemUri, metadata, cb)
{
    const path = itemUri + "?update_metadata";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
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
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemMetadata = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    // http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?metadata";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemMetadataByUri = function (jsonOnly, agent, uri, cb)
{
    // http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    const path = uri;

    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemMetadataDeep = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    // http://127.0.0.1:3001/project/testproject1/data/folder1?metadata&deep
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?metadata&deep";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemParentMetadata = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    // http://127.0.0.1:3001/project/testproject1/data/folder1?parent_metadata
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?parent_metadata";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemRecentChanges = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    // /project/:handle/data/foldername?recent_changes
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?recent_changes";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemVersion = function (jsonOnly, agent, projectHandle, itemPath, itemVersion, cb)
{
    // /project/:handle/data/foldername?version
    const path = "/project/" + projectHandle + "/data/" + itemPath;
    if (jsonOnly)
    {
        agent
            .get(path)
            .query({version: itemVersion})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .query({version: itemVersion})
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemVersionByUri = function (jsonOnly, agent, archivedVersionUri, cb)
{
    const path = archivedVersionUri;
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getChangeLog = function (jsonOnly, agent, resourceUri, cb)
{
    const path = resourceUri + "?recent_changes";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.deleteItem = function (jsonOnly, agent, projectHandle, itemPath, cb, reallyDelete)
{
    // / project/:handle/data/:foldername
    const path = "/project/" + projectHandle + "/data/" + itemPath;
    var reallyDelete = reallyDelete || false;
    if (jsonOnly)
    {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.deleteItemByUri = function (jsonOnly, agent, itemURI, cb, reallyDelete)
{
    const path = itemURI;
    var reallyDelete = reallyDelete || false;
    if (jsonOnly)
    {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .del(path)
            .query({really_delete: reallyDelete})
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.undeleteItem = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?undelete";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.itemRestoreMetadataVersion = function (jsonOnly, agent, projectHandle, itemPath, version, cb)
{
    // /project/:handle/data/foldername?restore_metadata_version
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?restore_metadata_version";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({version: version})
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .send({version: version})
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemChangeLog = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    // /project/:handle/data/foldername?change_log
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?change_log";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemMetadataRecommendations = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?metadata_recommendations";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getItemRecommendationOntologies = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    // recommendation_ontologies
    const path = "/project/" + projectHandle + "/data/" + itemPath + "?recommendation_ontologies";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.viewItem = function (jsonOnly, agent, projectHandle, itemPath, cb)
{
    const path = "/project/" + projectHandle + "/data/" + itemPath;
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};
