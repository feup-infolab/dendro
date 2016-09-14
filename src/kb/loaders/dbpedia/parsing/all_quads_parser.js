module.exports.parseAllFiles = function(dbConnection, rootFolder, cb) {

    var async = require('async');
    var allMessages = [];

    async.waterfall([
        function(callback)
        {
            console.log("Loading long abstracts...");
            require('./parsers/long_abstracts.js').parseFile(dbConnection, rootFolder + '/long_abstracts_en.ttl',
                function(error, messagesFromThisParser)
                {
                    if(error)
                    {
                        //push all the messages
                        allMessages.push.apply(allMessages, messagesFromThisParser);
                    }

                    callback(null); //continue with the other parsers
                    console.log("Finished long abstracts.");
                }
            );
        },
        function(callback)
        {
            if(allMessages.length == 0)
            {
                cb(null, allMessages);  //no errors
            }
            else
            {
                cb(1, allMessages);
            }

        }]
    );
};


//        function(callback)
//        {
//            console.log("Loading infobox properties...");
//            require('./parsers/instance_types.js').parseFile(rootFolder + '/infobox_properties_en.nq', callback);
//            console.log("Finished infobox properties.");
//        },
//        function(callback)
//        {
//            console.log("Loading instance types...");
//            require('./parsers/instance_types.js').parseFile(rootFolder + '/instance_types_en.nq', callback);
//            console.log("Finished instance types.");
//        },
//        function(callback)
//        {
//            console.log("Loading page links...");
//            require('./parsers/page_links.js').parseFile(rootFolder + '/page_links_en.nq', callback);
//            console.log("Finished page links.");
//        },
