//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require("path");
const fs = require("fs");
const nfs = require('node-fs');
const slug = require('slug');
const async = require("async");
const _ = require("underscore");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const db = Config.getDBByID();


function Folder (object)
{
    const self = this;
    self.addURIAndRDFType(object, "folder", Folder);
    Folder.baseConstructor.call(this, object);
    
    if(
        isNull(self.ddr) &&
        isNull(self.ddr.humanReadableURI) &&
        !isNull(object.nie)
    )
    {
        self.ddr.humanReadableURI = object.nie.isLogicalPartOf + "/" + object.nie.title;
    }

    self.ddr.fileExtension = "folder";
    self.ddr.hasFontAwesomeClass = "fa-folder";

    if(!isNull(object.nie) && !isNull(object.nie.title))
    {
        self.nie.title = object.nie.title;
    }

    return self;
}

Folder.prototype.saveIntoFolder = function(
    destinationFolderAbsPath,
    includeMetadata,
    includeTempFilesLocations,
    includeOriginalNodes,
    callback)
{
    const self = this;

    const saveIntoFolder = function
        (node,
         destinationFolderAbsPath,
         includeMetadata,
         includeTempFilesLocations,
         includeOriginalNodes,
         callback) {
        if (node instanceof File) {
            node.saveIntoFolder(
                destinationFolderAbsPath,
                includeMetadata,
                includeTempFilesLocations,
                includeOriginalNodes,
                function (err, absPathOfFinishedFile) {
                if (isNull(err)) {
                    const descriptors = node.getDescriptors([Elements.access_types.locked], [Elements.access_types.backuppable]);
                    const fileNode = {
                        resource: node.uri,
                        metadata: descriptors
                    };

                    if (includeOriginalNodes)
                        fileNode.original_node = node;

                    if (includeTempFilesLocations)
                        fileNode.temp_location = absPathOfFinishedFile;

                    return callback(null, absPathOfFinishedFile, fileNode);
                }
                else {
                    const error = "Error saving a file node (leaf) at " + node.uri + " " + absPathOfFinishedFile;
                    console.log(error);
                    return callback(1, error);
                }
            });
        }
        else if (node instanceof Folder)
        {
            const destinationFolder = destinationFolderAbsPath + "/" + node.nie.title;

            //mode = 0777, recursive = true
            nfs.mkdir(destinationFolder, Config.tempFilesCreationMode, true, function (err) {
                if (isNull(err)) {
                    node.getLogicalParts(function (err, children) {
                        if (isNull(err) && !isNull(children) && children instanceof Array) {
                            if (children.length > 0) {
                                const saveChild = function (child, callback) {
                                    saveIntoFolder(child, destinationFolder, includeMetadata, includeTempFilesLocations, includeOriginalNodes, function (err, message, childNode) {
                                        if (isNull(err)) {
                                            if (includeMetadata) {
                                                return callback(null, childNode);
                                            }
                                            else {
                                                return callback(null, null);
                                            }
                                        }
                                        else {
                                            const error = "Unable to save a child with uri : " + child.uri + ". Message returned : " + message;
                                            console.error(error);
                                            return callback(1, error);

                                        }
                                    });
                                };

                                async.mapSeries(children, saveChild, function (err, childrenNodes) {
                                    if (isNull(err)) {
                                        const message = "Finished saving a complete folder at " + node.uri;
                                        console.log(message);

                                        if (includeMetadata) {
                                            const descriptors = node.getDescriptors([Elements.access_types.locked], [Elements.access_types.backuppable]);

                                            const folderNode = {
                                                resource: node.uri,
                                                metadata: descriptors
                                            };

                                            if (!isNull(childrenNodes)) {
                                                folderNode.children = childrenNodes;
                                            }

                                            if (includeTempFilesLocations)
                                                folderNode.temp_location = destinationFolder;

                                            if (includeOriginalNodes)
                                                folderNode.original_node = node;

                                            return callback(null, destinationFolder, folderNode);
                                        }
                                        else {
                                            return callback(null, destinationFolder);
                                        }
                                    }
                                    else {
                                        const error = "Error saving a file node (leaf) at " + node.uri + " " + childrenNodes;
                                        console.log(error);
                                        return callback(1, error);
                                    }
                                });
                            }
                            else {
                                var message = "Encountered empty folder at " + node.uri + ", when attempting to save the resource to " + destinationFolder;
                                console.log(message);

                                const selfMetadata = {
                                    resource: node.uri,
                                    metadata: node.getDescriptors([Elements.access_types.locked], [Elements.access_types.backuppable]),
                                    children: []
                                };

                                if (includeOriginalNodes)
                                    selfMetadata.original_node = node;

                                if (includeMetadata) {
                                    return callback(null, destinationFolder, selfMetadata);
                                }
                                else {
                                    return callback(null, destinationFolder);
                                }
                            }
                        }
                        else {
                            const error = "Error getting children of node at " + node.uri + " " + err + ", when attempting to save the resource to " + destinationFolder;
                            console.error(error);
                            return callback(1, error);
                        }
                    });
                }
                else {
                    const error = "Error creating subfolder for saving node at " + node.uri + " " + err + ", when attempting to save the resource to " + destinationFolder;
                    console.error(error);
                    return callback(1, error);
                }
            });
        }
        else {
            console.log("Null or invalid node " + node + ", when attempting to save the resource to " + destinationFolderAbsPath);
        }
    };

    saveIntoFolder(self, destinationFolderAbsPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, callback);
};

