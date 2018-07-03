const slug = require("slug");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoDbCollectionName;

function DendroMongoClient (mongoDBHost, mongoDbPort, mongoDbCollectionName)
{
    let self = this;

    self.hostname = mongoDBHost;
    self.port = mongoDbPort;
    self.collectionName = slug(mongoDbCollectionName, "_");
}

DendroMongoClient.prototype.connect = function (callback)
{
    const url = "mongodb://" + this.hostname + ":" + this.port + "/" + this.collectionName;
    MongoClient.connect(url, function (err, db)
    {
        if (!err)
        {
            return callback(null, db);
        }
        const msg = "Error connecting to MongoDB";
        return callback(true, msg);
    });
};

DendroMongoClient.prototype.findFileByFilenameOrderedByDate = function (db, fileUri, callback)
{
    const collection = db.collection("fs.files");
    collection.find({filename: fileUri}).sort({uploadDate: -1}).toArray(function (err, files)
    {
        if (!err)
        {
            return callback(null, files);
        }
        const msg = "Error findind document with uri: " + fileUri + " in Mongo error: " + JSON.stringify(err);
        return callback(true, msg);
    });
};

DendroMongoClient.prototype.getNonAvatarNorThumbnailFiles = function (db, callback)
{
    const collection = db.collection("fs.files");
    // db.getCollection('fs.files').find( { $and: [{ "metadata.thumbnail": { $ne: true }} , {"metadata.avatar": { $ne: true }}]})
    collection.find({ $and: [{ "metadata.thumbnail": { $ne: true }}, {"metadata.avatar": { $ne: true }}]}).sort({uploadDate: -1}).toArray(function (err, files)
    {
        if (isNull(err))
        {
            return callback(null, files);
        }
        const msg = "Error when looking for non Avatar nor thumbnail files in Mongo, error: " + JSON.stringify(err);
        return callback(true, msg);
    });
};

module.exports.DendroMongoClient = DendroMongoClient;
