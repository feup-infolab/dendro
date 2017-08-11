const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
let supertest = require('supertest');
let targetUrl;

const binaryParser = function (res, cb) {
    res.setEncoding("binary");
    res.data = "";
    res.on("data", function (chunk) {
        res.data += chunk;
    });
    res.on("end", function () {
        cb(null, new Buffer(res.data, "binary"));
    });
};

const jsonParser = function (res, cb) {
    res.setEncoding("utf8");
    res.text = "";
    res.on("data", function (chunk) {
        res.text += chunk;
    });
    res.on("end", function () {
        cb(null, res.text);
    });
};


module.exports.uploadFile = function(acceptsJSON, agent, projectHandle, folderName, file, cb)
{
    targetUrl = "/project/" + projectHandle + "/data/" + folderName + "?upload";

    if(acceptsJSON)
    {
        agent
            .post(targetUrl)
            .send({ md5_checksum: file.md5_checksum})
            .set("Accept", "application/json")
            .attach('file', file.location)
            .end(function(err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(targetUrl)
            .send({ md5_checksum: file.md5_checksum})
            .attach('file', file.location)
            .end(function(err, res) {
                cb(err, res);
            });
    }
};

module.exports.downloadFileByUri = function(acceptsJSON, agent, uri, cb)
{
    targetUrl = uri + "?download";

    if(acceptsJSON)
    {
        agent
            .get(targetUrl)
            .set("Accept", "application/json")
            .buffer()
            .parse(binaryParser)
            .end(function(err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(targetUrl)
            .end(function(err, res) {
                cb(err, res);
            });
    }
};

module.exports.downloadDataByUri = function(acceptsJSON, agent, uri, cb, sheet)
{
    if(acceptsJSON)
    {
        agent
            .get(uri)
            .query({sheet: sheet, data : ""})
            .set("Accept", "application/json")
            .buffer()
            .parse(jsonParser)
            .end(function(err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(uri)
            .query({sheet: sheet, data : ""})
            .buffer()
            .parse(jsonParser)
            .end(function(err, res) {
                cb(err, res);
            });
    }
};

module.exports.downloadDataByUriInCSV = function(agent, uri, cb, sheet)
{
    agent
        .get(uri)
        .query({sheet: sheet, data : "", format : "csv"})
        .buffer()
        .parse(jsonParser)
        .end(function(err, res) {
            cb(err, res);
        });
};

module.exports.downloadFile = function(acceptsJSON, agent, projectHandle, folderName, file, cb)
{
    targetUrl = "/project/" + projectHandle + "/data/" + folderName + "/" + file.name + "?download";

    if(acceptsJSON)
    {
        agent
            .get(targetUrl)
            .set("Accept", "application/json")
            .end(function(err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(targetUrl)
            .end(function(err, res) {
                cb(err, res);
            });
    }
};

