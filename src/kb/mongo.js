const path = require('path');
const slug = require('slug');

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder(path.join('models', 'meta', 'config.js'))).Config;

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://' + Config.mongoDBHost + ':' + Config.mongoDbPort + '/' + Config.mongoDbCollectionName;

function DendroMongoClient (mongoDBHost, mongoDbPort, mongoDbCollectionName)
{
    let self = this;

    self.hostname = mongoDBHost;
    self.port = mongoDbPort;
    self.collectionName = slug(mongoDbCollectionName, '_');
}

DendroMongoClient.prototype.connect = function (callback)
{
    const url = 'mongodb://' + this.hostname + ':' + this.port + '/' + this.collectionName;
    MongoClient.connect(url, function (err, db)
    {
        if (!err)
        {
            return callback(null, db);
        }
        const msg = 'Error connecting to MongoDB';
        return callback(true, msg);
    });
};

DendroMongoClient.prototype.findFileByFilenameOrderedByDate = function (db, fileUri, callback)
{
    const collection = db.collection('fs.files');
    collection.find({filename: fileUri}).sort({uploadDate: -1}).toArray(function (err, files)
    {
        if (!err)
        {
            return callback(null, files);
        }
        const msg = 'Error findind document with uri: ' + fileUri + ' in Mongo error: ' + JSON.stringify(err);
        return callback(true, msg);
    });
};

module.exports.DendroMongoClient = DendroMongoClient;
