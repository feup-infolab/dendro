const Pathfinder = global.Pathfinder;

const B2Drop = require("@feup-infolab/node-b2drop").B2Drop;
const Storage = require(Pathfinder.absPathInSrcFolder("/kb/storage/storage.js")).Storage;

class StorageB2Drop extends Storage
{
    constructor (username, password)
    {
        super();

        this.username = username;
        this.password = password;
    }

    open (callback)
    {
        this.connection = B2Drop(this.username, this.password);

        this.connection.login(function (err, response)
        {
            if (err)
            {
                return callback("Failed to LogIn");
            }
            if (response && response.statusCode === 200)
            {
                return callback(null);
            }
        });
    }

    close (callback)
    {
        this.connection = null;
        return callback(null);
    }

    put (fileUri, inputStream, callback)
    {
        this.connection.put(fileUri, inputStream, callback);
    }

    get (fileUri, callback)
    {
        this.connection.get(fileUri, callback);
    }

    delete (fileUri, callback)
    {
        this.connection.delete(fileUri, callback);
    }
}

module.exports.StorageB2drop = StorageB2Drop;
