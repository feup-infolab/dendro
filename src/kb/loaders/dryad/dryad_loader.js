const Config = function () {
    return GLOBAL.Config;
}();

const Loader = require(Config.absPathInSrcFolder("/kb/loaders/loader.js")).Loader;
const HarvestedResource = require(Config.absPathInSrcFolder("/models/harvesting/harvested_resource.js")).HarvestedResource;
const ExternalRepository = require(Config.absPathInSrcFolder("/models/harvesting/external_repository.js")).ExternalRepository;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

function DryadLoader ()
{
    const self = this;
}

DryadLoader.prototype = Loader.prototype;

DryadLoader.prototype.destroyCurrentAndReload = function() {

};

DryadLoader.prototype.clearDownloadedFiles = function() {

};

DryadLoader.prototype.downloadFiles = function() {

};

DryadLoader.prototype.loadFromDownloadedFiles = function(indexConnection) {
    const dir = (__dirname + "/DryadCrawler/dryad_mets");
    const fs = require('fs');

    const dryadRepository = new ExternalRepository({
        uri: "http://dryad.org",
        dcterms: {
            title: "Dryad",
            description: "Dryad"
        }
    });

    const md5 = require('md5');

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
                                const xmlParser = require('xml2js').parseString;
                                xmlParser(contents, function (err, result) {

                                    try{
                                        const descriptors = result["mets:METS"]["mets:dmdSec"][0]["mets:mdWrap"][0]["mets:xmlData"][0]["dim:dim"][0]["dim:field"];
                                        const resourceURI = "http://datadryad.org" + result["mets:METS"]["$"]["OBJID"];

                                        const formattedDescriptors = [];

                                        for(var i = 0; i < descriptors.length; i++)
                                        {
                                            const descriptor = descriptors[i];

                                            const descriptorElement = descriptor["$"]["element"];
                                            const descriptorQualifier = descriptor["$"]["qualifier"];
                                            const descriptorNamespace = descriptor["$"]["mdschema"];
                                            const descriptorValue = descriptor["_"];

                                            formattedDescriptors.push({
                                                namespace : descriptorNamespace,
                                                element : descriptorElement,
                                                qualifier : descriptorQualifier,
                                                value : descriptorValue
                                            });
                                        }

                                        const timestamp = new Date().toISOString();
                                        const md5sum = md5(contents);
                                        const dryadRecord =
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

};

module.exports.DryadLoader = DryadLoader;