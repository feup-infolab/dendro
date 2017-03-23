var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var _ = require('underscore');
var async = require('async');
var uuid = require('uuid');

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
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/fileVersion/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:FileVersion";

    return self;
}

FileVersion = Class.extend(FileVersion, Resource);

module.exports.FileVersion = FileVersion;

