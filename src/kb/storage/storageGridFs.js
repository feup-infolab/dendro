const Pathfinder = global.Pathfinder;

const GridFSConnection = require(Pathfinder.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;
const Storage = require(Pathfinder.absPathInSrcFolder("/kb/storage/storage.js")).Storage;

class StorageGridFs extends Storage
{
    constructor (username, password, mongodbHost, mongodbPort, collectionName)
    {
        super();
        this.connection = new GridFSConnection(mongodbHost, mongodbPort, collectionName, username, password);
    }

    open (callback)
    {
        this.connection.open(callback);
    }

    close (callback)
    {
        this.connection.close(callback);
    }

    put (file, inputStream, callback, metadata, customBucket)
    {
        this.connection.put(file.uri, inputStream, callback, metadata, customBucket);
    }

    get (file, outputStream, callback, customBucket)
    {
        this.connection.get(file.uri, outputStream, callback, customBucket);
    }

    delete (file, callback, customBucket)
    {
        this.connection.delete(file.uri, callback, customBucket);
    }
}

module.exports.StorageGridFs = StorageGridFs;
