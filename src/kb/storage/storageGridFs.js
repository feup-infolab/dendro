let GridFSConnection = require(Pathfinder.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;

class storageGridFs extends storage {
    constructor(mongodbHost, mongodbPort, collectionName, username, password) {
        super();
        this.connection = GridFSConnection(mongodbHost, mongodbPort, collectionName, username, password);
    }

    open(callback) {
        this.connection.open(callback);
    };

    close(callback) {
        this.connection.close(callback);
    };

    put(fileUri, inputStream, callback, metadata, customBucket) {
        this.connection.put(fileUri, inputStream, callback, metadata, customBucket);
    };

    get(fileUri, outputStream, callback, customBucket) {
        this.connection.get(fileUri, outputStream, callback, customBucket);
    };

    delete(fileUri, callback, customBucket) {
        this.connection.delete(fileUri, callback, customBucket);
    };

};