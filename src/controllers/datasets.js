var Config = require('../models/meta/config.js').Config;

var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var records = require(Config.absPathInSrcFolder("/controllers/records.js"));
var Serializers = require(Config.absPathInSrcFolder("/utils/serializers.js"));
var swordConnection = require(Config.absPathInSrcFolder("/export_libs/sword-connection/index.js"));
var Figshare = require(Config.absPathInSrcFolder("/export_libs/figshare/figshare.js"));
var B2Share = require(Config.absPathInSrcFolder("/export_libs/b2share/b2share.js"));

var async = require('async');
var nodemailer = require('nodemailer');
var flash = require('connect-flash');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');


createPackage = function(parentFolderPath, folder, callback){

    var folderToZip = path.join(parentFolderPath, folder.nie.title);
    var outputFilenameZip = path.join(parentFolderPath,folder.nie.title + ".zip");
    var outputFilenameRDF = path.join(parentFolderPath,folder.nie.title + ".rdf");
    var outputFilenameTXT = path.join(parentFolderPath,folder.nie.title + ".txt");
    var outputFilenameJSON = path.join(parentFolderPath,folder.nie.title + ".json");

    var filesToIncludeInPackage = [];

    var absPathToChild;

    async.series([
        function(cb)
        {
            fs.readdir(folderToZip, function (err, files)
            {
                if (!err)
                {
                    async.map(files, function (file, callback)
                    {
                        var absPathToChild = path.join(folderToZip, file);
                        fs.stat(absPathToChild, function (err, stats)
                        {
                            if (!stats.isDirectory())
                            {
                                filesToIncludeInPackage.push(absPathToChild);
                            }
                            callback(err, stats);
                        });
                    }, function (err, results)
                    {
                        cb(err);
                    })
                }
                else
                {
                    cb(err, files);
                }
            })
        },
        function(cb)
        {
            var archiver = require('archiver');

            var output = fs.createWriteStream(outputFilenameZip);
            var zipArchive = archiver('zip');

            zipArchive.pipe(output);

            zipArchive.bulk([
                { expand: true,src:["**"], cwd: folderToZip}
            ]);

            zipArchive.finalize(function(err, bytes) {

                if (err) {
                    throw err;
                }
            });

            output.on('close', function() {
                console.log('done with the zip', folderToZip);
                filesToIncludeInPackage.push(outputFilenameZip);

                folder.findMetadataRecursive( function(err, result) {
                    if (!err) {

                        var metadataRDF = require(Config.absPathInPublicFolder('js/pretty-data')).pd.xml(Serializers.metadataToRDF(result));


                        fs.writeFile(outputFilenameRDF, metadataRDF, function(err) {

                            if (!err) {
                                console.log("The file " + outputFilenameRDF + " was saved!");
                                filesToIncludeInPackage.push(outputFilenameRDF);

                                var metadataTXT = Serializers.metadataToText(result);

                                fs.writeFile(outputFilenameTXT, metadataTXT, function(err) {

                                    if (!err) {
                                        console.log("The file " + outputFilenameTXT + " was saved!");
                                        filesToIncludeInPackage.push(outputFilenameTXT);

                                        var metadataJSON = require(Config.absPathInPublicFolder('js/pretty-data')).pd.json(JSON.stringify(result));

                                        fs.writeFile(outputFilenameJSON, metadataJSON, function(err) {
                                            if (!err) {
                                                console.log("The file " + outputFilenameJSON  + " was saved!");
                                                cb(null, null);
                                            } else {
                                                console.log(err);
                                                cb(true, null);
                                            }
                                        });

                                    } else {
                                        console.log(err);
                                        cb(true, null);
                                    }

                                });

                            } else {
                                console.log(err);
                                cb(true, null);
                            }

                        });
                    }
                    else {
                        var msg = "Error finding metadata in " + folder.uri;
                        console.error(msg);
                        cb(true, null);

                    }
                });
            });
        }
        ],
        function(err, results)
        {
            if (!err)
            {
                callback(err, filesToIncludeInPackage);
            }
            else
            {
                callback(err, results);
            }
        });
}

