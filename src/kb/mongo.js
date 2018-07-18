const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const MongoClient = require("mongodb").MongoClient;

function DendroMongoClient (mongoDBHost, mongoDbPort, mongoDbCollectionName, mongoDbUsername, mongoDbPassword)
{
    let self = this;

    self.hostname = mongoDBHost;
    self.port = mongoDbPort;
    self.collectionName = slug(mongoDbCollectionName);
    self.username = mongoDbUsername;
    self.password = mongoDbPassword;
}

DendroMongoClient.prototype.connect = function (callback)
{
    const self = this;

    let url;
    const sluggedCollectionName = slug(this.collectionName);
    if (self.username && self.password && self.username !== "" && self.password !== "" && self.username !== "")
    {
        url = "mongodb://" + self.username + ":" + self.password + "@" + self.host + ":" + self.port + "/" + sluggedCollectionName + "?authSource=admin";
    }
    else
    {
        url = "mongodb://" + self.host + ":" + self.port + "/" + sluggedCollectionName;
    }

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
