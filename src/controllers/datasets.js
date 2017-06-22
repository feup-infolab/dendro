const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
const records = require(Config.absPathInSrcFolder("/controllers/records.js"));
const Serializers = require(Config.absPathInSrcFolder("/utils/serializers.js"));
const swordConnection = require(Config.absPathInSrcFolder("/export_libs/sword-connection/index.js"));
const Figshare = require(Config.absPathInSrcFolder("/export_libs/figshare/figshare.js"));
const B2ShareClient = require('node-b2share-v2');
const Zenodo = require(Config.absPathInSrcFolder("/export_libs/zenodo/zenodo.js"));
const Utils = require(Config.absPathInPublicFolder("/js/utils.js")).Utils;

const async = require('async');
const nodemailer = require('nodemailer');
const flash = require('connect-flash');
const _ = require('underscore');
const fs = require('fs');
const path = require('path');


const createPackage = function (parentFolderPath, folder, callback) {

    const folderToZip = path.join(parentFolderPath, folder.nie.title);
    const outputFilenameZip = path.join(parentFolderPath, folder.nie.title + ".zip");
    const outputFilenameRDF = path.join(parentFolderPath, folder.nie.title + ".rdf");
    const outputFilenameTXT = path.join(parentFolderPath, folder.nie.title + ".txt");
    const outputFilenameJSON = path.join(parentFolderPath, folder.nie.title + ".json");

    const filesToIncludeInPackage = [];
    const extraFiles = [];

    async.series([
            function (cb) {
                fs.readdir(folderToZip, function (err, files) {
                    if (!err) {
                        async.map(files, function (file, callback) {
                            const absPathToChild = path.join(folderToZip, file);
                            fs.stat(absPathToChild, function (err, stats) {
                                if (!stats.isDirectory()) {
                                    filesToIncludeInPackage.push(absPathToChild);
                                }
                                return callback(err, stats);
                            });
                        }, function (err, results) {
                            cb(err);
                        })
                    }
                    else {
                        cb(err, files);
                    }
                })
            },
            function (cb) {
                const archiver = require('archiver');

                const output = fs.createWriteStream(outputFilenameZip);
                const zipArchive = archiver('zip');

                zipArchive.pipe(output);

                zipArchive.bulk([
                    {expand: true, src: ["**"], cwd: folderToZip}
                ]);

                zipArchive.finalize(function (err, bytes) {

                    if (err) {
                        throw err;
                    }
                });

                output.on('close', function () {
                    console.log('Done with the zip', folderToZip);
                    filesToIncludeInPackage.push(outputFilenameZip);
                    extraFiles.push(outputFilenameZip);

                    folder.findMetadataRecursive(function (err, result) {
                        if (!err) {
                            const metadataRDF = require('pretty-data').pd.xml(Serializers.metadataToRDF(result));

                            fs.writeFile(outputFilenameRDF, metadataRDF, function (err) {
                                if (!err) {
                                    console.log("The file " + outputFilenameRDF + " was saved!");
                                    filesToIncludeInPackage.push(outputFilenameRDF);
                                    extraFiles.push(outputFilenameRDF);

                                    const metadataTXT = Serializers.metadataToText(result);

                                    fs.writeFile(outputFilenameTXT, metadataTXT, function (err) {
                                        if (!err) {
                                            console.log("The file " + outputFilenameTXT + " was saved!");
                                            filesToIncludeInPackage.push(outputFilenameTXT);
                                            extraFiles.push(outputFilenameTXT);

                                            const metadataJSON = require('pretty-data').pd.json(JSON.stringify(result));

                                            fs.writeFile(outputFilenameJSON, metadataJSON, function (err) {
                                                if (!err) {
                                                    console.log("The file " + outputFilenameJSON + " was saved!");
                                                    filesToIncludeInPackage.push(outputFilenameJSON);
                                                    extraFiles.push(outputFilenameJSON);

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
                            const msg = "Error finding metadata in " + folder.uri;
                            console.error(msg);
                            cb(true, null);

                        }
                    });
                });
            }
        ],
        function (err, results) {
            if (!err) {
                return callback(err, filesToIncludeInPackage, extraFiles);
            }
            else {
                return callback(err, results);
            }
        });
};

export_to_repository_sword = function(req, res){
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri)) {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
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
                if (!isNull(folder)) {
                    if (isNull(folder.dcterms.title)) {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (!err) {
                                createPackage(parentFolderPath, folder, function (err, files) {
                                    if (!err) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        let serviceDocumentRef = null;

                                        if (targetRepository.ddr.hasPlatform.foaf.nick === "dspace") {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.DSpaceServiceDocument;
                                        }
                                        else if (targetRepository.ddr.hasPlatform.foaf.nick === "eprints") {
                                            serviceDocumentRef = targetRepository.ddr.hasExternalUri + Config.swordConnection.EprintsServiceDocument;
                                        }
                                        const options = {
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
                                                const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. " + message;
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
                                                const msg = "Error exporting folder '" + folder.nie.title + "' from the Dendro platform. " + message;
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
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
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
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
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
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
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
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
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
    try{
        const CKAN = require('ckan');

        const requestedResourceUri = req.params.requestedResourceUri;
        const targetRepository = req.body.repository;

        let overwrite = false;

        try{
            overwrite = JSON.parse(req.body.overwrite);
        }
        catch(e)
        {
            console.error("Invalid value supplied to overwrite parameter. Not overwriting by default.");
        }

        const createOrUpdateFilesInPackage = function (datasetFolderMetadata, packageId, client, callback, overwrite, extraFiles) {
            const files = [];
            const locations = [];


            for (var i = 0; i < datasetFolderMetadata.original_node.nie.hasLogicalPart.length; i++) {
                const child = datasetFolderMetadata.children[i];
                if (!isNull(child)) {
                    if (child.original_node instanceof File) {
                        files.push(child.original_node);
                        locations.push(datasetFolderMetadata.children[i].temp_location);
                    }
                    else {
                        return callback(1, "There was an error preparing a file in the server: " + JSON.stringify(child));
                    }
                }
            }

            const resources = [];
            const path = require('path');

            for (var i = 0; i < files.length; i++) {
                const file = files[i];
                var location = locations[i];

                var fileExtension = path.extname(location).substr(1);
                var fileName = path.basename(location);

                var record =
                    {
                        absolute_file_path: location,
                        url: targetRepository.ddr.hasExternalUri + "/dataset/" + packageId + "/resource/" + fileName,
                        package_id: packageId,
                        description: file.dcterms.description || '< no description available >',
                        filename: fileName,
                        mimetype: Config.mimeType(fileExtension),
                        extension: fileExtension,
                        format: fileExtension.toUpperCase(),
                        overwrite_if_exists: overwrite
                    };

                resources.push(record);
            }

            for (var i = 0; i < extraFiles.length; i++) {
                var location = extraFiles[i];

                var fileExtension = path.extname(location).substr(1);
                var fileName = path.basename(location);

                var record =
                    {
                        absolute_file_path: location,
                        url: targetRepository.ddr.hasExternalUri + "/dataset/" + packageId + "/resource/" + fileName,
                        package_id: packageId,
                        filename: fileName,
                        mimetype: Config.mimeType(fileExtension),
                        extension: fileExtension,
                        format: fileExtension.toUpperCase(),
                        overwrite_if_exists: overwrite
                    };

                if (typeof Config.exporting.generated_files_metadata[fileExtension] !== "undefined") {
                    record.description = Config.exporting.generated_files_metadata[fileExtension].dcterms.description;
                }
                else {
                    record.description = '< no description available >';
                }

                resources.push(record);
            }

            client.upload_files_into_package(resources, packageId, function (err, result) {
                return callback(err, result);
            });
        };

        if(!isNull(req.body.repository) && !isNull(req.body.repository.ddr))
        {
            const organization = req.body.repository.ddr.hasOrganization;

            Folder.findByUri(requestedResourceUri, function(err, folder){
                if(!err)
                {
                    if(!isNull(folder))
                    {
                        if(isNull(folder.dcterms.title))
                        {
                            const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                            console.error(msg);
                            res.status(400).json(
                                {
                                    "result" : "error",
                                    "message" : msg
                                }
                            );
                        }
                        else if(isNull(folder.dcterms.description))
                        {
                            const msg = "Folder " + folder.uri + " has no description! Please set the Description property (from the dcterms metadata schema) and try the exporting process again.";
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
                            const jsonDescriptors = folder.getDescriptors([Config.types.private, Config.types.locked]);

                            const extrasJSONArray = [];

                            jsonDescriptors.forEach(function(column) {
                                const extraJson = {};
                                extraJson["key"] = column.uri;
                                extraJson["value"] = column.value;
                                extrasJSONArray.push(extraJson);
                            });

                            if(isNull(targetRepository.ddr.hasExternalUri))
                            {
                                const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
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
                                const client = new CKAN.Client(targetRepository.ddr.hasExternalUri, targetRepository.ddr.hasAPIKey);

                                /**Check if organization exists**/
                                client.action("organization_show",
                                    {
                                        id: targetRepository.ddr.hasOrganization
                                    },
                                    function(err, info)
                                    {
                                        if(!err)
                                        {
                                            const slug = require('slug');
                                            //var slugifiedTitle = slug(folder.dcterms.title, "-");
                                            let packageId = slug(folder.uri, "-");

                                            //ckan only accepts alphanumeric characters and dashes for the dataset ids
                                            //slugifiedTitle = slugifiedTitle.replace(/[^A-Za-z0-9-]/g, "").replace(/\./g, "").toLowerCase();
                                            packageId = packageId.replace(/[^A-Za-z0-9-]/g, "-").replace(/\./g, "-").toLowerCase();

                                            folder.createTempFolderWithContents(true, true, true, function(err, parentFolderPath, absolutePathOfFinishedFolder, datasetFolderMetadata){
                                                if(!err){
                                                    createPackage(parentFolderPath, folder, function (err, files, extraFiles)
                                                    {
                                                        if (!err)
                                                        {
                                                            const packageContents = [
                                                                {
                                                                    name: packageId,
                                                                    package_id: packageId,
                                                                    title: folder.dcterms.title,
                                                                    description: folder.dcterms.description,
                                                                    extras: extrasJSONArray,
                                                                    owner_org: organization
                                                                }
                                                            ];

                                                            client.action("package_show",
                                                                {
                                                                    id: packageId
                                                                },
                                                                function (err, result)
                                                                {
                                                                    //dataset was found, do we want to update or not?
                                                                    if (result.success)
                                                                    {
                                                                        if (!overwrite) //package was found and we are not overwriting
                                                                        {
                                                                            deleteFolderRecursive(parentFolderPath);

                                                                            const datasetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                                                                            const msg = "This dataset was already exported to this CKAN instance and is available at: <a href=\"" + datasetLocationOnCkan + "\">" + datasetLocationOnCkan + "</a> <br/><br/> Activate the Overwrite option to force an update.";
                                                                            res.status(500).json(
                                                                                {
                                                                                    "result": "error",
                                                                                    "message": msg
                                                                                }
                                                                            );
                                                                        }
                                                                        else //package was found BUT we are OVERWRITING
                                                                        {
                                                                            Utils.copyFromObjectToObject(packageContents[0], result.result);

                                                                            client.action(
                                                                                "package_update",
                                                                                result.result,
                                                                                function (err, result)
                                                                                {
                                                                                    if (result.success)
                                                                                    {
                                                                                        createOrUpdateFilesInPackage(datasetFolderMetadata, packageId, client, function (err, response)
                                                                                        {
                                                                                            if (!err)
                                                                                            {
                                                                                                const dataSetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                                                                                                const msg = "This dataset was exported to the CKAN instance and should be available at: <a href=\"" + dataSetLocationOnCkan + "\">" + dataSetLocationOnCkan + "</a> <br/><br/> The previous version was overwritten.";

                                                                                                res.json(
                                                                                                    {
                                                                                                        "result": "OK",
                                                                                                        "message": msg
                                                                                                    }
                                                                                                );

                                                                                                deleteFolderRecursive(parentFolderPath);
                                                                                            }
                                                                                            else
                                                                                            {
                                                                                                const msg = "Error uploading files in the dataset to CKAN.";
                                                                                                res.json(
                                                                                                    {
                                                                                                        "result": "error",
                                                                                                        "message": msg,
                                                                                                        "error" : response
                                                                                                    }
                                                                                                );

                                                                                                deleteFolderRecursive(parentFolderPath);
                                                                                            }
                                                                                        }, overwrite, extraFiles);
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                        const msg = "Error refreshing existing CKAN Dataset.";
                                                                                        var response = {
                                                                                            "result": "Error",
                                                                                            "message": msg
                                                                                        };

                                                                                        if (!isNull(result))
                                                                                        {
                                                                                            response.result = result;
                                                                                        }

                                                                                        res.json(
                                                                                            response
                                                                                        );

                                                                                        deleteFolderRecursive(parentFolderPath);
                                                                                    }
                                                                                }
                                                                            );
                                                                        }
                                                                    }
                                                                    //dataset not found
                                                                    else if (!result.success && result.error.__type === "Not Found Error")
                                                                    {
                                                                        client.action(
                                                                            "package_create",
                                                                            packageContents[0],
                                                                            function (response, result)
                                                                            {
                                                                                if(result.success)
                                                                                {
                                                                                    createOrUpdateFilesInPackage(datasetFolderMetadata, packageId, client, function(err, response){
                                                                                        if(!err)
                                                                                        {
                                                                                            const dataSetLocationOnCkan = targetRepository.ddr.hasExternalUri + "/dataset/" + packageId;
                                                                                            const msg = "This dataset was exported to the CKAN instance and should be available at: <a href=\"" + dataSetLocationOnCkan + "\">" + dataSetLocationOnCkan + "</a> <br/><br/>";

                                                                                            res.json(
                                                                                                {
                                                                                                    "result": "OK",
                                                                                                    "message": msg
                                                                                                }
                                                                                            );
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            let msg = "Error uploading files in the dataset to CKAN.";
                                                                                            if (!isNull(response))
                                                                                            {
                                                                                                msg += " Error returned : " + response;
                                                                                            }

                                                                                            res.json(
                                                                                                {
                                                                                                    "result": "Error",
                                                                                                    "message": msg,
                                                                                                    "error" : response
                                                                                                }
                                                                                            );
                                                                                        }

                                                                                        deleteFolderRecursive(parentFolderPath);
                                                                                    }, overwrite, extraFiles);
                                                                                }
                                                                                else
                                                                                {
                                                                                    let msg = "Error exporting dataset to CKAN.";
                                                                                    if (!isNull(response))
                                                                                    {
                                                                                        msg += " Error returned : " + response;
                                                                                    }

                                                                                    res.json(
                                                                                        {
                                                                                            "result": "Error",
                                                                                            "message": msg
                                                                                        }
                                                                                    );

                                                                                    deleteFolderRecursive(parentFolderPath);
                                                                                }

                                                                            }
                                                                        );
                                                                    }
                                                                    //dataset not found and error occurred
                                                                    else if (!result.success && result.error.__type !== "Not Found Error")
                                                                    {
                                                                        deleteFolderRecursive(parentFolderPath);
                                                                        const msg = "Error checking for presence of old dataset for " + requestedResourceUri + " Error reported : " + result;
                                                                        console.error(msg);

                                                                        res.status(500).json(
                                                                            {
                                                                                "result": "error",
                                                                                "message": msg
                                                                            }
                                                                        );
                                                                    }
                                                                    else
                                                                    {
                                                                        res.status(401).json(
                                                                            {
                                                                                "result": "error",
                                                                                "message": "Unable to parse response from CKAN repository."
                                                                            }
                                                                        );
                                                                    }
                                                                }
                                                            );
                                                        }
                                                        else
                                                        {
                                                            const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
                                                            console.error(msg);
                                                            res.status(500).json(
                                                                {
                                                                    "result": "error",
                                                                    "message": msg
                                                                }
                                                            );
                                                        }
                                                    }, datasetFolderMetadata);
                                                }
                                                else
                                                {
                                                    const msg = "Error creating temporary folder for export folder " + folder.nie.title + " from the Dendro platform.";
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
                                            let msg = "Unable to check if organization "+targetRepository.ddr.hasOrganization+"  exists.";

                                            if(!isNull(info) && !isNull(info.error) && (typeof info.error.message === "string"))
                                            {
                                                msg += " Error returned : " + info.error.message;
                                            }

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
                        const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
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
                    const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
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
            const msg = "Request body must contain the organization to which the user wants to submit the datataset in the field \"repository.ddr.hasOrganization\"";
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
        const msg = "Error exporting to repository: " + e.message;
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
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri)) {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
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
                if(!isNull(folder))
                {
                    if(isNull(folder.dcterms.title))
                    {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result" : "error",
                                "message" : msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (!err) {
                                createPackage(parentFolderPath, folder, function (err, files) {
                                    if (!err) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        try {
                                            const accessCodes = {
                                                consumer_key: targetRepository.ddr.hasConsumerKey,
                                                consumer_secret: targetRepository.ddr.hasConsumerSecret,
                                                access_token: targetRepository.ddr.hasAccessToken,
                                                access_token_secret: targetRepository.ddr.hasAccessTokenSecret
                                            };

                                            let title;
                                            if (Array.isArray(folder.dcterms.title)) {
                                                title = folder.dcterms.title[0]
                                            }
                                            else {
                                                title = folder.dcterms.title;
                                            }
                                            let description;
                                            if (Array.isArray(folder.dcterms.description)) {
                                                description = folder.dcterms.description[0]
                                            }
                                            else {
                                                description = folder.dcterms.description;
                                            }

                                            const article_data = {
                                                title: title,
                                                description: description
                                            };

                                            const figshare = new Figshare(accessCodes);
                                            figshare.createArticle(article_data, function (err, article) {
                                                if (err) {
                                                    deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Error creating article on figshare";
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
                                                            const msg = "Error adding files to article on figshare";
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
                                                            const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
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
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
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
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
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
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
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
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
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
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;

    if (isNull(targetRepository.ddr.hasExternalUri)) {
        const msg = "No target repository URL specified. Check the value of the ddr.hasExternalUri attribute";
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
                if (!isNull(folder)) {
                    if (isNull(folder.dcterms.title)) {
                        const msg = "Folder " + folder.uri + " has no title! Please set the Title property (from the dcterms metadata schema) and try the exporting process again.";
                        console.error(msg);
                        res.status(400).json(
                            {
                                "result": "error",
                                "message": msg
                            }
                        );
                    }
                    else {
                        folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata) {
                            if (!err) {
                                createPackage(parentFolderPath, folder, function (err, files) {
                                    if (!err) {
                                        console.log("Package for export " + requestedResourceUri + " created.");


                                        try {
                                            const accessTocken = targetRepository.ddr.hasAccessToken;


                                            let title;
                                            if (Array.isArray(folder.dcterms.title)) {
                                                title = folder.dcterms.title[0]
                                            }
                                            else {
                                                title = folder.dcterms.title;
                                            }
                                            let description;
                                            if (Array.isArray(folder.dcterms.description)) {
                                                description = folder.dcterms.description[0]
                                            }
                                            else {
                                                description = folder.dcterms.description;
                                            }

                                            const data = {
                                                title: title,
                                                description: description,
                                                creator: folder.dcterms.creator
                                            };

                                            const zenodo = new Zenodo(accessTocken);
                                            zenodo.createDeposition(data, function (err, deposition) {
                                                if (err) {
                                                    deleteFolderRecursive(parentFolderPath);
                                                    const msg = "Error creating new deposition resource in Zenodo";
                                                    console.error(msg);
                                                    res.status(500).json(
                                                        {
                                                            "result": "error",
                                                            "message": msg
                                                        }
                                                    );
                                                }
                                                else {
                                                    const depositionID = deposition.id;

                                                    zenodo.uploadMultipleFilesToDeposition(depositionID, files, function (err) {
                                                        if (err) {
                                                            deleteFolderRecursive(parentFolderPath);
                                                            const msg = "Error uploading multiple files to deposition in Zenodo";
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
                                                                    const msg = "Error publishing a deposition in Zenodo";
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
                                                                    const msg = "Folder " + folder.nie.title + " successfully exported from Dendro platform. ";
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
                                        const msg = "Error creating package for export folder " + folder.nie.title + " from the Dendro platform.";
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
                                const msg = "Error building temporary folder for export folder" + folder.nie.title + " from the Dendro platform.";
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
                    const msg = requestedResourceUri + " does not exist in Dendro or is not a folder. You cannot export an entire project to an external repository.";
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
                const msg = "Error fetching " + requestedResourceUri + " from the Dendro platform. Error reported : " + folder;
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
    const requestedResourceUri = req.params.requestedResourceUri;
    const targetRepository = req.body.repository;
    //targetRepository.ddr.hasExternalUri -> the b2share host url

    Folder.findByUri(requestedResourceUri, function(err, folder){
        if(!err){
            if(!isNull(folder)) {
                if(isNull(folder.dcterms.title) || isNull(folder.dcterms.creator)){
                    const msg = "Folder " + folder.uri + " has no title or creator! Please set these properties (from the dcterms metadata schema) and try the exporting process again.";
                    console.error(msg);
                    res.status(400).json(
                        {
                            "result": "error",
                            "message": msg
                        }
                    );
                }
                else{
                    Project.getOwnerProjectBasedOnUri(requestedResourceUri, function(err, project)
                    {
                       if(!err)
                       {
                           folder.createTempFolderWithContents(false, false, false, function (err, parentFolderPath, absolutePathOfFinishedFolder, metadata){
                               if(!err){
                                   createPackage(parentFolderPath, folder, function (err, files){
                                       if(!err){
                                           console.log("Package for export " + requestedResourceUri + " created.");

                                           try{
                                               const accessToken = targetRepository.ddr.hasAccessToken;

                                               let title;

                                               if (Array.isArray(folder.dcterms.title)) {
                                                   title = folder.dcterms.title[0]
                                               }
                                               else {
                                                   title = folder.dcterms.title;
                                               }
                                               let description;
                                               if (Array.isArray(folder.dcterms.description)) {
                                                   description = folder.dcterms.description[0]
                                               }
                                               else {
                                                   description = folder.dcterms.description;
                                               }

                                               const draftData = {
                                                   "titles": [{"title": title}],
                                                   "community": Config.eudatCommunityId,
                                                   "open_access": true,
                                                   "community_specific": {},
                                                   "creators": [{"creator_name": folder.dcterms.creator}]
                                               };

                                               if(folder.dcterms.publisher)
                                               {
                                                   draftData["publisher"] = folder.dcterms.publisher;
                                               }
                                               else if(!isNull(project.dcterms.publisher))
                                               {
                                                   draftData["publisher"] = project.dcterms.publisher;
                                               }
                                               else
                                               {
                                                   draftData["publisher"] = "http://dendro.fe.up.pt";
                                               }

                                               if(folder.dcterms.subject){
                                                   let subject = '';
                                                   if(Array.isArray(folder.dcterms.subject)){
                                                       for(var i = 0; i < folder.dcterms.subject.length; i++){
                                                           subject += folder.dcterms.subject[i];
                                                           if(i !== folder.dcterms.subject.length - 1){
                                                               subject += ',';
                                                           }
                                                       }
                                                   }
                                                   else{
                                                       subject = folder.dcterms.subject;
                                                   }

                                                   draftData["keywords"] = subject;
                                               }

                                               if(folder.dcterms.language){
                                                   draftData["language"] = folder.dcterms.language;
                                               }
                                               else if(!isNull(project.dcterms.language))
                                               {
                                                   draftData["language"] = project.dcterms.language;
                                               }
                                               else
                                               {
                                                   draftData["language"] = "en";
                                               }

                                               if(folder.dcterms.contributor){
                                                   let contributors = '';
                                                   if(Array.isArray(folder.dcterms.contributor)){
                                                       for(var i = 0; i < folder.dcterms.contributor.length; i++){
                                                           contributors += folder.dcterms.contributor[i];
                                                           if(i !== folder.dcterms.contributor.length - 1){
                                                               contributors += ';';
                                                           }
                                                       }
                                                   }
                                                   else{
                                                       contributors = folder.dcterms.contributor;
                                                   }

                                                   draftData["contributors"] = contributors;
                                               }

                                               const b2shareClient = new B2ShareClient(targetRepository.ddr.hasExternalUri, accessToken);
                                               b2shareClient.createADraftRecord(draftData, function (err, body) {
                                                   if (err) {
                                                       deleteFolderRecursive(parentFolderPath);
                                                       const msg = "Error creating new draft resource in B2Share";
                                                       console.error(msg);
                                                       res.status(500).json(
                                                           {
                                                               "result": "error",
                                                               "message": msg
                                                           }
                                                       );
                                                   }
                                                   else
                                                   {
                                                       //TODO send email
                                                       const recordIDToUpdate = body.data.id;
                                                       const bucketUrlToListFiles = body.data.links.files;
                                                       const fileBucketID = bucketUrlToListFiles.split('/').pop();

                                                       prepareFilesForUploadToB2share(files, fileBucketID, b2shareClient, function (error, result) {
                                                           if(error)
                                                           {
                                                               deleteFolderRecursive(parentFolderPath);
                                                               const msg = "Error uploading a file into a draft in B2Share";
                                                               res.status(500).json(
                                                                   {
                                                                       "result": "error",
                                                                       "message": msg
                                                                   }
                                                               );
                                                           }
                                                           else
                                                           {
                                                               //TODO send email
                                                               b2shareClient.submitDraftRecordForPublication(recordIDToUpdate, function (err, body) {
                                                                   if(err)
                                                                   {
                                                                       const msg = "Error publishing a draft in B2Share";
                                                                       console.error(msg);
                                                                       res.status(500).json(
                                                                           {
                                                                               "result": "error",
                                                                               "message": msg
                                                                           }
                                                                       );
                                                                   }
                                                                   else
                                                                   {
                                                                       deleteFolderRecursive(parentFolderPath);
                                                                       let msg = "Folder " + folder.nie.title + " successfully exported from Dendro";

                                                                       if(!isNull(body.data) && !isNull(body.data.metadata) && typeof body.data.metadata.ePIC_PID !== "undefined")
                                                                       {
                                                                           msg = msg + "<br/><br/><a href='" + body.data.metadata.ePIC_PID + "'>Click to see your published dataset<\/a>"
                                                                       }

                                                                       /*
                                                                        const msg = "Folder " + folder.nie.title + " successfully exported from Dendro" ;
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
                                                                        to: req.user.foaf.mbox,
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
                                                                        */
                                                                       /*
                                                                        res.json(
                                                                        {
                                                                        "result": "OK",
                                                                        "message": msg,
                                                                        "recordURL": recordURL
                                                                        }
                                                                        );*/
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
                                               });


                                               /*
                                                var b2share = new B2Share(accessToken);

                                                b2share.createDeposition(function(error, deposition){
                                                if (error) {
                                                deleteFolderRecursive(parentFolderPath);
                                                const msg = "Error creating new deposition resource in B2Share";
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
                                                const msg = "Error uploading multiple files to deposition in Zenodo";
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
                                                const msg = "Error publishing a deposition in Zenodo";
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

                                                const msg = "Folder " + folder.nie.title + " successfully exported from Dendro" ;
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
                                                to: req.user.foaf.mbox,
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
                                                });*/
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
                       else
                       {
                           res.status(500).json(
                               {
                                   "result" : "error",
                                   "message" : "Unable to get owner project of " + requestedResourceUri,
                                   "error" : project
                               }
                           )
                       }
                    });
                }
            }
            else
            {
                res.status(404).json(
                    {
                        "result" : "error",
                        "message" : "Folder identified by " + requestedResourceUri + " does not exist"
                    }
                )
            }
        }
        else {
            res.status(500).json(
                {
                    "result" : "error",
                    "message" : "Error finding" + requestedResourceUri
                }
            )
        }
    });
};

exports.export_to_repository = function(req, res){

    try{

        const targetRepository = req.body.repository;

        if(targetRepository.ddr.hasPlatform.foaf.nick === 'ckan' ){
            export_to_repository_ckan(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick === 'dspace' || targetRepository.ddr.hasPlatform.foaf.nick === 'eprints'  )
        {
            export_to_repository_sword(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick === 'figshare'  )
        {
            export_to_repository_figshare(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick === 'zenodo'  )
        {
            export_to_repository_zenodo(req, res);
        }
        else if(targetRepository.ddr.hasPlatform.foaf.nick === 'b2share')
        {
            export_to_repository_b2share(req, res);
        }
        else{
            const msg = "Invalid target repository";
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
        const msg = "Error exporting to repository: " + e.message;
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
    const targetRepository = req.body.repository;
    let serviceDocumentRef = null;
    if(targetRepository.ddr.hasPlatform.foaf.nick === "dspace"){
        serviceDocumentRef =targetRepository.ddr.hasExternalUrl+ Config.swordConnection.DSpaceServiceDocument;
    }
    else if(targetRepository.ddr.hasPlatform.foaf.nick === "eprints")
    {
        serviceDocumentRef =targetRepository.ddr.hasExternalUrl+ Config.swordConnection.EprintsServiceDocument;
    }
    const options = {
        user: targetRepository.ddr.hasUsername,
        password: targetRepository.ddr.hasPassword,
        serviceDocRef: serviceDocumentRef
    };
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
    let files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            const curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

prepareFilesForUploadToB2share = function (files, fileBucketID, b2shareClient, cb) {
    async.each(files, function(file, callback){
        const info = {"fileBucketID": fileBucketID, "fileNameWithExt": file.split('\\').pop()};
        fs.readFile(file, function (err, buffer) {
            if(err)
            {
                const msg = 'There was an error reading a file';
                return callback(err, msg);
            }
            else
            {
                b2shareClient.uploadFileIntoDraftRecord(info, buffer, function (err , data) {
                    return callback(err, data);
                });
            }
        });
    }, function(error, data){
        cb(error, data);
    });
};