export_to_repository_sword = function(req, res){
    var requestedResourceUri = req.params.requestedResource;
    var targetRepository = req.body.repository;

    if (targetRepository.ddr.hasExternalUri == null) {
        var msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
    else {

        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (!err) {
                if (folder != null) {
                    if (folder.dcterms.title == null) {
                        var msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (!err) {
                                createPackage(parentFolderPath, folder, function (err, files) {
                                    if (!err) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        var serviceDocumentRef = null;

                                        if (targetRepository.ddr.hasPlatform.foaf.nick == "dspace") {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.DSpaceServiceDocument;
                                        }
                                        else if (targetRepository.ddr.hasPlatform.foaf.nick == "eprints") {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.EprintsServiceDocument;
                                        }
                                        var options = {
                                            files: files,
                                            collectionRef: targetRepository.ddr.hasSwordCollectionUri,
                                            repositoryType: targetRepository.ddr.hasPlatform.foaf.nick,
                                            user: targetRepository.ddr.hasUsername,
                                            password: targetRepository.ddr.hasPassword,
                                            serviceDocRef: serviceDocumentRef
                                        };

                                        swordConnection.sendFiles(options, function (err, message) {
                                            if (!err) {
                                                deleteFolderRecursive(parentFolderPath);
                                                var msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. " + message;
                                                console.log(msg);
                                                res.json(
                                                    {
                                                        "result": "OK",
                                                        "message": msg
                                                    }
                                                );
                                            }
                                            else {
                                                deleteFolderRecursive(parentFolderPath);
                                                var msg = "Error exporting folder '" + folder.nie.title + "' from the Dendro platform. " + message;
                                                console.error(msg);
                                                res.status(500).json(
                                                    {
                                                        "result": "error",
                                                        "message": msg
                                                    }
                                                );
                                            }
                                        });
                                    }
                                    else {
                                        var msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        console.error(msg);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": msg
                                            }
                                        );
                                    }
                                })
                            }
                            else {
                                var msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result": "error",
                                        "message": msg
                                    }
                                );
                            }
                        });
                    }
                }
                else {
                    var msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
            }
            else {
                var msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                console.error(msg);
                res.status(500).json(
                    {
                        "result": "error",
                        "message": msg
                    }
                );
            }
        });
    }
};

