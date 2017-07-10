const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Change = require(Pathfinder.absPathInSrcFolder("/models/versions/change.js")).Change;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const _ = require('underscore');
const async = require('async');
const uuid = require('uuid');

//NFO ontology or NIE ontology
/*
 {
 "_id" : ObjectId("54b03c94e94e9ea32d000001"),
 "filename" : "http://127.0.0.1:3001/project/datanotes2/data/Nielsen[1994].pdf", -> nfo.fileName
 "contentType" : "binary/octet-stream",
 "length" : 259713, -> nie.byteSize
 "chunkSize" : 262144,
 "uploadDate" : ISODate("2015-01-09T20:39:49.050Z"), nie.created
 "aliases" : null,
 "metadata" : {
 "project" : "http://127.0.0.1:3001/project/datanotes2",
 "type" : "nie:File",
 creator: "user uri of the creator" nco.creator
 },
 "md5" : "b3bbe77e563bd4784c21db08bbc3066a" -> nfo.hashAlgorithm
 }*/
function FileVersion (object)
{
    FileVersion.baseConstructor.call(this, object, FileVersion);
    const self = this;

    const newId = uuid.v4();

    if(isNull(self.uri))
    {
       self.uri = "/r/file_versions/" + newId;
    }

    self.copyOrInitDescriptors(object);

    if(isNull(self.ddr.humanReadableURI))
    {
        self.uri = Config.baseUri + "/file_version/" + newId;
    }

    return self;
}

FileVersion = Class.extend(FileVersion, Resource, "ddr:FileVersion");

module.exports.FileVersion = FileVersion;

