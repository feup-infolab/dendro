const B2DropShare = require('node-b2drop').B2DropShare;


//TODO metadata

class storageB2Drop extends storage {
    constructor(shareLink, password) {
        super();

        this.shareLink = shareLink;
        this.password = password;
    }

    open(callback) {
        this.connection = B2DropShare(this.shareLink, this.password);

        return callback(null);
    };

    close(callback) {
        this.connection = null;
        return callback(null);
    };

    put(fileUri, inputStream, callback) {
        this.connection.put(fileUri, inputStream, callback)
    };

    get(fileUri, callback) {
        this.connection.get(fileUri, callback);
    };

    delete(fileUri, callback) {
        this.connection.delete(fileUri, callback);
    };

}