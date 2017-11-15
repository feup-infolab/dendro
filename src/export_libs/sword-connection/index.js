const lib = require("./lib/sword-connection");

const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

/*
 Example of options
 var options = {
 files:["./examplefolder/example2.zip","./examplefolder/example2.zip" ] //only required for sendFile
 collectionRef: "http://localhost:8080/swordv2/collection/123456789/19",//only required for sendFile
 user: "fpsousa91@gmail.com",
 password: "dendroi123",
 serviceDocumentRef:"http://localhost:8080/swordv2/servicedocument"
 };

 */

exports.listCollections = function (options, callback)
{
    if (isNull(options.user) || isNull(options.password) || isNull(options.serviceDocRef))
    {
        var message = "[sword-connection] Wrong arguments for function listCollections";
        return callback(true, message, null);
    }
    const sword = lib.SwordConnection(options.user, options.password, options.serviceDocRef);

    sword.listCollections(function (err, message, response)
    {
        if (err)
        {
            if (isNull(message))
            {
                message = "[sword-connection] Error accessing collections";
            }
            return callback(err, message, null);
        }
        return callback(err, message, response);// response variable has list of available collections
    });
};

exports.sendFiles = function (options, callback)
{
    if (isNull(options.user) || isNull(options.password) || typeof options.serviceDocRef === "undefined" || isNull(options.collectionRef) || isNull(options.files))
    {
        var message = "[sword-connection] Wrong arguments for function sendFile";
        return callback(true, message, null);
        console.error(message);
    }
    if (options.files.length === 0)
    {
        var message = "[sword-connection] Is necessary to indicate files to send to repository";
        return callback(true, message, null);
        console.error(message);
    }

    const sword = lib.SwordConnection(options.user, options.password, options.serviceDocRef);

    const async = require("async");
    // 1st parameter in async.each() is the array of items
    async.each(options.files,
    // 2nd parameter is the function that each item is passed into
        function (file, cb)
        {
            const sendMetadata = file.match(".zip", "$") === ".zip";
            let metadataPath = null;

            if (sendMetadata)
            {
                metadataPath = file.replace(".zip", ".json");
            }
            // Call an asynchronous function
            sword.sendFile(options.repositoryType, file, options.collectionRef, sendMetadata, metadataPath, function (err, message)
            {
                if (err)
                {
                    if (isNull(message))
                    {
                        message = "[sword-connection] Error sending file to repository.";
                    }
                    console.error(message);
                    cb(err);
                }
                else
                {
                    console.log(message);
                    cb(null);// response variable has list of available collections
                }
            });
        },
        // 3rd parameter is the function call when everything is done
        function (err)
        {
            if (err)
            {
                // All tasks are done now
                return callback(true, "Error sending files to " + options.collectionRef);
            }
            return callback(null, "Files sent successfully");
        }
    );
};
