const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const MongoClient = require("mongodb").MongoClient;

function DendroMongoClient (mongoDBHost, mongoDbPort, mongoDbCollectionName, mongoDbUsername, mongoDbPassword, authDatabase)
{
    let self = this;

    self.host = mongoDBHost;
    self.port = mongoDbPort;
    self.collectionName = mongoDbCollectionName;
    self.username = mongoDbUsername;
    self.password = mongoDbPassword;
    self.authDatabase = authDatabase;
}

DendroMongoClient.prototype.connect = function (callback)
{
    const self = this;

    let url;
    if (self.username && self.password && self.username !== "" && self.password !== "" && self.username !== "")
    {
        url = "mongodb://" + self.username + ":" + self.password + "@" + self.host + ":" + self.port + "/" + self.collectionName;

        if (self.authDatabase)
        {
            url = url + "?authSource=" + self.authDatabase;
        }

        Logger.log("debug", "Connecting to MongoDB using connection string: " + "mongodb://" + self.username + ":" + "PASSWORD" + "@" + self.host + ":" + self.port + "/" + self.collectionName);
    }
    else
    {
        url = "mongodb://" + self.host + ":" + self.port + "/" + self.collectionName;
        Logger.log("debug", "Connecting to MongoDB using connection string: " + url);
    }

    MongoClient.connect(url, function (err, db)
    {
        if (!err)
        {
            return callback(null, db);
        }
        const msg = "Error connecting to MongoDB " + JSON.stringify(db, null, 4);
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
        const msg = "Error finding document with uri: " + fileUri + " in Mongo. error: " + JSON.stringify(err);
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
        const msg = "Error when looking for non Avatar nor thumbnail files in Mongo. error: " + JSON.stringify(err);
        return callback(true, msg);
    });
};

module.exports.DendroMongoClient = DendroMongoClient;
