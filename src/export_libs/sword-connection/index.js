var lib = require('./lib/sword-connection');
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

exports.listCollections = function(options, callback){

    if(options.user == null || options.password == null || options.serviceDocRef == null)
    {
        var message = "[sword-connection] Wrong arguments for function listCollections";
        callback(true,message,null);
    }
    else{
        var sword = lib.SwordConnection(options.user, options.password ,options.serviceDocRef);

        sword.listCollections(function (err, message, response) {
            if(err){
                if (message == null) {
                    message ="[sword-connection] Error accessing collections";
                }
                callback(err, message, null);
            }
            else{
                callback(err,message, response);//response variable has list of available collections
            }
        });
    }

};

exports.sendFiles = function(options, callback){

    if(options.user == null || options.password == null || options.serviceDocRef  == null||options.collectionRef == null || options.files == null )
    {

        var message = "[sword-connection] Wrong arguments for function sendFile";
        callback(true,message,null);
        console.error(message);
    }
    else{
        if(options.files.length == 0)
        {
            var message = "[sword-connection] Is necessary to indicate files to send to repository";
            callback(true,message,null);
            console.error(message);
        }

        var sword = lib.SwordConnection(options.user, options.password ,options.serviceDocRef);

        var async = require("async");
       // 1st parameter in async.each() is the array of items
        async.each(options.files,
            // 2nd parameter is the function that each item is passed into
            function(file, cb){
                var sendMetadata = file.match(".zip","$") == ".zip";
                var metadataPath = null;

                if(sendMetadata)
                {
                    metadataPath = file.replace(".zip", ".json");
                }
                // Call an asynchronous function
                sword.sendFile(options.repositoryType, file,options.collectionRef, sendMetadata, metadataPath, function (err, message) {
                    if(err){
                        if (message == null) {
                            message ="[sword-connection] Error sending file to repository.";
                        }
                        console.error(message);
                        cb(err);
                    }
                    else{
                        console.log(message);
                        cb(null);//response variable has list of available collections
                    }
                });
            },
            // 3rd parameter is the function call when everything is done
            function(err){
                if(err) {
                    // All tasks are done now
                    callback(true, "Error sending files to " + options.collectionRef);
                }
                else{
                    callback(false, "Files sent successfully");
                }
            }
        );


    }

};

