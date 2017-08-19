const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const binaryParser = require('../file/fileUtils.js').binaryParser;

exports.createFolderInProject = function(jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    if(jsonOnly)
    {
        ///project/PROJECTHANDLE?mkdir=FOLDERNAME
        agent
            .post('/project/' + projectHandle  + targetFolderInProject  + '?mkdir=' + folderName)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/project/' + projectHandle + targetFolderInProject  + '?mkdir=' + folderName)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.viewFolder= function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName;
    if(jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.downloadFolder= function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName + "?download";
    
    if(jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .buffer()
            .parse(binaryParser)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .buffer()
            .parse(binaryParser)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.backupFolder= function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName + "?backup";

    if(jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .buffer()
            .parse(binaryParser)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .buffer()
            .parse(binaryParser)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.removeFolder= function (jsonOnly, agent, targetFolderInProject, folderName, projectHandle, cb) {
    const path = '/project/' + projectHandle + '/data/' + targetFolderInProject + folderName + "?rm";

    if(jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};