export_to_repository_ckan = function(req, res){
    console.log("1");
    try{
        var ckan = require('node-ckan');
        var requestedResourceUri = req.params.requestedResource;
        var targetRepository = req.body.repository;

        if(req.body.repository != null && req.body.repository.ddr != null)
        {
            var organization = req.body.repository.ddr.hasOrganization;

            Folder.findByUri(requestedResourceUri, function(err, folder){
                if(!err)
                {
                    if(folder != null)
                    {
                        if(folder.dcterms.title == null)
                        {
                            var msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                            console.error(msg);
                            res.status(400).json(
                                {
                                    "result" : "error",
                                    "message" : msg
                                }
                            );
                        }
                        else
                        {
                            console.log("2");
                            var jsonDescriptors = folder.getDescriptors([Config.types.private, Config.types.locked]);

                            var extrasJSONArray = [];

                            jsonDescriptors.forEach(function(column) {
                                var extraJson = {};
                                extraJson["key"] = column.uri;
                                extraJson["value"] = column.value;
                                extrasJSONArray.push(extraJson);
                            });

                            if(targetRepository.ddr.hasExternalUri == null)
                            {
                                var msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result" : "error",
                                        "message" : msg
                                    }
                                );
                            }
                            else
                            {
                                console.log("3" + targetRepository.ddr.hasExternalUri  + " " + targetRepository.ddr.hasUsername + " " + targetRepository.ddr.hasPassword);
                                ckan.showTimes();
                                ckan.setServer(targetRepository.ddr.hasExternalUri);
                                ckan.login(targetRepository.ddr.hasUsername, targetRepository.ddr.hasPassword, function(error){
                                    console.log("4");
                                    if(!error)
                                    {
                                        console.log("5");
                                        var slug = require('slug');
                                        var slugifiedTitle = slug(folder.dcterms.title, "-");

                                        slugifiedTitle = slugifiedTitle.replace(/[^A-Za-z0-9-]/g, "").replace(/\./g, "").toLowerCase();

                                        console.log("6");
                                        folder.createTempFolderWithContents(false, function(err, parentFolderPath, absolutePathOfFinishedFolder, metadata){
                                            console.log("7");
                                            if(!err){
                                                createPackage(parentFolderPath, folder, function (err, files) {

                                                    console.log("7");
                                                    if(!err)
                                                    {
                                                        console.log("8");
                                                        files = InformationElement.removeInvalidFileNames(files);

                                                        if (typeof String.prototype.endsWith !== 'function') {
                                                            String.prototype.endsWith = function(suffix) {
                                                                return this.indexOf(suffix, this.length - suffix.length) !== -1;
                                                            };
                                                        }

                                                        //function isExportable(element) {
                                                        //    return element.endsWith('.rdf')||element.endsWith('.txt')||element.endsWith('.zip')
                                                        //}

                                                        //files = files.filter(isExportable);

                                                        if (files.length > 0) {
                                                            var buildFileRecord = function (file, callback) {
                                                                var fileExtensionRE = /(?:\.([^.]+))?$/;
                                                                var fileExtension = fileExtensionRE.exec(file)[1];
                                                                var record =
                                                                {
                                                                    file: file,
                                                                    description: folder.ddr.description || '< no description available >',
                                                                    name: path.basename(file),
                                                                    mimetype: Config.mimeTypes[fileExtension]
                                                                };

                                                                callback(false, record);
                                                            };


                                                            async.map(files, buildFileRecord, function (err, resources) {

                                                                resources = _.compact(resources);

                                                                if (!err) {
                                                                    var packageContents = [
                                                                        {
                                                                            name: slugifiedTitle,
                                                                            package_id: slugifiedTitle,
                                                                            title: folder.dcterms.title,
                                                                            description: folder.dcterms.description,
                                                                            extras: extrasJSONArray,
                                                                            resources: resources,
                                                                            owner_org: organization
                                                                        }
                                                                    ];

                                                                    ckan.exec("package_show",
                                                                        {
                                                                            id: slugifiedTitle
                                                                        },
                                                                        function (err, result) {
                                                                            if (!err && result.success) {

                                                                                async.each(result.result.resources, function( resource, callback) {

                                                                                    callback(false);

                                                                                    /*ckan.exec("resource_delete", {id:resource.id }, function (err, result) {
                                                                                     if (!err) {
                                                                                     callback(false)
                                                                                     }
                                                                                     else {
                                                                                     callback(true);
                                                                                     }
                                                                                     });*/

                                                                                }, function(err){
                                                                                    // if any of the file processing produced an error, err would equal that error
                                                                                    if (!err) {
                                                                                        ckan.import({
                                                                                            // verbose output
                                                                                            debug: true,

                                                                                            // by default if a package or resource already exists, it will be ignored
                                                                                            // set the update flag to force updates of packages and resources
                                                                                            update: true,
                                                                                            // list of packages you want to import.
                                                                                            packages: packageContents,

                                                                                            callback: function (response) {
                                                                                                deleteFolderRecursive(parentFolderPath);
                                                                                                res.json(
                                                                                                    {
                                                                                                        "result": "OK",
                                                                                                        "message": "Dataset successfully exported!"
                                                                                                    }
                                                                                                );
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        deleteFolderRecursive(parentFolderPath);
                                                                                        var msg = "Error deleting old dataset for " + requestedResourceUri + " Error reported : " + result;
                                                                                        console.error(msg);

                                                                                        res.status(500).json(
                                                                                            {
                                                                                                "result": "error",
                                                                                                "message": msg
                                                                                            }
                                                                                        );
                                                                                    }
                                                                                });

                                                                            }
                                                                            else if (err || !result.success) {

                                                                                if(err.status == 404){
                                                                                    ckan.import({
                                                                                        // verbose output
                                                                                        debug: true,

                                                                                        // by default if a package or resource already exists, it will be ignored
                                                                                        // set the update flag to force updates of packages and resources
                                                                                        update: true,

                                                                                        // user key, you can authenticate using the setKey() and login() methods as well
                                                                                        //key: "fe90fb70-34f7-4194-849a-32317f0b1760",

                                                                                        // server you wish to connect to
                                                                                        //server : "http://10.0.37.23:5000",

                                                                                        // list of packages you want to import.

                                                                                        packages: packageContents,
                                                                                        callback: function (response) {
                                                                                            deleteFolderRecursive(parentFolderPath);
                                                                                            res.json(
                                                                                                {
                                                                                                    "result": "OK",
                                                                                                    "message": "Dataset successfully exported!"
                                                                                                }
                                                                                            );
                                                                                        }
                                                                                    });
                                                                                }
                                                                                else if(err.error != null && err.error.__type == 'Authorization Error'){
                                                                                    deleteFolderRecursive(parentFolderPath);
                                                                                    var msg = "Error checking for presence of old dataset for " + requestedResourceUri + " Error reported : " +  err.error.__type +":"+err.error.message;;
                                                                                    if(err.error.__type == 'Authorization Error')
                                                                                    {
                                                                                        msg = "Already exists a dataset with same ID in CKAN, please change title of your dataset."
                                                                                    }
                                                                                    console.error(msg);

                                                                                    res.status(500).json(
                                                                                        {
                                                                                            "result": "error",
                                                                                            "message": msg
                                                                                        }
                                                                                    );
                                                                                }
                                                                                else{
                                                                                    deleteFolderRecursive(parentFolderPath);
                                                                                    var msg = "Error checking for presence of old dataset for " + requestedResourceUri + " Error reported : ";
                                                                                    console.error(msg);

                                                                                    res.status(500).json(
                                                                                        {
                                                                                            "result": "error",
                                                                                            "message": msg
                                                                                        }
                                                                                    );
                                                                                }


                                                                            }
                                                                            else {
                                                                                deleteFolderRecursive(parentFolderPath);
                                                                                var msg = "Error checking for presence of old dataset for " + requestedResourceUri + " Error reported : " + result;
                                                                                console.error(msg);

                                                                                res.status(500).json(
                                                                                    {
                                                                                        "result": "error",
                                                                                        "message": msg
                                                                                    }
                                                                                );
                                                                            }
                                                                        });
                                                                }
                                                                else {
                                                                    deleteFolderRecursive(parentFolderPath);
                                                                    var msg = "Error building file records for deposit when dumping " + requestedResourceUri + " from the Dendro platform. Error reported : " + resources;
                                                                    console.error(msg);
                                                                    res.status(500).json(
                                                                        {
                                                                            "result": "error",
                                                                            "message": msg
                                                                        }
                                                                    );
                                                                }
                                                            });
                                                        }
                                                        else
                                                        {
                                                            var msg = "Error compressing package for exporting folder " + folder.nie.title + " from the Dendro platform.";
                                                            console.error(msg);
                                                            res.status(500).json(
                                                                {
                                                                    "result": "error",
                                                                    "message": msg
                                                                }
                                                            );
                                                        }
                                                    }
                                                    else
                                                    {
                                                        var msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                                        console.error(msg);
                                                        res.status(500).json(
                                                            {
                                                                "result": "error",
                                                                "message": msg
                                                            }
                                                        );
                                                    }
                                                });
                                            }
                                            else{
                                                var msg = "Error creating temporary folder for export folder " + folder.nie.title + " from the Dendro platform.";
                                                console.error(msg);
                                                res.status(500).json(
                                                    {
                                                        "result": "error",
                                                        "message": msg
                                                    }
                                                );
                                            }

                                        });
                                    }
                                    else
                                    {
                                        var msg = "Unable to authenticate in external repository. Invalid user/password combination? Error returned : " + JSON.stringify(error);
                                        console.error(msg);
                                        res.status(401).json(
                                            {
                                                "result" : "error",
                                                "message" : msg
                                            }
                                        );
                                    }
                                });
                            }
                        }
                    }
                    else
                    {
                        var msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result" : "error",
                                "message" : msg
                            }
                        );
                    }
                }
                else
                {
                    var msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                    console.error(msg);
                    res.status(500).json(
                        {
                            "result" : "error",
                            "message" : msg
                        }
                    );
                }
            });
        }
        else
        {
            var msg = "Request body must contain the organization to which the user wants to submit the datataset in the field \"repository.ddr.hasOrganization\"";
            console.error(msg);
            res.status(400).json(
                {
                    "result" : "error",
                    "message" : msg
                }
            );
        }
    }
    catch(e)
    {
        var msg = "Error exporting to repository: " + e.message;
        console.error(msg);
        res.status(500).json(
            {
                "result" : "error",
                "message" : msg
            }
        );
    }
};


