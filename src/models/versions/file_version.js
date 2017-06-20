const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

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
    FileVersion.baseConstructor.call(this, object);
    const self = this;

    const newId = uuid.v4();

    if(isNull(self.uri))
    {
       self.uri = "/r/file_versions/" + newId;
    }

    self.copyOrInitDescriptors(object);

    if(isNull(self.ddr.humanReadableURI))
    {
        self.uri = Config.baseUri + "/fileVersion/" + newId;
    }

    self.rdf.type = "ddr:FileVersion";

    return self;
}

FileVersion = Class.extend(FileVersion, Resource);

module.exports.FileVersion = FileVersion;

