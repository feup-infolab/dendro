#!/usr/bin/env node


//query to retrieve JSON file with lots of identifiers (simple REST API, JSON response)
//http://datadryad.org/solr/search/select/?q=dryad&fl=dc.identifier&rows=1000000&wt=json


var downloadSubDir = "dryad_mets";
var deleteExistingDownloadFolder = false;
var numberOfConcurrentConnections = 3;

var fs = require('fs'),
    JSONStream = require('JSONStream'),
    sleep = require('sleep'),
    path = require('path'),
    rimraf = require('rimraf'),
    request = require('request'),
    sem = require('semaphore')(numberOfConcurrentConnections);

var makeRequestAndSaveToFile = function(url, absolutePath)
{
    sem.take(function(){
        console.log("Sending request to "+ url + "   ... and saving to file "+absolutePath);
        request(url, function(error,response, body) {
            if (!error && response.statusCode == 200) {
                fs.writeFile(absolutePath, body, function(err) {
                    sem.leave();

                    if(err) {
                        console.log(err);
                    } else {
                        console.log("The file was saved!");
                    }
                });
            }
        });
    });
}

if(deleteExistingDownloadFolder)
{
    rimraf.sync(downloadSubDir);
}

if(!fs.existsSync(__dirname+"/"+downloadSubDir))
{
    fs.mkdir(__dirname +"/"+downloadSubDir);
}

var stream = fs.createReadStream('datasets/dryad_identifiers.json', {
    encoding: 'utf8'
});

parser = JSONStream.parse(['response', 'docs', true]);

stream.pipe(parser);

//parser.on('root', function (obj) {
//    console.log(obj); // whatever you will do with each JSON object
//});
//

parser.on('data', function (obj) {

    //console.log("Encontrei um no, cá estao os identificadores das partes deste dataset");
    //console.log(obj); // whatever you will do with each JSON object

    var identifierArray = obj['dc.identifier'];

    if(identifierArray != null && identifierArray instanceof Array)
    {
        for(var i = 0; i < identifierArray.length; i++)
        {
            var dryadIdentifier = identifierArray[i];
            if(dryadIdentifier.indexOf("dryad") != -1)
            {
                var fullUrl = "http://datadryad.org/resource/"+dryadIdentifier+"/mets.xml"
                var fileDestination = __dirname +"/"+downloadSubDir+"/"+dryadIdentifier.replace(/\//g,"(part)").replace(":","_")+".xml"
                //var fileDestination = __dirname +"/"+downloadSubDir+"/"+fileCounter+".xml";
                //fileCounter++;

                fs.exists(fileDestination, function(exists){
                   if(!exists)
                   {
                       makeRequestAndSaveToFile(fullUrl, fileDestination);
                   }
                    else
                   {
                       console.log("Skipping file "+fileDestination);
                   }
                });

            }
        }
    }
});