export_to_repository_figshare = function(req, res){
    var requestedResourceUri = req.params.requestedResource;
    var targetRepository = req.body.repository;

    if (targetRepository.ddr.hasExternalUri == null) {
        var msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
    else {
        Folder.findByUri(requestedResourceUri, function(err, folder){
            if(!err){
                if(folder != null)
                {
                    if(folder.dcterms.title == null)
                    {
                        var msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result" : "error",
                                "message" : msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (!err) {
                                createPackage(parentFolderPath, folder, function (err, files) {
                                    if (!err) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                            try {
                                                var accessCodes = {
                                                    consumer_key: targetRepository.ddr.hasConsumerKey,
                                                    consumer_secret: targetRepository.ddr.hasConsumerSecret,
                                                    access_token: targetRepository.ddr.hasAccessToken,
                                                    access_token_secret: targetRepository.ddr.hasAccessTokenSecret
                                                };

                                                var title;
                                                if (Array.isArray(folder.dcterms.title)) {
                                                    title = folder.dcterms.title[0]
                                                }
                                                else {
                                                    title = folder.dcterms.title;
                                                }
                                                var description;
                                                if (Array.isArray(folder.dcterms.description)) {
                                                    description = folder.dcterms.description[0]
                                                }
                                                else {
                                                    description = folder.dcterms.description;
                                                }

                                                var article_data = {
                                                    title: title,
                                                    description: description
                                                };

                                                var figshare = new Figshare(accessCodes);
                                                figshare.createArticle(article_data, function (err, article) {
                                                    if (err) {
                                                        deleteFolderRecursive(parentFolderPath);
                                                        var msg = "Error creating article on figshare";
                                                        console.error(msg);
                                                        res.status(500).json(
                                                            {
                                                                "result": "error",
                                                                "message": msg
                                                            }
                                                        );
                                                    }
                                                    else {
                                                        figshare.addMultipleFilesToArticle(article.article_id, files, function (err) {
                                                            if (err) {
                                                                deleteFolderRecursive(parentFolderPath);
                                                                var msg = "Error adding files to article on figshare";
                                                                console.error(msg);
                                                                res.status(500).json(
                                                                    {
                                                                        "result": "error",
                                                                        "message": msg
                                                                    }
                                                                );
                                                            }
                                                            else {
                                                                deleteFolderRecursive(parentFolderPath);
                                                                var msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
                                                                console.log(msg);
                                                                res.json(
                                                                    {
                                                                        "result": "OK",
                                                                        "message": msg
                                                                    }
                                                                );
                                                            }
                                                        });


                                                    }
                                                });

                                            }
                                            catch (err) {
                                                deleteFolderRecursive(parentFolderPath);
                                                console.error(err);
                                                res.status(500).json(
                                                    {
                                                        "result": "error",
                                                        "message": err
                                                    }
                                                );
                                            }
                                        }
                                    else {
                                        var msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        console.error(msg);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": msg
                                            }
                                        );
                                    }
                                })
                            }
                            else {
                                var msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result": "error",
                                        "message": msg
                                    }
                                );
                            }
                        });
                    }
                }
                else{
                    var msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result" : "error",
                            "message" : msg
                        }
                    );
                }
            }
            else{
                var msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                console.error(msg);
                res.status(500).json(
                    {
                        "result" : "error",
                        "message" : msg
                    }
                );
            }
        });
    }
};

