/**
 * Created by Filipe on 01/10/2014.
 */
const request = require("request");

const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

Zenodo.apiURL = "https://zenodo.org/api";
Zenodo.depositionsURL = Zenodo.apiURL + "/deposit/depositions/";
Zenodo.depositionFilesPath = "/files";
Zenodo.actionsEditPath = "/actions/edit";
Zenodo.actionsPublishPath = "/actions/publish";

function Zenodo (accessToken)
{
    this.oauth = {};
    if (isNull(accessToken))
    {
        throw "Undefined access token";
    }
    else
    {
        this.accessToken = accessToken;
        this.accessTokenURL = "?access_token=" + accessToken;
    }
}
Zenodo.prototype.getDeposition = function (depositionID, callback)
{
    request.get({
        url: Zenodo.depositionsURL + depositionID + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.error(e);
            return callback(true);
        }
        return callback(null, data);
    });
};
Zenodo.prototype.getDepositionsList = function (callback)
{
    request.get({
        url: Zenodo.depositionsURL + this.accessTokenURL,
        json: true
    },
    function (e, r, depositions)
    {
        if (e)
        {
            console.error(e);
            return callback(true);
        }
        return callback(null, depositions);
    });
};

Zenodo.prototype.createDeposition = function (data, callback)
{
    request.post({
        url: Zenodo.depositionsURL + this.accessTokenURL,
        body: {
            metadata: {
                title: data.title || "no_title_available",
                description: data.description || "no_description_available",
                upload_type: "dataset",
                creators: [{name: data.creator || "no_creator_available"}],
                access_right: "closed",
                license: "cc-zero"
            }

        },
        json: true
    },
    function (e, r, depostition)
    {
        if (r.statusCode !== "201")
        {
            console.error(depostition.message);
            return callback(true, depostition);
        }
        return callback(false, depostition);
    });
};

Zenodo.prototype.uploadFileToDeposition = function (depositionID, file, callback)
{
    const fs = require("fs");
    const r = request.post({
        url: Zenodo.depositionsURL + depositionID + Zenodo.depositionFilesPath + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.error(e);
            return callback(true);
        }
        return callback(false);
    });

    const form = r.form();
    form.append("file", fs.createReadStream(file));
};
Zenodo.prototype.uploadMultipleFilesToDeposition = function (depositionID, files, callback)
{
    const async = require("async");
    const self = this;
    async.each(files, function (file, callback)
    {
        self.uploadFileToDeposition(depositionID, file, function (err)
        {
            if (err)
            {
                return callback(true);
            } return callback(false);
        });
    },
    function (err)
    {
        if (err)
        {
            return callback(true);
        }
        return callback(false);
    });
};
Zenodo.prototype.depositionEdit = function (depositionID, callback)
{
    request.post({
        url: Zenodo.depositionsURL + depositionID + Zenodo.actionsEditPath + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.error(e);
            return callback(true);
        }
        return callback(false, data);
    });
};
Zenodo.prototype.depositionPublish = function (depositionID, callback)
{
    request.post({
        url: Zenodo.depositionsURL + depositionID + Zenodo.actionsPublishPath + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.error(e);
            return callback(true);
        }
        return callback(false, data);
    });
};

module.exports = Zenodo;
