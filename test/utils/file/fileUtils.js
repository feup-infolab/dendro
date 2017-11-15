const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
let _ = require("underscore");

const binaryParser = function (res, cb)
{
    res.setEncoding("binary");
    res.data = "";
    res.on("data", function (chunk)
    {
        res.data += chunk;
    });
    res.on("end", function ()
    {
        cb(null, new Buffer(res.data, "binary"));
    });
};

const jsonParser = function (res, cb)
{
    res.setEncoding("utf8");
    res.text = "";
    res.on("data", function (chunk)
    {
        res.text += chunk;
    });
    res.on("end", function ()
    {
        cb(null, res.text);
    });
};

module.exports.uploadFile = function (acceptsJSON, agent, projectHandle, folderName, file, cb)
{
    const targetUrl = "/project/" + projectHandle + "/data/" + folderName + "?upload";

    /* if(acceptsJSON)
    {
        agent
            .post(targetUrl)
            .send({ md5_checksum: file.md5})
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
            .send({ md5_checksum: file.md5})
            .attach('file', file.location)
            .end(function(err, res) {
                cb(err, res);
            });
    } */

    if (acceptsJSON)
    {
        agent
            .post(targetUrl)
            .field("md5_checksum", file.md5)
            .set("Accept", "application/json")
            .attach("file", file.location)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(targetUrl)
            .field("md5_checksum", file.md5)
            .attach("file", file.location)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.downloadFileByUri = function (acceptsJSON, agent, uri, cb)
{
    const targetUrl = uri + "?download";

    if (acceptsJSON)
    {
        agent
            .get(targetUrl)
            .set("Accept", "application/json")
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
            .get(targetUrl)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.downloadDataByUri = function (agent, uri, cb, sheet_index, skip, page_size)
{
    agent
        .get(uri)
        .query(
            {
                sheet_index: sheet_index,
                data: "",
                skip: skip,
                page_size: page_size
            })
        .set("Accept", "application/json")
        .buffer()
        .parse(jsonParser)
        .end(function (err, res)
        {
            cb(err, res);
        });
};

module.exports.downloadDataByUriInCSV = function (agent, uri, cb, sheet, skip, page_size)
{
    agent
        .get(uri)
        .query(
            {
                sheet: sheet,
                data: "",
                format: "csv",
                skip: skip,
                page_size: page_size
            })
        .buffer()
        .parse(jsonParser)
        .end(function (err, res)
        {
            cb(err, res);
        });
};

module.exports.downloadFile = function (acceptsJSON, agent, projectHandle, folderName, file, cb)
{
    const targetUrl = "/project/" + projectHandle + "/data/" + folderName + "/" + file.name + "?download";

    if (acceptsJSON)
    {
        agent
            .get(targetUrl)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(targetUrl)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.renameProject = function (acceptsJSON, agent, projectHandle, newName, cb)
{
    // this function should always fail because projects cannot be renamed
    let targetUrl = "/project/" + projectHandle;

    if (acceptsJSON)
    {
        agent
            .post(targetUrl)
            .query(
                {
                    rename: newName
                })
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(targetUrl)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.renameFile = function (agent, projectHandle, folderName, fileName, newName, cb)
{
    let parentUrl = "/project/" + projectHandle;

    if (folderName)
    {
        parentUrl += "/data/" + folderName;
    }

    agent
        .get(parentUrl)
        .query(
            {
                ls: ""
            })
        .set("Accept", "application/json")
        .end(function (err, res)
        {
            if (res.statusCode != 200)
            {
                cb(err, res);
            }
            else
            {
                const contents = JSON.parse(res.text);
                const file = _.find(contents, function (file)
                {
                    return file.nie.title === fileName;
                });

                if (!file)
                {
                    cb("File with name " + fileName + " not found in " + folderName, res);
                }
                else
                {
                    const targetUrl = file.uri;
                    agent
                        .post(targetUrl)
                        .query(
                            {
                                rename: newName
                            })
                        .set("Accept", "application/json")
                        .end(function (err, res)
                        {
                            cb(err, res);
                        });
                }
            }
        });
};

module.exports.renameFileByUri = function (acceptsJSON, agent, fileUri, newName, cb)
{
    if (acceptsJSON)
    {
        agent
            .post(fileUri)
            .query(
                {
                    rename: newName
                })
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(fileUri)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.getFilePath = function (path)
{
    const fs = require("fs");
    const filePath = Pathfinder.absPathInTestsFolder(path);

    if (fs.existsSync(filePath))
    {
        return filePath;
    }
    throw "File " + filePath + " does not exist!!!";
};

module.exports.initLargeTxtFile = function (largeTxtMock, callback)
{
    const fs = require("fs");
    let fileSizeInBytes = 0;
    let largeFileSizeToObtain = largeTxtMock.sizeGb * 1073741824;// bytes in one gb
    let stats;

    let buf = Buffer.from("DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATADATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA  DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATADATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA \n");
    let index = 0;

    let fd = fs.openSync(largeTxtMock.location, "w");
    while (fileSizeInBytes < largeFileSizeToObtain)
    {
        fileSizeInBytes += fs.writeSync(fd, buf, 0, buf.length, index);
        index = fileSizeInBytes;
    }
    fs.closeSync(fd);
    callback(null, largeTxtMock.location + " was initialized");
};

module.exports.deleteLargeTxtFile = function (largeTxtMock, callback)
{
    var fs = require("fs");
    fs.unlinkSync(largeTxtMock.location);
    let msg = "successfully deleted: " + largeTxtMock.location;
    console.log(msg);
    callback(null, msg);
};
