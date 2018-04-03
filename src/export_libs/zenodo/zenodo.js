/**
 * Created by Filipe on 01/10/2014.
 */
const request = require("request");

const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

function Zenodo (accessToken, intanceBaseUrl)
{
    this.oauth = {};
    if (isNull(accessToken))
    {
        throw new Error("Undefined access token");
    }
    else
    {
        this.accessToken = accessToken;
        this.accessTokenURL = "?access_token=" + accessToken;
    }

    if(isNull(intanceBaseUrl))
    {
        throw new Error("Undefined instance base url");
    }
    else
    {
        this.apiURL = "https://" +  intanceBaseUrl + "/api";
        this.depositionsURL = this.apiURL + "/deposit/depositions";
    }
}

Zenodo.depositionFilesPath = "/files";
Zenodo.actionsEditPath = "/actions/edit";
Zenodo.actionsPublishPath = "/actions/publish";

Zenodo.prototype.getDeposition = function (depositionID, callback)
{
    request.get({
        url: this.depositionsURL + "/" + depositionID + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            Logger.log("error", e);
            return callback(true);
        }
        return callback(null, data);
    });
};
Zenodo.prototype.getDepositionsList = function (callback)
{
    request.get({
        url: this.depositionsURL + this.accessTokenURL,
        json: true
    },
    function (e, r, depositions)
    {
        if (e)
        {
            Logger.log("error", e);
            return callback(true);
        }
        return callback(null, depositions);
    });
};

Zenodo.prototype.createDeposition = function (data, callback)
{
    request.post({
        url: this.depositionsURL + this.accessTokenURL,
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
    function (e, r, depositition)
    {
        if (r.statusCode !== 201)
        {
            Logger.log("error", depositition.message);
            return callback(true, depositition);
        }
        return callback(false, depositition);
    });
};

Zenodo.prototype.uploadFileToDeposition = function (depositionID, file, callback)
{
    const fs = require("fs");
    const r = request.post({
        url: this.depositionsURL + "/" + depositionID + Zenodo.depositionFilesPath + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (r.statusCode !== 201)
        {
            Logger.log("error", e);
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
        url: this.depositionsURL + "/" + depositionID + Zenodo.actionsEditPath + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            Logger.log("error", e);
            return callback(true);
        }
        return callback(false, data);
    });
};
Zenodo.prototype.depositionPublish = function (depositionID, callback)
{
    request.post({
        url: this.depositionsURL + "/" + depositionID + Zenodo.actionsPublishPath + this.accessTokenURL,
        json: true
    },
    function (e, r, data)
    {
        if (r.statusCode !== 202)
        {
            Logger.log("error", e);
            return callback(true);
        }
        return callback(false, data);
    });
};

module.exports = Zenodo;