export_to_repository_zenodo = function(req, res){
    var requestedResourceUri = req.params.requestedResource;
    var targetRepository = req.body.repository;

    if (targetRepository.ddr.hasExternalUri == null) {
        var msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
        console.error(msg);
        res.status(500).json(
            {
                "result": "error",
                "message": msg
            }
        );
    }
    else {
        Folder.findByUri(requestedResourceUri, function (err, folder) {
            if (!err) {
                if (folder != null) {
                    if (folder.dcterms.title == null) {
                        var msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (!err) {
                                createPackage(parentFolderPath, folder, function (err, files) {
                                    if (!err) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        try {
                                            var accessTocken = targetRepository.ddr.hasAccessToken;


                                            var title;
                                            if (Array.isArray(folder.dcterms.title)) {
                                                title = folder.dcterms.title[0]
                                            }
                                            else {
                                                title = folder.dcterms.title;
                                            }
                                            var description;
                                            if (Array.isArray(folder.dcterms.description)) {
                                                description = folder.dcterms.description[0]
                                            }
                                            else {
                                                description = folder.dcterms.description;
                                            }

                                            var data = {
                                                title: title,
                                                description: description,
                                                creator: folder.dcterms.creator
                                            };

                                            var zenodo = new Zenodo(accessTocken);
                                            zenodo.createDeposition(data, function (err, deposition) {
                                                if (err) {
                                                    deleteFolderRecursive(parentFolderPath);
                                                    var msg = "Error creating new deposition resource in Zenodo";
                                                    console.error(msg);
                                                    res.status(500).json(
                                                        {
                                                            "result": "error",
                                                            "message": msg
                                                        }
                                                    );
                                                }
                                                else {
                                                    var depositionID = deposition.id;

                                                    zenodo.uploadMultipleFilesToDeposition(depositionID, files, function (err) {
                                                        if (err) {
                                                            deleteFolderRecursive(parentFolderPath);
                                                            var msg = "Error uploading multiple files to deposition in Zenodo";
                                                            console.error(msg);
                                                            res.status(500).json(
                                                                {
                                                                    "result": "error",
                                                                    "message": msg
                                                                }
                                                            );
                                                        }
                                                        else {
                                                            zenodo.depositionPublish(depositionID, function (err) {
                                                                if (err) {
                                                                    var msg = "Error publishing a deposition in Zenodo";
                                                                    console.error(msg);
                                                                    res.status(500).json(
                                                                        {
                                                                            "result": "error",
                                                                            "message": msg
                                                                        }
                                                                    );
                                                                }
                                                                else {
                                                                    deleteFolderRecursive(parentFolderPath);
                                                                    var msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
                                                                    console.log(msg);
                                                                    res.json(
                                                                        {
                                                                            "result": "OK",
                                                                            "message": msg
                                                                        }
                                                                    );
                                                                }
                                                            })
                                                        }
                                                    });
                                                }


                                            })

                                        }
                                        catch (err) {
                                            deleteFolderRecursive(parentFolderPath);
                                            console.error(err);
                                            res.status(500).json(
                                                {
                                                    "result": "error",
                                                    "message": err
                                                }
                                            );
                                        }
                                    }
                                    else {
                                        var msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                        console.error(msg);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": msg
                                            }
                                        );
                                    }
                                })
                            }
                            else {
                                var msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
                                console.error(msg);
                                res.status(500).json(
                                    {
                                        "result": "error",
                                        "message": msg
                                    }
                                );
                            }
                        });
                    }
                }
                else {
                    var msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
            }
            else {
                var msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
                console.error(msg);
                res.status(500).json(
                    {
                        "result": "error",
                        "message": msg
                    }
                );
            }
        });
    }
};

