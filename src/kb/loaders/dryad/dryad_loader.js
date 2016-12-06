var Config = function() { return GLOBAL.Config; }();

var Loader = require(Config.absPathInSrcFolder("/kb/loaders/loader.js")).Loader;
var HarvestedResource = require(Config.absPathInSrcFolder("/models/harvesting/harvested_resource.js")).HarvestedResource;
var ExternalRepository = require(Config.absPathInSrcFolder("/models/harvesting/external_repository.js")).ExternalRepository;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

function DryadLoader ()
{
    var self = this;
}

DryadLoader.prototype = Loader.prototype;

DryadLoader.prototype.destroyCurrentAndReload = function() {

}

DryadLoader.prototype.clearDownloadedFiles = function() {

}

DryadLoader.prototype.downloadFiles = function() {

}

DryadLoader.prototype.loadFromDownloadedFiles = function(indexConnection) {
    var dir = (__dirname + "/DryadCrawler/dryad_mets");
    var fs = require('fs');

    var dryadRepository = new ExternalRepository({
        uri : "http://dryad.org",
        dcterms :
        {
            title : "Dryad",
            description : "Dryad"
        }
    });

    var md5 = require('MD5');

    dryadRepository.save(function(err, result)
    {
        if(!err)
        {
            fs.readdir(dir,function(err,files)
            {
                if (!err)
                {
                    files.forEach(function(file)
                    {
                        fs.readFile(dir+"/"+file,'utf-8',function(err,contents){
                            if (!err)
                            {
                                console.log("No error, parsing file " + file);
                                var xmlParser = require('xml2js').parseString;
                                xmlParser(contents, function (err, result) {

                                    try{
                                        var descriptors = result["mets:METS"]["mets:dmdSec"][0]["mets:mdWrap"][0]["mets:xmlData"][0]["dim:dim"][0]["dim:field"];
                                        var resourceURI =  "http://datadryad.org" + result["mets:METS"]["$"]["OBJID"];

                                        var formattedDescriptors = [];

                                        for(var i = 0; i < descriptors.length; i++)
                                        {
                                            var descriptor = descriptors[i];

                                            var descriptorElement = descriptor["$"]["element"];
                                            var descriptorQualifier = descriptor["$"]["qualifier"];
                                            var descriptorNamespace = descriptor["$"]["mdschema"];
                                            var descriptorValue = descriptor["_"];

                                            formattedDescriptors.push({
                                                namespace : descriptorNamespace,
                                                element : descriptorElement,
                                                qualifier : descriptorQualifier,
                                                value : descriptorValue
                                            });
                                        }

                                        var timestamp = new Date().toISOString();
                                        var md5sum = md5(contents);
                                        var dryadRecord =
                                            new HarvestedResource(
                                                resourceURI,
                                                dryadRepository,
                                                formattedDescriptors,
                                                timestamp,
                                                md5sum
                                            );

                                        dryadRecord.save(indexConnection, function(err, results)
                                        {
                                            if(err)
                                            {
                                                i = descriptors.length;
                                                callback(1, "Error loading Dryad Resources. Error reported :  " + results);
                                            }
                                        });
                                    }
                                    catch(e)
                                    {
                                        console.log("Unable to process file : " + file);
                                    }

                                    //console.log(JSON.stringify(result));
                                });
                            }
                            else
                            {
                                console.error("Error reading file " + file + " : " + err);
                            }
                        });
                    });
                }
                else
                {
                    throw err;
                }
            });
        }
        else
        {
            callback(1, "Unable to register Dryad Repository in the harvesting section. Error returned " + result);
        }
    });

}

module.exports.DryadLoader = DryadLoader;