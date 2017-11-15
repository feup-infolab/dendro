/**
 * Created by Filipe on 09/07/2014.
 */
const request = require("request");

const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

FigShare.apiURL = "http://api.figshare.com";
FigShare.requestTokenURL = FigShare.apiURL + "/v1/pbl/oauth/request_token";
FigShare.accessTokenURL = FigShare.apiURL + "/v1/pbl/oauth/access_token";
FigShare.authorizeURL = FigShare.apiURL + "/v1/pbl/oauth/authorize";
FigShare.articlesURL = FigShare.apiURL + "/v1/my_data/articles";
FigShare.filesURL = "/files";

function FigShare (accessCodes)
{
    this.oauth = {};
    if (typeof accessCodes.consumer_key === "undefined" || typeof accessCodes.consumer_secret === "undefined" || typeof accessCodes.access_token === "undefined" || typeof accessCodes.access_token_secret === "undefined")
    {
        throw "Invalid oauth access codes";
    }
    else
    {
        this.oauth.consumer_key = accessCodes.consumer_key;
        this.oauth.consumer_secret = accessCodes.consumer_secret;
        this.oauth.token = accessCodes.access_token;
        this.oauth.token_secret = accessCodes.access_token_secret;
    }
}
FigShare.prototype.getArticles = function (callback)
{
    request.get({
        url: FigShare.articlesURL,
        oauth: this.oauth,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.log(e);
            return callback(true);
        }
        return callback(false);
    });
};
FigShare.prototype.createArticle = function (article_data, callback)
{
    request.post({
        url: FigShare.articlesURL,
        body: {
            title: article_data.title || "no_title_available",
            description: article_data.description || "no_description_available",
            defined_type: "fileset"
        },
        oauth: this.oauth,
        json: true
    },
    function (e, r, article)
    {
        if (e)
        {
            console.log(e);
            return callback(true);
        }
        return callback(false, article);
    });
};
FigShare.prototype.deleteArticle = function (articleID, callback)
{
    request.del({
        url: FigShare.articlesURL + "/" + articleID,
        oauth: this.oauth,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.log(e);
            return callback(true);
        }
        return callback(false);
    });
};
FigShare.prototype.addFileToArticle = function (articleID, file, callback)
{
    const fs = require("fs");
    const r = request.put({
        url: FigShare.articlesURL + "/" + articleID + FigShare.filesURL,
        oauth: this.oauth,
        json: true
    },
    function (e, r, data)
    {
        if (e)
        {
            console.log(e);
            return callback(true);
        }
        return callback(false);
    });

    const form = r.form();
    form.append("filedata", fs.createReadStream(file));
};

FigShare.prototype.addMultipleFilesToArticle = function (articleID, files, callback)
{
    const self = this;
    const async = require("async");

    async.each(files, function (file, callback)
    {
        self.addFileToArticle(articleID, file, function (err)
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

module.exports = FigShare;
