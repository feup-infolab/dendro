function parseFile(dbConnection, fileName, cb)
{
	const lineReader = require('line-reader');
    const n3 = require('n3');
    const parser = new n3.Parser();
    const async = require('async');
    const listOfErrorsThatOccurred = [];

    const runAfterFinishing = function () {
        if (listOfErrorsThatOccurred.length === 0) {
            cb(null, []);
        }
        else {
            cb(1, listOfErrorsThatOccurred);
        }
    };

	lineReader.eachLine(fileName, function(line, last)
        {

            const localLast = last;

            async.waterfall(
                [
                    function(callback)
                    {
                        //line = line.substring(0, line.length - 5); //remove last character (double period...)

                        parser.parse(line,
                            function (err, triple) {
                                if (triple && isNull(err))
                                {
                                    return callback(null, triple);
                                }
                                else
                                {
                                    listOfErrorsThatOccurred.push("#Error parsing line : " + line + ". no valid triple found");
                                }
                            });
                    },
                    function(triple, callback)
                    {
                        dbConnection.insertTriple(triple, "http://dbpedia.org",
                            function(err, message)
                            {
                                if(err)
                                {
                                    console.log(message);
                                    listOfErrorsThatOccurred.push(message);
                                }

                                //we have to ignore an error on a single line,
                                // because the file will have many and some may have errors.
                                // The Dendro admin will have to check the console logs to
                                // see if the loading process went well!
                                return callback(null);
                            }
                        );
                    }
                ]
            );
        }).then(runAfterFinishing);
}
module.exports.parseFile = parseFile;