export_to_repository_b2share = function(req, res){
    var requestedResourceUri = req.params.requestedResource;
    var targetRepository = req.body.repository;

    Folder.findByUri(requestedResourceUri, function(err, folder){
        if(!err){
            if(folder != null) {
                if(folder.dcterms.title == null){
                    var msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
                else{
                    folder.createTempFolderWithContents(false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata){
                        if(!err){
                            createPackage(parentFolderPath, folder, function (err, files){
                                if(!err){
                                    console.log("Package for export " + requestedResourceUri + " created.");

                                    try{
                                        var accessToken = targetRepository.ddr.hasAccessToken;

                                        var title;

                                        if (Array.isArray(folder.dcterms.title)) {
                                            title = folder.dcterms.title[0]
                                        }
                                        else {
                                            title = folder.dcterms.title;
                                        }
                                        var description;
                                        if (Array.isArray(folder.dcterms.description)) {
                                            description = folder.dcterms.description[0]
                                        }
                                        else {
                                            description = folder.dcterms.description;
                                        }

                                        var data = {
                                            "title": title,
                                            "description": description,
                                            "creator": folder.dcterms.creator,
                                            "open_access": "true",
                                            "domain": "generic"
                                        };

                                        if(folder.dcterms.publisher)
                                        {
                                            data["publisher"] = folder.dcterms.publisher;
                                        }
                                        else
                                        {
                                            data["publisher"] = "http://dendro.fe.up.pt";
                                        }

                                        if(folder.dcterms.subject){
                                            var subject = '';
                                            if(Array.isArray(folder.dcterms.subject)){
                                                for(var i = 0; i < folder.dcterms.subject.length; i++){
                                                    subject += folder.dcterms.subject[i];
                                                    if(i != folder.dcterms.subject.length - 1){
                                                        subject += ',';
                                                    }
                                                }
                                            }
                                            else{
                                                subject = folder.dcterms.subject;
                                            }
                                            
                                            data["keywords"] = subject;
                                        }

                                        if(folder.dcterms.language){
                                            data["language"] = folder.dcterms.language;
                                        }

                                        if(folder.dcterms.contributor){
                                            var contributors = '';
                                            if(Array.isArray(folder.dcterms.contributor)){
                                                for(var i = 0; i < folder.dcterms.contributor.length; i++){
                                                    contributors += folder.dcterms.contributor[i];
                                                    if(i != folder.dcterms.contributor.length - 1){
                                                        contributors += ';';
                                                    }
                                                }
                                            }
                                            else{
                                                contributors = folder.dcterms.contributor;
                                            }

                                            data["contributors"] = contributors;
                                        }

                                        var b2share = new B2Share(accessToken);

                                        b2share.createDeposition(function(error, deposition){
                                            if (error) {
                                                deleteFolderRecursive(parentFolderPath);
                                                var msg = "Error creating new deposition resource in B2Share";
                                                console.error(msg);
                                                res.status(500).json(
                                                    {
                                                        "result": "error",
                                                        "message": msg
                                                    }
                                                );
                                            }
                                            else{
                                                var depositionID = JSON.parse(deposition).deposit_id;

                                                b2share.uploadMultipleFilesToDeposition(depositionID, files, function(error){
                                                    if (error) {
                                                        deleteFolderRecursive(parentFolderPath);
                                                        var msg = "Error uploading multiple files to deposition in Zenodo";
                                                        console.error(msg);
                                                        res.status(500).json(
                                                            {
                                                                "result": "error",
                                                                "message": msg
                                                            }
                                                        );
                                                    }
                                                    else{
                                                        b2share.depositionPublish(depositionID, data, function(error, data){
                                                            if (error) {
                                                                var msg = "Error publishing a deposition in Zenodo";
                                                                console.error(msg);
                                                                res.status(500).json(
                                                                    {
                                                                        "result": "error",
                                                                        "message": msg
                                                                    }
                                                                );
                                                            }
                                                            else{
                                                                deleteFolderRecursive(parentFolderPath);

                                                                var msg = "Folder " + folder.nie.title + " successfully exported from Dendro" ;
                                                                var recordURL = B2Share.recordPath + "/" + data.body.record_id;

                                                                var client = nodemailer.createTransport("SMTP", {
                                                                    service: 'SendGrid',
                                                                    auth: {
                                                                        user: Config.sendGridUser,
                                                                        pass: Config.sendGridPassword
                                                                    }
                                                                });

                                                                var email = {
                                                                    from: 'support@dendro.fe.up.pt',
                                                                    to: req.session.user.foaf.mbox,
                                                                    subject: requestedResourceUri + ' exported',
                                                                    text: requestedResourceUri + ' was deposited in B2Share. The URL is ' + recordURL
                                                                };

                                                                client.sendMail(email, function(err, info){
                                                                    if(err)
                                                                    {
                                                                        console.log("[NODEMAILER] " + err);
                                                                        flash('error', "Error sending request to user. Please try again later");
                                                                    }
                                                                    else
                                                                    {
                                                                        console.log("[NODEMAILER] email sent: " + info);
                                                                        flash('success', "Sent request to project's owner");
                                                                    }
                                                                });

                                                                res.json(
                                                                    {
                                                                        "result": "OK",
                                                                        "message": msg,
                                                                        "recordURL": recordURL
                                                                    }
                                                                );
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    catch(err){
                                        deleteFolderRecursive(parentFolderPath);
                                        console.error(err);
                                        res.status(500).json(
                                            {
                                                "result": "error",
                                                "message": err
                                            }
                                        );
                                    }
                                }
                            });
                        }
                    });
                }
            }
            else
            {

            }
        }
        else {

        }
    });
};
exports.export_to_repository = function(req, res){

    try{

        var targetRepository = req.body.repository;

        if(targetRepository.ddr.hasPlatform.foaf.nick == 'ckan' ){
            export_to_repository_ckan(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick == 'dspace' || targetRepository.ddr.hasPlatform.foaf.nick == 'eprints'  )
        {
            export_to_repository_sword(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick == 'figshare'  )
        {
            export_to_repository_figshare(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick == 'zenodo'  )
        {
            export_to_repository_zenodo(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick == 'b2share')
        {
            export_to_repository_b2share(req, res);
        }
        else{
            var msg = "Invalid target repository";
            console.error(msg);
            res.status(500).json(
                {
                    "result" : "error",
                    "message" : msg
                }
            );
        }

    }
    catch(e)
    {
        var msg = "Error exporting to repository: " + e.message;
        console.error(msg);
        res.status(500).json(
            {
                "result" : "error",
                "message" : msg
            }
        );
    }
};

exports.sword_collections = function(req, res){
    var targetRepository = req.body.repository;
    var serviceDocumentRef = null;
    if(targetRepository.ddr.hasPlatform.foaf.nick == "dspace"){
        serviceDocumentRef =targetRepository.ddr.hasExternalUrl+ Config.swordConnection.DSpaceServiceDocument;
    }
    else if(targetRepository.ddr.hasPlatform.foaf.nick == "eprints")
    {
        serviceDocumentRef =targetRepository.ddr.hasExternalUrl+ Config.swordConnection.EprintsServiceDocument;
    }
    var options = {
        user: targetRepository.ddr.hasUsername,
        password: targetRepository.ddr.hasPassword,
        serviceDocRef:serviceDocumentRef
    }
    swordConnection.listCollections(options, function(err, message,collections){
        if(!err)
        {
            console.log(message);
            res.json(collections)
        }
        else{
            console.error(message);
            res.status(500).json(
                {
                    "result" : "error",
                    "message" : message
                }
            );
        }
    });
};

deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
