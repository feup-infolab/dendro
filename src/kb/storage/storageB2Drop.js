const B2Drop = require("node-b2drop").B2Drop;

// TODO metadata

class storageB2Drop extends storage
{
    constructor (shareLink, password)
    {
        super();

        this.shareLink = shareLink;
        this.password = password;
    }

    open (callback)
    {
        this.connection = B2Drop(this.shareLink, this.password);

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