Folder.prototype.getChildrenRecursive = function (callback, includeSoftDeletedChildren) {
    const self = this;
    let query;

    /**
     *   Note the PLUS sign (+) on the nie:isLogicalPartOf+ of the query below.
     *    (Recursive querying through inference).
     *   @type {string}
     */
    if(includeSoftDeletedChildren === true)
    {
        query =
            "SELECT ?uri, ?last_modified, ?name\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   [1] nie:hasLogicalPart+ ?uri. \n" +
            "   ?uri ddr:modified ?last_modified. \n" +
            "   OPTIONAL {?uri ddr:deleted true}. \n" +
            "   ?uri nie:title ?name. \n" +
            "} ";
    }
    else
    {
        query =
            "SELECT ?uri, ?last_modified, ?name\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   [1] nie:hasLogicalPart+ ?uri. \n" +
            "   ?uri ddr:modified ?last_modified. \n" +
            "   filter not exists { ?uri ddr:deleted 'true' }. \n" +
            "   ?uri nie:title ?name. \n" +
            "} ";
    }

    /*const query =
        "SELECT ?uri, ?last_modified, ?name\n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   [1] nie:hasLogicalPart+ ?uri. \n" +
        "   ?uri ddr:modified ?last_modified. \n" +
        "   ?uri nie:title ?name. \n" +
        "} ";*/

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
                value: self.uri
            }
        ],
        function(err, result) {
            if(isNull(err))
            {
                if(result instanceof Array)
                {
                    callback(err,result);
                }
                else
                {
                    return callback(true, "Invalid response when getting recursive children of resource : " + self.uri);
                }
            }
            else
            {
                return callback(true, "Error reported when querying for the children of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

Folder.prototype.createTempFolderWithContents = function(
    includeMetadata,
    includeTempFilesLocations,
    includeOriginalNodes,
    callback)
{
    const self = this;
    const fs = require("fs");

    const tmp = require("tmp");
    tmp.dir({
            dir : Config.tempFilesDir
        },
        function _tempDirCreated(err, tempFolderPath) {
            if(isNull(err))
            {
                console.log("Producing temporary folder on " + tempFolderPath +" to download "+self.uri);

                const tempSubFolderWithCorrectTitle = tempFolderPath + "/" + self.nie.title;
                fs.mkdir(tempSubFolderWithCorrectTitle, function(err)
                {
                    if(isNull(err))
                    {
                        self.saveIntoFolder(
                            tempFolderPath,
                            includeMetadata,
                            includeTempFilesLocations,
                            includeOriginalNodes,
                            function(err, pathOfFinishedFolder, metadata)
                        {
                            return callback(null, tempFolderPath, pathOfFinishedFolder, metadata);
                        });
                    }
                    else
                    {
                        return callback(1, "Unable to create temporary folder",  "Unable to create temporary folder", "Unable to fetch metadata");
                    }
                });
            }
        });
};

/**
 *
 * @param includeMetadata
 * @param callback
 * @param bagItOptions
 * {
    bagName: '/path/to/new/bag',
    originDirectory: '/path/to/dir/to/bag',
    cryptoMethod: 'sha256',
    sourceOrganization: 'Example Organization',
    organizationAddress: '123 Street',
    contactName: 'Contact Name',
    contactPhone: '555-555-5555',
    contactEmail: 'test@example.org',
    externalDescription: 'An example description'
}
 */

Folder.prototype.zipAndDownload = function(includeMetadata, callback, bagItOptions)
{
    const self = this;
    self.createTempFolderWithContents(includeMetadata, false, false, function(err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
    {
        if(isNull(err))
        {
            console.log("Preparing to zip contents of folder : " + absolutePathOfFinishedFolder);

            async.series([
                function(cb){
                    if(includeMetadata)
                    {
                        const fs = require("fs");

                        const outputFilename = path.join(absolutePathOfFinishedFolder, Config.packageMetadataFileName);

                        console.log("FINAL METADATA : " + JSON.stringify(metadata));

                        fs.writeFile(outputFilename, JSON.stringify(metadata, null, 4), "utf-8", function(err) {
                            if(err) {
                                console.log(err);
                                cb(err);
                            } else {
                                const msg = "JSON saved to " + outputFilename;
                                console.log(msg);
                                cb(null);
                            }
                        });
                    }
                    else
                    {
                        cb(null);
                    }
                },
                function(cb)
                {
                    if(!isNull(bagItOptions) && bagItOptions instanceof Object)
                    {
                        self.bagit(absolutePathOfFinishedFolder, parentFolderPath, bagItOptions, function(err, absolutePathOfBaggedFolder){
                            if(isNull(err))
                            {
                                console.log("BaggIted folder! at : " + absolutePathOfBaggedFolder);
                                cb(0, absolutePathOfBaggedFolder);
                            }
                            else
                            {
                                cb(1, "Error BaggItting folder : " + absolutePathOfFinishedFolder);
                            }
                        });
                    }
                    else
                    {
                        Folder.zip(absolutePathOfFinishedFolder, parentFolderPath, function(err, absolutePathOfZippedFile){
                            if(isNull(err))
                            {
                                console.log("Zipped folder! at : " + absolutePathOfZippedFile);
                                cb(0, absolutePathOfZippedFile);
                            }
                            else
                            {
                                cb(1, "Error zipping folder : " + absolutePathOfFinishedFolder);
                            }
                        });
                    }
                }
            ],
            function(err, results){
                if(isNull(err))
                {
                    return callback(err, results[1]);
                }
                else
                {
                    return callback(err, callback(err, results));
                }

            });
        }
        else
        {
            return callback(1, "Error producing folder structure for zipping" + absolutePathOfFinishedFolder);
        }
    });
};

//bag folder according to the Bagit 0.97 Spec
Folder.prototype.bagit = function(bagItOptions, callback) {
    const self = this;

    async.waterfall(
    [
        function(cb)
        {
            if(typeof bagItOptions.bagName === 'undefined' || bagItOptions.bagName === "undefined")
            {
                if (isNull(self.nie.title))
                {
                    self.nie.title = "bagit_backup";
                }

                self.createTempFolderWithContents(true, false, false, function(err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                {
                    if (isNull(err))
                    {
                        console.log("Produced temporary folder on " + absolutePathOfFinishedFolder + " to bagit " + self.uri);
                        const path = require("path");

                        const fs = require("fs");
                        const outputFilename = path.join(absolutePathOfFinishedFolder, Config.packageMetadataFileName);

                        console.log("FINAL METADATA : " + JSON.stringify(metadata));

                        fs.writeFile(outputFilename, JSON.stringify(metadata, null, 4), "utf-8", function(err) {
                            if(err) {
                                console.log(err);
                                cb(err);
                            } else {
                                const msg = "JSON saved to " + outputFilename;
                                console.log(msg);

                                bagItOptions.bagName = path.join(parentFolderPath, "bagit_temp");
                                bagItOptions.originDirectory = absolutePathOfFinishedFolder;
                                cb(null, bagItOptions.bagName, parentFolderPath);
                            }
                        });
                    }
                    else
                    {
                        cb(err, parentFolderPath);
                    }
                });
            }
            else
            {
                cb(1, bagItOptions);
            }
        },
        function(absolutePathOfFinishedFolder, parentFolderPath, cb)
        {
            const gladstone = require(Pathfinder.absPathInApp("/node_modules/gladstone/gladstone.js"));
            gladstone.createBagDirectory(bagItOptions)
                .then(function(result){
                    cb(null, {
                        result : result,
                        absolutePathOfFinishedFolder : absolutePathOfFinishedFolder,
                        parentFolderPath : parentFolderPath
                    });
                })
                .catch(function(err){
                    cb(err, "Unable to create the bagit package " + err);
                });
        }
    ],
    function(err, results){
        return callback(err, results.result, results.absolutePathOfFinishedFolder, results.parentFolderPath);
    });
};

Folder.zip = function(sourceFolderAbsPath, destinationFolderForZipAbsPath, callback, nameForFinishedZipFile, zipContentsInsteadOfFolder)
{
    const path = require("path");
    if(!sourceFolderAbsPath.startsWith(path.sep))
    {
        return callback(1, "Invalid source folder absolute path specified. It does not start with " + path.sep);
    }
    else if(!destinationFolderForZipAbsPath.startsWith(path.sep))
    {
        return callback(1, "Invalid destination folder absolute path specified. It does not start with " + path.sep);
    }
    else
    {
        const exec = require("child_process").exec;

        if(isNull(nameForFinishedZipFile))
        {
            nameForFinishedZipFile = path.basename(sourceFolderAbsPath);
            nameForFinishedZipFile = slug(nameForFinishedZipFile) + ".zip";
        }

        const parentFolderAbsPath = path.resolve(sourceFolderAbsPath, '..');
        const nameOfFolderToZip = path.basename(sourceFolderAbsPath);

        let cwd;
        let command;

        if(zipContentsInsteadOfFolder)
        {
            cwd =  {cwd: sourceFolderAbsPath};
            command = 'zip -r \"' + nameForFinishedZipFile + "\" \* &&\n mv " + nameForFinishedZipFile + " ..";

        }
        else
        {
            cwd =  {cwd: parentFolderAbsPath};
            command = 'zip -r \"' + nameForFinishedZipFile + '\" .\/\"' + nameOfFolderToZip + '\"';
        }

        console.log("Zipping file with command " + command + " on folder " + parentFolderAbsPath + "....");

        const zip = exec(command, cwd, function (error, stdout, stderr) {
            if (error) {
                const errorMessage = "Error zipping file with command " + command + " on folder " + parentFolderAbsPath + ". Code Returned by Zip Command " + JSON.stringify(error);
                console.error(errorMessage);
                return callback(1, errorMessage);
            }
            else {
                console.log(stdout);

                let finishedZipFileAbsPath;

                if (zipContentsInsteadOfFolder) {
                    finishedZipFileAbsPath = destinationFolderForZipAbsPath;
                }
                else {
                    finishedZipFileAbsPath = path.join(destinationFolderForZipAbsPath, nameForFinishedZipFile);
                }

                console.log("Folder is in zip file " + finishedZipFileAbsPath);
                return callback(null, finishedZipFileAbsPath);
            }
        });
    }
};

Folder.prototype.findChildWithDescriptor = function(descriptor, callback)
{
    const self = this;
    const thisFolderAsParentDescriptor = new Descriptor({
        prefixedForm : "nie:isLogicalPartOf",
        value : self.uri
    });

    let queryDescriptors;

    if(descriptor instanceof Descriptor)
    {
        queryDescriptors = [thisFolderAsParentDescriptor, descriptor];
    }
    else if(descriptor instanceof Array)
    {
        queryDescriptors = descriptor.concat([thisFolderAsParentDescriptor]);
    }
    else
    {
        return callback(1, "Invalid descriptor array when querying for children of folder with a certain descriptor value.");
    }

    Folder.findByPropertyValue(queryDescriptors, function(err, child){
        if(!err)
        {
            if(isNull(child))
            {
                File.findByPropertyValue(queryDescriptors, function(err, child){
                    if(!err)
                    {
                        callback(err, child);
                    }
                    else
                    {
                        callback(500, "Error occurred while getting File child of " +self.uri + " with property/properties " + JSON.stringify(queryDescriptors));
                    }

                }, null, null, null, null, null, true);
            }
            else
            {
                callback(err, child);
            }
        }
        else
        {
            callback(500, "Error occurred while getting Folder child of " +self.uri + " with property/properties " + JSON.stringify(queryDescriptors));
        }

    }, null, null, null, null, null, true);
};

Folder.prototype.restoreFromLocalBackupZipFile = function(zipFileAbsLocation, userRestoringTheFolder, callback)
{
    const self = this;
    File.unzip(zipFileAbsLocation, function(err, unzippedContentsLocation)
    {
        fs.exists(unzippedContentsLocation, function (exists) {
            if(exists)
            {
                const fs = require("fs");

                fs.readdir(unzippedContentsLocation, function(err, files){

                    files = InformationElement.removeInvalidFileNames(files);

                    if(isNull(err) && files instanceof Array && files.length === 1)
                    {
                        const location = path.join(unzippedContentsLocation, files[0]);

                        self.restoreFromFolder(location, userRestoringTheFolder, true, true,function(err, result)
                        {
                            if(isNull(err))
                            {
                                self.undelete(callback, userRestoringTheFolder.uri, true);
                                //return callback(null, result);
                            }
                            else
                            {
                                return callback(err, "Unable to restore folder " + self.uri + " from local folder " + unzippedContentsLocation);
                            }
                        }, true);
                    }
                    else
                    {
                        const util = require('util');
                        console.log('Error: There should only be one folder at the root of the contents. Is this a valid backup? ' + util.inspect(files));
                        return callback(1, "There should only be one folder at the root of the contents. Is this a valid backup?");
                    }
                });
            }
            else
            {
                console.log('Error: ' + unzippedContentsLocation);
                return callback(1, "Error unzipping backup zip file : " + unzippedContentsLocation);
            }
        });
    });
};

Folder.prototype.loadContentsOfFolderIntoThis = function(absolutePathOfLocalFolder, replaceExistingFolder, callback, runningOnRoot, userPerformingTheOperation)
{
    const self = this;
    const path = require("path");

    const deleteFolder = function (cb) {
        if (runningOnRoot) {
            self.delete(function (err, result) {
                cb(err, result);
            }, userPerformingTheOperation.uri, null, replaceExistingFolder);
        }
        else {
            cb(null, self);
        }
    };

    const addChildrenTriples = function (childrenResources, cb) {
        self.nie.hasLogicalPart = _.map(childrenResources, function(child){
            return child.uri;
        });

        self.save(cb);
    };

    const loadChildFolder = function (folderName, cb) {
        const createChildFolderTriples = function (folderName, cb) {
            self.findChildWithDescriptor(new Descriptor({
                prefixedForm: "nie:title",
                value : folderName
            }), function (err, childFolder) {
                if (isNull(childFolder)) {
                    const childFolder = new Folder({
                        nie: {
                            isLogicalPartOf: self.uri,
                            title: folderName
                        }
                    });

                    childFolder.save(function(err, newFolder){
                        cb(err, newFolder);
                    });
                }
                else
                {
                    const childFolder = new Folder(childFolder);

                    if (childFolder.nie.isLogicalPartOf instanceof Array) {
                        childFolder.nie.isLogicalPartOf.push(self.uri)
                    }
                    else if (typeof childFolder.nie.isLogicalPartOf === "string") {
                        childFolder.nie.isLogicalPartOf = [childFolder.nie.isLogicalPartOf, self.uri];
                    }

                    childFolder.nie.title = folderName;

                    childFolder.save(function (err, result) {
                        cb(err, childFolder);
                    });
                }
            });
        };

        createChildFolderTriples(folderName, function (err, childFolder) {
            if (isNull(err)) {
                const childPathAbsFolder = path.join(absolutePathOfLocalFolder, folderName);
                childFolder.loadContentsOfFolderIntoThis(childPathAbsFolder, replaceExistingFolder, function (err, loadedFolder) {
                    childFolder.undelete(function(err, result){
                        cb(err, result);
                    }, userPerformingTheOperation.uri, true);
                }, false, userPerformingTheOperation);
            }
            else
            {
                cb(1, "Unable to create subfolder of " + self.uri + " with title " + folderName);
            }
        });
    };

    const loadChildFile = function (fileName, cb) {
        const createNewFileTriples = function (fileName, cb) {
            self.findChildWithDescriptor(new Descriptor({
                prefixedForm: "nie:title",
                value : fileName
            }), function (err, childFile) {
                if (isNull(childFile)) {
                    const childFile = new File({
                        nie: {
                            isLogicalPartOf: self.uri,
                            title: fileName
                        }
                    });

                    childFile.save(cb);
                }
                else {
                    const childFile = new File(childFile);

                    if (childFile.nie.isLogicalPartOf instanceof Array) {
                        childFile.nie.isLogicalPartOf.push(self.uri)
                    }
                    else {
                        childFile.nie.isLogicalPartOf = self.uri;
                    }

                    childFile.nie.title = fileName;


                    childFile.save(function (err, result) {
                        cb(null, childFile);
                    });
                }
            });
        };

        createNewFileTriples(fileName, function (err, childFile) {
            if (isNull(err)) {
                const localFilePath = path.join(absolutePathOfLocalFolder, fileName);
                childFile.loadFromLocalFile(localFilePath, function (err, childFile) {
                    if (isNull(err)) {
                        if (!isNull(childFile) && childFile instanceof File) {
                            childFile.undelete(function(err, res){
                                return cb(err, res);
                            }, userPerformingTheOperation.uri, false);
                        }
                        else
                        {
                            console.err("File was loaded but was not returned " + childFile);
                            return cb(1, "File was loaded but was not returned " + childFile);
                        }
                    }
                    else {
                        return cb(1, "Error loading file " + self.uri + " from local file " + localFilePath);
                    }
                });
            }
            else {
                return cb(err, childFile);
            }
        });
    };


    deleteFolder(function(err, result){
        fs.readdir(absolutePathOfLocalFolder, function(err, files){

            files = InformationElement.removeInvalidFileNames(files);

            if(runningOnRoot)
            {
                files = _.without(files, Config.packageMetadataFileName);
            }

            if(files.length > 0)
            {
                //console.error("Starting to load children of folder " + absolutePathOfLocalFolder + " into a folder with title " + self.nie.title + " ("+ self.uri +")");

                async.mapSeries(files, function(fileName, cb){
                    const absPath = path.join(absolutePathOfLocalFolder, fileName);
                    fs.stat(absPath, function(err, stats){
                        if(stats.isFile())
                        {
                            loadChildFile(fileName, function(err, savedChildFile){
                                //console.log("Saved FILE: " + savedChildFile.uri + ". result : " + err);
                                return cb(err, savedChildFile);
                            });
                        }
                        else if(stats.isDirectory())
                        {
                            loadChildFolder(fileName, function(err, savedChildFolder){
                                //console.log("Saved FOLDER: " + savedChildFolder.uri + " with title " +savedChildFolder.nie.title+ " . Error" + err);
                                return cb(err, savedChildFolder);
                            });
                        }
                    });
                }, function(err, results){
                    if(isNull(err))
                    {
                        //console.log("Adding pointers to children of " + path.basename(absolutePathOfLocalFolder) + " loaded into " + self.nie.title);
                        addChildrenTriples(results, function(err, result){
                            //console.log("All children of " + absolutePathOfLocalFolder + " loaded into " + self.uri);
                            return callback(null, self);
                        });
                    }
                    else
                    {
                        const msg  = "Unable to load children of " + self.uri + ": " + JSON.stringify(results);
                        console.error(msg);
                        return callback(500, msg);
                    }
                });
            }
            else
            {
                return callback(null, "There are no files to load. The data folder in the backup is empty.");
            }
        });
    });
};

Folder.prototype.loadMetadata = function(
    node,
    callback,
    entityLoadingTheMetadata,
    excludedDescriptorTypes,
    exceptionedDescriptorTypes
)
{
    const self = this;
    //console.log("Restoring metadata of " + node.resource + " into "+ self.uri);

    const getDescriptor = function(prefixedForm, node)
    {
        const wantedDescriptor = _.find(node.metadata, function(descriptor){
            return descriptor.prefixedForm === prefixedForm;
        });

        return new Descriptor(wantedDescriptor);
    };

    const loadMetadataIntoThisFolder = function(node, callback)
    {
        const metadata = node.metadata;

        const folderCallback = function(folder, err, result, callback) {
            if (isNull(err)) {
                return callback(null, "Folder " + folder.uri + " successfully restored. ");
            }
            else
            {
                return callback(err, "Error restoring folder " + folder.uri + " : " + result);
            }
        };

        const fileCallback = function (file, err, result, callback) {
            if (isNull(err)) {
                return callback(null, "File " + file.uri + " successfully restored .");
            }
            else {
                return callback(err, "Error restoring file " + file.uri + " : " + result);
            }
        };

        const loadMetadataForChildFolder = function (childNode, callback)
        {
            if (!isNull(childNode.children) && childNode.children instanceof Array)
            {
                Folder.findByUri(childNode.resource, function (err, folder) {
                    if (isNull(err) && !isNull(folder)) {
                        folder.loadMetadata(
                            childNode,
                            function (err, result) {
                                folderCallback(folder, err, result, callback);
                            },
                            entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                        );
                    }
                    else
                    {
                        const titleDescriptor = getDescriptor("nie:title", childNode);
                        self.findChildWithDescriptor(titleDescriptor, function(err, folder){
                            if(isNull(err) && !isNull(folder))
                            {
                                folder.loadMetadata(
                                    childNode,
                                    function (err, result) {
                                        folderCallback(folder, err, result, callback);
                                    },
                                    entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                );
                            }
                            else
                            {
                                const msg  = "Unable to find a folder with title " + titleDescriptor.value
                                console.error(msg);
                                callback(404, msg);
                            }
                        });
                    }
                });
            }
            else
            {
                File.findByUri(childNode.resource, function (err, file) {
                    if (isNull(err) && !isNull(file))
                    {
                        file.loadMetadata(
                            childNode,
                            function (err, result) {
                                fileCallback(file, err, result, callback);
                            },
                            entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                        );
                    }
                    else
                    {
                        const titleDescriptor = getDescriptor("nie:title", childNode);

                        self.findChildWithDescriptor(titleDescriptor, function(err, file)
                        {
                            if(isNull(err))
                            {
                                if(!isNull(file))
                                {
                                    file.loadMetadata(
                                        childNode,
                                        function (err, result) {
                                            fileCallback(file, err, result, callback);
                                        },
                                        entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                    );
                                }
                                else
                                {
                                    const msg  = "Unable to find a folder with title " + titleDescriptor.value;
                                    console.error(msg);
                                    callback(404, msg);
                                }
                            }
                            else
                            {
                                const msg  = "Error finding a folder with title " + titleDescriptor.value + JSON.stringify(file);
                                console.error(msg);
                                callback(500, msg);
                            }
                        });
                    }
                });
            }
        };

        const descriptors = [];
        if(!isNull(metadata) && metadata instanceof Array)
        {
            for(let i = 0; i < metadata.length; i++)
            {
                descriptors.push(
                    new Descriptor(
                        metadata[i]
                    )
                );
            }
        }

        Descriptor.mergeDescriptors(descriptors, function(err, descriptorsInBackup)
        {
            if(!isNull(node.children) && node.children instanceof Array)
            {
                async.mapSeries(
                    node.children,
                    loadMetadataForChildFolder,
                    function(err, results)
                    {
                        if(isNull(err))
                        {
                            self.replaceDescriptors(descriptorsInBackup, excludedDescriptorTypes, exceptionedDescriptorTypes);
                            self.save(function(err, result){
                                if(isNull(err))
                                {
                                    return callback(null, result)
                                }
                                else
                                {
                                    return callback(err, result);
                                }
                            }, true, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
                        }
                        else
                        {
                            return callback(err, results);
                        }
                    }
                );
            }
            else
            {
                File.findByUri(node.resource, function(err, currentFile)
                {
                    if(isNull(err))
                    {
                        if(!isNull(currentFile))
                        {
                            currentFile.loadMetadata(
                                node,
                                function(err, result){
                                    if(isNull(err))
                                    {
                                        return callback(null, "File " + currentFile.uri +" successfully restored. ");
                                    }
                                    else
                                    {
                                        return callback(err, "Error restoring file " + currentFile.uri + " : " + result);
                                    }
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                            );
                        }
                        else
                        {
                            self.loadMetadata(
                                node,
                                function(err, result){
                                    if(isNull(err))
                                    {
                                        return callback(null, "File " + self.uri +" successfully restored. ");
                                    }
                                    else
                                    {
                                        return callback(err, "Error restoring file " + self.uri + " : " + result);
                                    }
                                },
                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                            );
                        }
                    }
                    else
                    {
                        return callback(err, currentFile);
                    }
                });
            }
        });
    };

    if(!isNull(node))
    {
        Folder.findByUri(node.resource, function(err, existingFolder){
            if(isNull(err))
            {
                if(!isNull(existingFolder))
                {
                    const getTitleDescriptor = _.find(node.metadata, function(descriptor){
                        return descriptor.prefixedForm === "nie:title";
                    });

                    if(node.resource === self.uri)
                    {
                        existingFolder.loadMetadata(node, callback, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
                    }
                    else
                    {
                        return callback(1, "Unable to match backup folder to the folder in Dendro. Is the uploaded metadata .json file a backup of this folder?");
                    }
                }
                else
                {
                    loadMetadataIntoThisFolder(node, function(err, result)
                    {
                        callback(err, result);
                    });
                }
            }
            else
            {
                return callback(1, "Unable to match backup folder to the folder in Dendro. Is the uploaded metadata .json file a backup of this folder?");
            }
        });
    }
    else
    {
        return callback(1, "Cannot restore from a null metadata node");
    }
};

Folder.prototype.restoreFromFolder = function(absPathOfRootFolder,
                                              entityLoadingTheMetadata,
                                              attemptToRestoreMetadata,
                                              replaceExistingFolder,
                                              callback,
                                              runningOnRoot)
{
    const self = this;
    let entityLoadingTheMetadataUri;

    if(!isNull(entityLoadingTheMetadata) && entityLoadingTheMetadata instanceof User)
    {
        entityLoadingTheMetadataUri = entityLoadingTheMetadata.uri;
    }
    else
    {
        entityLoadingTheMetadataUri = User.anonymous.uri;
    }

    self.loadContentsOfFolderIntoThis(absPathOfRootFolder, replaceExistingFolder, function(err, result){
        if(isNull(err))
        {
            if(runningOnRoot)
            {
                /**
                 * Restore metadata values from medatada.json file
                 */
                const metadataFileLocation = path.join(absPathOfRootFolder, Config.packageMetadataFileName);
                const fs = require("fs");

                fs.exists(metadataFileLocation, function (existsMetadataFile) {
                    if(attemptToRestoreMetadata && existsMetadataFile)
                    {
                        fs.readFile(metadataFileLocation, 'utf8', function (err, data) {
                            if (err) {
                                console.log('Error: ' + err);
                                return;
                            }

                            const node = JSON.parse(data);

                            self.loadMetadata(node, function(err, result){
                                if(isNull(err))
                                {
                                    return callback(null, "Data and metadata restored successfully. Result : " + result);
                                }
                                else
                                {
                                    return callback(1, "Error restoring metadata for node " + self.uri + " : " + result);
                                }
                            }, entityLoadingTheMetadataUri, [Elements.access_types.locked],[Elements.access_types.restorable])
                        });
                    }
                    else
                    {
                        return callback(null, "Since no metadata.json file was found at the root of the zip file, no metadata was restored. Result : " + result);
                    }
                });
            }
            else
            {
                return callback(null, result);
            }
        }
        else
        {
            return callback(err, result);
        }
    }, runningOnRoot);
};

Folder.prototype.setDescriptorsRecursively = function(descriptors, callback, uriOfUserDeletingTheFolder)
{
    const self = this;
    const setDescriptors = function (node, cb) {
        if (node instanceof File) {
            node.updateDescriptors(descriptors);
            node.save(cb);
        }
        else if (node instanceof Folder) {
            node.updateDescriptors(descriptors);
            node.save(function (err, result) {
                    if (isNull(err)) {
                        node.getLogicalParts(function (err, children) {
                            if (isNull(err) && !isNull(children) && children instanceof Array) {
                                if (children.length > 0) {
                                    async.mapSeries(children, setDescriptors, function (err, results) {
                                        if (isNull(err)) {
                                            /*if(Config.debug.active && Config.debug.files.log_all_restore_operations)
                                        {
                                            var message = "Finished updating a complete folder at " + node.uri;
                                            console.log(message);
                                        }*/

                                        cb(null);
                                    }
                                    else
                                    {
                                        const error = "Error saving a file node (leaf) at " + node.uri + " " + results;
                                        console.log(error);
                                        cb(1, error);
                                    }
                                });
                            }
                            else
                            {
                                //var message = "Encountered empty folder at " + node.uri + ".";
                                //console.log(message);
                                cb(null)
                            }
                        }
                        else
                        {
                            const error = "Error getting children of node at " + node.uri + " " + err + ", when attempting to save descriptors : " + JSON.stringify(descriptors);
                            console.error(error);
                            cb(1, error);
                        }
                    });
                } else
                {
                    cb(1, "Unable to save descriptors "+ JSON.stringify(descriptors) + " for folder " + node.uri);
                }
            }, true,
                uriOfUserDeletingTheFolder);
        }
        else
        {
            console.log("Null or invalid node " + JSON.stringify(node) +
                ", when attempting to save the descriptors " + JSON.stringify(descriptors));
        }
    };

    setDescriptors(self,callback);
};

Folder.prototype.delete = function(callback, uriOfUserDeletingTheFolder, notRecursive, reallyDelete)
{
    const self = this;

    if(notRecursive)
    {
        if(self.ddr.deleted && reallyDelete)
        {
            self.deleteAllMyTriples(function(err, result){
                if(isNull(err))
                {
                    self.unlinkFromParent(function(err, result){
                        if(isNull(err))
                        {
                            return callback(err, self);
                        }
                        else
                        {
                            return callback(err, "Error unlinking folder " + self.uri + " from its parent. Error reported : " + result);
                        }
                    });
                }
                else
                {
                    return callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                }
            });
        }
        else
        {
            self.updateDescriptors(
                [
                    new Descriptor({
                        prefixedForm : "ddr:deleted",
                        value : true
                    })
                ]
            );

            self.save(function(err, result){
                return callback(err, self);
            }, true, uriOfUserDeletingTheFolder);
        }
    }
    else //recursive delete
    {
        if(self.ddr.deleted)
        {
            self.getLogicalParts(function(err, children){

                const deleteChild = function (child, cb) {
                    child.delete(cb, uriOfUserDeletingTheFolder, notRecursive);
                };

                async.mapSeries(children, deleteChild, function(err, result){
                    if(isNull(err))
                    {
                        self.deleteAllMyTriples(function(err, result){
                            if(isNull(err))
                            {
                                self.unlinkFromParent(function(err, result){
                                    if(isNull(err))
                                    {
                                        return callback(null, self);
                                    }
                                    else
                                    {
                                        return callback(err, "Error unlinking folder " + self.uri + " from its parent. Error reported : " + result);
                                    }
                                });
                            }
                            else
                            {
                                return callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                            }
                        });
                    }
                    else
                    {
                        return callback(err, "Error deleting children of folder " + self.uri + " during recursive delete. Error reported : " + result);
                    }
                });
            });
        }
        else
        {
            self.setDescriptorsRecursively(
                [
                    new Descriptor(
                        {
                            prefixedForm : "ddr:deleted",
                            value : true
                        }
                    )
                ],
                function(err, result)
                {
                    //console.log("Finished deleting " + self.uri + " with return " + err);
                    return callback(err, self);
                },

                uriOfUserDeletingTheFolder
            );
        }
    }
};

Folder.prototype.undelete = function(callback, uriOfUserUnDeletingTheFolder, notRecursive)
{
    const self = this;

    if(notRecursive)
    {
        self.updateDescriptors(
            [
                new Descriptor({
                    prefixedForm : "ddr:deleted",
                    value : null
                })
            ]
        );

        self.save(function(err, result){
            return callback(err, result);
        }, true, uriOfUserUnDeletingTheFolder);
    }
    else
    {
        self.setDescriptorsRecursively(
            [
                new Descriptor(
                    {
                        prefixedForm : "ddr:deleted",
                        value : null
                    }
                )
            ],
            function(err, result)
            {
                return callback(err, result);
            },
            uriOfUserUnDeletingTheFolder
        );
    }
};

Folder.deleteOnLocalFileSystem = function(absPath, callback)
{
    const isWin = /^win/.test(process.platform);
    const exec = require("child_process").exec;
    let command;

    if(isWin)
    {
        command = `rd /s /q "${absPath}"`;
    }
    else
    {
        command = `rm -rf ${absPath}`;
    }

    InformationElement.isSafePath(absPath, function(err, isSafe){
        if(!err && isSafe)
        {
            exec(command, {}, function (error, stdout, stderr)
            {
                return callback(error, stdout, stderr);
            });
        }
    });
};

Folder = Class.extend(Folder, InformationElement, "nfo:Folder");

module.exports.Folder = Folder;