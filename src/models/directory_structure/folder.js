//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;

var slug = require('slug');
var fs = require('fs');
var path = require('path');

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();
var async = require('async');
var _ = require('underscore');

function Folder (object)
{
    Folder.baseConstructor.call(this, object);

    var self = this;

    if(self.uri == null && object.nie != null)
    {
        self.uri = object.nie.isLogicalPartOf + "/" + object.nie.title;
    }

    self.rdf.type = Folder.prefixedRDFType;
    self.ddr.fileExtension = "folder";

    if(object.nie != null && object.nie.title != null)
    {
        self.nie.title = object.nie.title;
    }

    return self;
}

Folder.prototype.getLogicalParts = function(final_callback)
{
    var self = this;
    var fs = require('fs');

    var query =
            "SELECT ?uri ?type\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
                "{ \n" +
                    " [1] nie:hasLogicalPart ?uri . \n" +
                    "?uri rdf:type ?type . \n" +
                    "?uri rdf:type nfo:Folder  \n"+
                " } UNION { \n" +
                    " [1] nie:hasLogicalPart ?uri . \n" +
                    "?uri rdf:type ?type . \n" +
                    "?uri rdf:type nfo:FileDataObject \n"+
                "} \n" +
            "} \n";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type: DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, children) {
            if(!err)
            {
                if(children != null && children instanceof Array)
                {
                    var getChildrenProperties = function(child, cb)
                    {
                        if(child.type == Folder.rdfType)
                        {
                            Folder.findByUri(child.uri, function(err, folder)
                            {
                                cb(err, folder);
                            });
                        }
                        else if(child.type == File.rdfType)
                        {
                            File.findByUri(child.uri, function(err, file)
                            {
                                cb(err, file);
                            });
                        }
                        else
                        {
                            var error = "Unknown child node type : " + child.type;
                            console.error(error);
                            cb(1, error);
                        }
                    };

                    async.map(children, getChildrenProperties, function(err, children){
                        if(!err)
                        {
                            final_callback(null, children);
                        }
                        else
                        {
                            final_callback(1, children)
                        }
                    });
                }
                else
                {
                    callback(1,"Unable to retrieve Information Element's metadata " + children);
                }
        }
    });
};

Folder.prototype.saveIntoFolder = function(destinationFolderAbsPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, callback)
{
    var self = this;

    var saveIntoFolder = function(node, destinationFolderAbsPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, callback)
    {
        if(node instanceof File)
        {
            node.saveIntoFolder(destinationFolderAbsPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, function(err, absPathOfFinishedFile)
            {
                if(!err)
                {
                    var descriptors = node.getDescriptors([Config.types.locked],[Config.types.backuppable]);
                    var fileNode = {
                        resource : node.uri,
                        metadata : descriptors
                    };

                    if(includeOriginalNodes)
                        fileNode.original_node = node

                    if(includeTempFilesLocations)
                        fileNode.temp_location = absPathOfFinishedFile;

                    callback(0, absPathOfFinishedFile, fileNode);
                }
                else
                {
                    var error = "Error saving a file node (leaf) at " + node.uri + " " + message;
                    console.log(error);
                    callback(1, error);
                }
            });
        }
        else if(node instanceof Folder)
        {
            var fs = require('fs');
            var nfs = require('node-fs');
            var path = require('path');
            var destinationFolder = destinationFolderAbsPath + "/" + node.nie.title;

            //mode = 0777, recursive = true
            nfs.mkdir(destinationFolder, Config.tempFilesCreationMode, true, function(err)
            {
                if(!err)
                {
                    node.getLogicalParts(function(err, children){
                        if(!err && children != null && children instanceof Array)
                        {
                            if(children.length > 0)
                            {
                                var saveChild = function(child, callback)
                                {
                                    saveIntoFolder(child, destinationFolder, includeMetadata, includeTempFilesLocations, includeOriginalNodes, function(err, message, childNode){
                                        if(!err)
                                        {
                                            if(includeMetadata)
                                            {
                                                callback(null, childNode);
                                            }
                                            else
                                            {
                                                callback(null, null);
                                            }
                                        }
                                        else
                                        {
                                            var error = "Unable to save a child with uri : " + child.uri + ". Message returned : " + message;
                                            console.error(error);
                                            callback(1, error);
                                            return;
                                        }
                                    });
                                };

                                async.map(children, saveChild, function(err, childrenNodes)
                                {
                                    if(!err)
                                    {
                                        var message = "Finished saving a complete folder at " + node.uri;
                                        console.log(message);

                                        if(includeMetadata)
                                        {
                                            var descriptors = node.getDescriptors([Config.types.locked],[Config.types.backuppable]);

                                            var folderNode = {
                                                resource : node.uri,
                                                metadata : descriptors
                                            };

                                            if(childrenNodes != null)
                                            {
                                                folderNode.children = childrenNodes;
                                            }

                                            if(includeTempFilesLocations)
                                                folderNode.temp_location = destinationFolder;

                                            if(includeOriginalNodes)
                                                folderNode.original_node = node

                                            callback(null, destinationFolder, folderNode);
                                        }
                                        else
                                        {
                                            callback(0, destinationFolder);
                                        }
                                    }
                                    else
                                    {
                                        var error = "Error saving a file node (leaf) at " + node.uri + " " + childrenNodes;
                                        console.log(error);
                                        callback(1, error);
                                    }
                                });
                            }
                            else
                            {
                                var message = "Encountered empty folder at " + node.uri + ", when attempting to save the resource to " + destinationFolder;
                                console.log(message);

                                var selfMetadata = {
                                    resource : node.uri,
                                    metadata : node.getDescriptors([Config.types.locked],[Config.types.backuppable]),
                                    children : []
                                };

                                if(includeOriginalNodes)
                                    selfMetadata.original_node = node

                                if(includeMetadata)
                                {
                                    callback(0, destinationFolder, selfMetadata);
                                }
                                else
                                {
                                    callback(0, destinationFolder);
                                }
                            }
                        }
                        else
                        {
                            var error = "Error getting children of node at " + node.uri + " " + err + ", when attempting to save the resource to " + destinationFolder;
                            console.error(error);
                            callback(1, error);
                        }
                    });
                }
                else
                {
                    var error = "Error creating subfolder for saving node at " + node.uri + " " + err + ", when attempting to save the resource to " + destinationFolder;
                    console.error(error);
                    callback(1, error);
                }
            });
        }
        else
        {
            console.log("Null or invalid node " + node + ", when attempting to save the resource to " + destinationFolderAbsPath);
        }
    };

    saveIntoFolder(self, destinationFolderAbsPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, callback);
};

Folder.prototype.createTempFolderWithContents = function(includeMetadata, includeTempFilesLocations, includeOriginalNodes, callback)
{
    var self = this;
    var fs = require('fs');

    var tmp = require('tmp');
    tmp.dir({
            dir : Config.tempFilesDir
        },
        function _tempDirCreated(err, tempFolderPath) {
            if(!err)
            {
                console.log("Producing temporary folder on " + tempFolderPath +" to download "+self.uri);

                var tempSubFolderWithCorrectTitle = tempFolderPath+"/"+self.nie.title;
                fs.mkdir(tempSubFolderWithCorrectTitle, function(err)
                {
                    if(!err)
                    {
                        self.saveIntoFolder(tempFolderPath, includeMetadata, includeTempFilesLocations, includeOriginalNodes, function(err, pathOfFinishedFolder, metadata)
                        {
                            callback(0, tempFolderPath, pathOfFinishedFolder, metadata);
                        });
                    }
                    else
                    {
                        callback(1, "Unable to create temporary folder",  "Unable to create temporary folder", "Unable to fetch metadata");
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
    var self = this;
    self.createTempFolderWithContents(includeMetadata, function(err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
    {
        if(!err)
        {
            console.log("Preparing to zip contents of folder : " + absolutePathOfFinishedFolder);

            async.series([
                function(cb){
                    if(includeMetadata)
                    {
                        var fs = require('fs');

                        var outputFilename = path.join(absolutePathOfFinishedFolder, Config.packageMetadataFileName);

                        console.log("FINAL METADATA : " + JSON.stringify(metadata));

                        fs.writeFile(outputFilename, JSON.stringify(metadata, null, 4), function(err) {
                            if(err) {
                                console.log(err);
                                cb(err);
                            } else {
                                var msg = "JSON saved to " + outputFilename;
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
                    if(bagItOptions != null && bagItOptions instanceof Object)
                    {
                        self.bagit(absolutePathOfFinishedFolder, parentFolderPath, bagItOptions, function(err, absolutePathOfBaggedFolder){
                            if(!err)
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
                            if(!err)
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
                if(!err)
                {
                    callback(err, results[1]);
                }
                else
                {
                    callback(err, callback(err, results));
                }

            });
        }
        else
        {
            callback(1, "Error producing folder structure for zipping" + absolutePathOfFinishedFolder);
        }
    });
};

//bag folder according to the Bagit 0.97 Spec
Folder.prototype.bagit = function(bagItOptions, callback) {
    var self = this;

    async.waterfall(
    [
        function(cb)
        {
            if(typeof bagItOptions.bagName == 'undefined' || bagItOptions.bagName == null)
            {
                if (self.nie.title === null)
                {
                    self.nie.title = "bagit_backup";
                }

                self.createTempFolderWithContents(true, false, false, function(err, parentFolderPath, absolutePathOfFinishedFolder, metadata)
                {
                    if (!err)
                    {
                        console.log("Produced temporary folder on " + absolutePathOfFinishedFolder + " to bagit " + self.uri);
                        var path = require('path');

                        var fs = require('fs');
                        var outputFilename = path.join(absolutePathOfFinishedFolder, Config.packageMetadataFileName);

                        console.log("FINAL METADATA : " + JSON.stringify(metadata));

                        fs.writeFile(outputFilename, JSON.stringify(metadata, null, 4), function(err) {
                            if(err) {
                                console.log(err);
                                cb(err);
                            } else {
                                var msg = "JSON saved to " + outputFilename;
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
            var gladstone = require(Config.absPathInApp("/node_modules/gladstone/gladstone.js"));
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
        callback(err, results.result, results.absolutePathOfFinishedFolder, results.parentFolderPath);
    });
};

Folder.zip = function(sourceFolderAbsPath, destinationFolderForZipAbsPath, callback, nameForFinishedZipFile, zipContentsInsteadOfFolder)
{
    var path = require('path');
    if(!sourceFolderAbsPath.startsWith(path.sep))
    {
        callback(1, "Invalid source folder absolute path specified. It does not start with " + path.sep);
    }
    else if(!destinationFolderForZipAbsPath.startsWith(path.sep))
    {
        callback(1, "Invalid destination folder absolute path specified. It does not start with " + path.sep);
    }
    else
    {
        var fs = require('fs');
        var exec = require('child_process').exec;

        if(nameForFinishedZipFile == null)
        {
            nameForFinishedZipFile = path.basename(sourceFolderAbsPath);
            nameForFinishedZipFile = slug(nameForFinishedZipFile) + ".zip";
        }

        var parentFolderAbsPath = path.resolve(sourceFolderAbsPath, '..');
        var nameOfFolderToZip = path.basename(sourceFolderAbsPath);

        if(zipContentsInsteadOfFolder)
        {
            var cwd =  {cwd: sourceFolderAbsPath};
            var command = 'zip -r \"' + nameForFinishedZipFile + "\" \* &&\n mv " + nameForFinishedZipFile + " ..";

        }
        else
        {
            var cwd =  {cwd: parentFolderAbsPath};
            var command = 'zip -r \"' + nameForFinishedZipFile + '\" .\/\"' + nameOfFolderToZip + '\"';
        }

        console.log("Zipping file with command " + command + " on folder " + parentFolderAbsPath + "....");

        var zip = exec(command, cwd, function (error, stdout, stderr)
        {
            if (error)
            {
                var errorMessage = "Error zipping file with command " + command + " on folder " + parentFolderAbsPath + ". Code Returned by Zip Command " + JSON.stringify(error);
                console.error(errorMessage);
                callback(1, errorMessage);
            }
            else
            {
                console.log(stdout);

                if(zipContentsInsteadOfFolder)
                {
                    var finishedZipFileAbsPath = destinationFolderForZipAbsPath;
                }
                else
                {
                    var finishedZipFileAbsPath = path.join(destinationFolderForZipAbsPath, nameForFinishedZipFile);
                }

                console.log("Folder is in zip file " + finishedZipFileAbsPath);
                callback(null, finishedZipFileAbsPath);
            }
        });
    }
}

Folder.prototype.restoreFromLocalBackupZipFile = function(zipFileAbsLocation, userRestoringTheFolder, callback)
{
    var self = this;
    File.unzip(zipFileAbsLocation, function(err, unzippedContentsLocation)
    {
        fs.exists(unzippedContentsLocation, function (exists) {
            if(exists)
            {
                var fs = require('fs');

                fs.readdir(unzippedContentsLocation, function(err, files){

                    files = InformationElement.removeInvalidFileNames(files);

                    if(!err && files instanceof Array && files.length == 1)
                    {
                        var location = path.join(unzippedContentsLocation, files[0]);

                        self.restoreFromFolder(location, userRestoringTheFolder, true, true,function(err, result)
                        {
                            if(!err)
                            {
                                self.undelete(callback, userRestoringTheFolder.uri, true);
                                //callback(null, result);
                            }
                            else
                            {
                                callback(err, "Unable to restore folder " + self.uri + " from local folder " + unzippedContentsLocation);
                            }
                        }, true);
                    }
                    else
                    {
                        var util = require('util');
                        console.log('Error: There should only be one folder at the root of the contents. Is this a valid backup? ' + util.inspect(files));
                        callback(1, "There should only be one folder at the root of the contents. Is this a valid backup?");
                    }
                });
            }
            else
            {
                console.log('Error: ' + unzippedContentsLocation);
                callback(1, "Error unzipping backup zip file : " + unzippedContentsLocation);
            }
        });
    });
};

Folder.prototype.loadContentsOfFolderIntoThis = function(absolutePathOfLocalFolder, replaceExistingFolder, callback, runningOnRoot, userPerformingTheOperation)
{
    var self = this;
    var path = require('path');

    console.error("Starting to load children of " + self.uri);

    var deleteFolder = function(cb)
    {
        if(runningOnRoot)
        {
            self.delete(function(err, result){
                cb(err, result);
            });
        }
        else
        {
            cb(null, self);
        }
    };

    var addChildrenToMe = function(childrenFileNamesArray, cb)
    {
        for(var i = 0; i < childrenFileNamesArray.length; i++)
        {
            childrenFileNamesArray[i] = self.uri + "/" + childrenFileNamesArray[i];
        }

        if(self.nie.hasLogicalPart instanceof Array)
        {
            self.nie.hasLogicalPart.push(childrenFileNamesArray);
        }
        else if(self.nie.hasLogicalPart != null)
        {
            childrenFileNamesArray.push(self.nie.hasLogicalPart);
            self.nie.hasLogicalPart = childrenFileNamesArray;
        }
        else
        {
            self.nie.hasLogicalPart = childrenFileNamesArray;
        }

        self.save(cb);
    };

    var loadChildFolder = function(folderName, cb)
    {
        var createFolder = function(folderName, cb){
            Folder.findByParentAndName(self.uri, folderName, function(err, childFolder){
                if(childFolder == null)
                {
                    var childFolder = new Folder({
                        nie : {
                            isLogicalPartOf : self.uri,
                            title : folderName
                        }
                    });

                    childFolder.save(cb);
                }
                else
                {
                    var childFolder = new Folder(childFolder);

                    if(childFolder.nie.isLogicalPartOf instanceof Array)
                    {
                        childFolder.nie.isLogicalPartOf.push(self.uri)
                    }
                    else
                    {
                        childFolder.nie.isLogicalPartOf = self.uri;
                    }

                    childFolder.nie.title = folderName;

                    childFolder.save(function(err, result){
                        cb(null, childFolder);
                    });
                }
            });
        };

        createFolder(folderName, function(err, childFolder){
            if(!err)
            {
                var childPathAbsFolder = path.join(absolutePathOfLocalFolder, folderName);
                childFolder.loadContentsOfFolderIntoThis(childPathAbsFolder, replaceExistingFolder, function(err, loadedFolder){
                    childFolder.undelete(cb, userPerformingTheOperation, true);
                });
            }
            else
            {
                cb(1, "Unable to create subfolder of " + self.uri + " with title " + folderName);
            }
        });
    };

    var loadChildFile = function(fileName, cb)
    {
        var createFile = function(fileName, cb){
            File.findByParentAndName(self.uri, fileName, function(err, childFile){
                if(childFile == null)
                {
                    var childFile = new File({
                        nie : {
                            isLogicalPartOf : self.uri,
                            title : fileName
                        }
                    });

                    childFile.save(cb);
                }
                else
                {
                    var childFile = new File(childFile);

                    if(childFile.nie.isLogicalPartOf instanceof Array)
                    {
                        childFile.nie.isLogicalPartOf.push(self.uri)
                    }
                    else
                    {
                        childFile.nie.isLogicalPartOf = self.uri;
                    }

                    childFile.nie.title = fileName;




                    childFile.save(function(err, result){
                        cb(null, childFile);
                    });
                }
            });
        };

        createFile(fileName, function(err, childFile){
            if(!err)
            {
                var localFilePath = path.join(absolutePathOfLocalFolder, fileName);
                childFile.loadFromLocalFile(localFilePath, function(err, childFile){
                    if(!err)
                    {
                        if(childFile != null && childFile instanceof File)
                        {
                            childFile.undelete(cb, userPerformingTheOperation, false);
                        }
                        else
                        {
                            console.err("File was loaded but was not returned " + childFile);
                            callback(1, "File was loaded but was not returned " + childFile);
                        }
                    }
                    else
                    {
                        callback(1, "Error loading file " + self.uri + " from local file " + localFilePath);
                    }
                });
            }
            else
            {
                cb(err, childFile);
            }
        });
    }

    /**
     * LOGIC
     */
    deleteFolder(function(err, result){
        fs.readdir(absolutePathOfLocalFolder, function(err, files){

            files = InformationElement.removeInvalidFileNames(files);

            if(runningOnRoot)
            {
                files = _.without(files, Config.packageMetadataFileName);
            }

            if(files.length > 0)
            {
                _.each(files, function(fileName){

                    var absPath = path.join(absolutePathOfLocalFolder, fileName);
                    fs.stat(absPath, function(err, stats){
                        if(stats.isFile())
                        {
                            loadChildFile(fileName, function(err, savedChildFile){
                                console.log("Saved FILE: " + savedChildFile.uri + ". result : " + err);
                                //cb(err, savedChildFile);
                            });
                        }
                        else if(stats.isDirectory())
                        {
                            loadChildFolder(fileName, function(err, savedChildFolder){
                                console.log("Saved FOLDER: " + savedChildFolder.uri + ". result : " + err);
                                //cb(err, savedChildFolder);
                            });
                        }
                    });
                });

                addChildrenToMe(files, function(err, result){
                    console.log("All children of " + absolutePathOfLocalFolder + " loaded into " + self.uri);
                    callback(null, self);
                });
            }
        });
    });
};

Folder.prototype.loadMetadata = function(node, callback, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    var self = this;
    console.log("Restoring " + node.resource + " into "+ self.uri);
    if(node != null)
    {
        if(node.resource == self.uri)
        {
            var metadata = node.metadata;
            if(metadata != null && metadata instanceof Array)
            {
                var descriptors = [];
                for(var i = 0; i < metadata.length; i++)
                {
                    descriptors.push(
                        new Descriptor(
                            metadata[i]
                        )
                    );
                }
            }

            Descriptor.mergeDescriptors(descriptors, function(err, oldDescriptors)
            {
                if(node.children != null && node.children instanceof Array)
                {
                    Folder.findByUri(node.resource, function(err, currentFolder){
                        if(currentFolder != null)
                        {
                            /**
                             * Function to carry on metadata loading for children
                             * @param childNode
                             * @param callback
                             */
                            var loadMetadataForChildFolder = function(childNode, callback)
                            {
                                if(childNode.children != null && childNode.children instanceof Array)
                                {
                                    Folder.findByUri(childNode.resource, function(err, folder){
                                        if(!err && folder != null)
                                        {
                                            folder.loadMetadata(
                                                childNode,
                                                function(err, result){
                                                    if(!err)
                                                    {
                                                        callback(null, "Folder " + folder.uri +" successfully restored. ");
                                                    }
                                                    else
                                                    {
                                                        callback(err, "Error restoring folder " + folder.uri + " : " + result);
                                                    }
                                                },
                                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                            );
                                        }
                                        else
                                        {
                                            callback(null, "Folder " + childNode.resource +" does not exist or there was an error retrieving it. Error " + folder);
                                        }
                                    });
                                }
                                else
                                {
                                    File.findByUri(childNode.resource, function(err, file){
                                        if(!err && file != null)
                                        {
                                            file.loadMetadata(
                                                childNode,
                                                function(err, result){
                                                    if(!err)
                                                    {
                                                        callback(null, "File " + file.uri +" successfully restored. ");
                                                    }
                                                    else
                                                    {
                                                        callback(err, "Error restoring file " + file.uri + " : " + result);
                                                    }
                                                },
                                                entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                            );
                                        }
                                        else
                                        {
                                            callback(null, "File " + childNode.resource +" does not exist or there was an error retrieving it. Error " + file);
                                        }
                                    });
                                }
                            }

                            async.map(node.children, loadMetadataForChildFolder, function(err, results){
                                if(!err)
                                {
                                    currentFolder.replaceDescriptorsInMemory(oldDescriptors, excludedDescriptorTypes, exceptionedDescriptorTypes);
                                    currentFolder.save(function(err, result){
                                        if(!err)
                                        {
                                            callback(null, result)
                                        }
                                        else
                                        {
                                            callback(err, result);
                                        }
                                    }, true, entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes);
                                }
                                else
                                {
                                    callback(err, results);
                                }
                            });
                        }
                        else
                        {
                            callback(null, "Folder " + currentFolder.uri +" does not exist ");
                        }
                    });
                }
                else
                {
                    File.findByUri(node.resource, function(err, currentFile)
                    {
                        if(!err)
                        {
                            if(currentFile != null)
                            {
                                currentFile.loadMetadata(
                                    node,
                                    function(err, result){
                                        if(!err)
                                        {
                                            callback(null, "File " + currentFile.uri +" successfully restored. ");
                                        }
                                        else
                                        {
                                            callback(err, "Error restoring file " + currentFile.uri + " : " + result);
                                        }
                                    },
                                    entityLoadingTheMetadata, excludedDescriptorTypes, exceptionedDescriptorTypes
                                );
                            }
                            else
                            {
                                callback(null, "File " + currentFile.uri +" does not exist ");
                            }
                        }
                        else
                        {
                            callback(err, currentFile);
                        }
                    });
                }
            });
        }
        else
        {
            callback(1, "Unable to match backup folder to the folder in Dendro. Is the uploaded metadata .json file a backup of this folder?");
        }
    }
    else
    {
        callback(1, "Cannot restore from a null metadata node");
    }
}

Folder.prototype.restoreFromFolder = function(absPathOfRootFolder,
                                              entityLoadingTheMetadata,
                                              attemptToRestoreMetadata,
                                              replaceExistingFolder,
                                              callback,
                                              runningOnRoot)
{
    var self = this;

    if(entityLoadingTheMetadata != null && entityLoadingTheMetadata instanceof User)
    {
        var entityLoadingTheMetadataUri = entityLoadingTheMetadata.uri;
    }
    else
    {
        var entityLoadingTheMetadataUri = User.anonymous.uri;
    }

    self.loadContentsOfFolderIntoThis(absPathOfRootFolder, replaceExistingFolder, function(err, result){
        if(!err)
        {
            if(runningOnRoot)
            {
                /**
                 * Restore metadata values from medatada.json file
                 */
                var metadataFileLocation = path.join(absPathOfRootFolder,  Config.packageMetadataFileName);
                var fs = require('fs');

                fs.exists(metadataFileLocation, function (existsMetadataFile) {
                    if(attemptToRestoreMetadata && existsMetadataFile)
                    {
                        fs.readFile(metadataFileLocation, 'utf8', function (err, data) {
                            if (err) {
                                console.log('Error: ' + err);
                                return;
                            }

                            var node = JSON.parse(data);

                            self.loadMetadata(node, function(err, result){
                                if(!err)
                                {
                                    callback(null, "Data and metadata restored successfully. Result : " + result);
                                }
                                else
                                {
                                    callback(1, "Error restoring metadata for node " + self.uri + " : " + result);
                                }
                            }, entityLoadingTheMetadataUri, [Config.types.locked],[Config.types.restorable])
                        });
                    }
                    else
                    {
                        callback(null, "Since no metadata.json file was found at the root of the zip file, no metadata was restored. Result : " + result);
                    }
                });
            }
            else
            {
                callback(null, result);
            }
        }
        else
        {
            callback(err, result);
        }
    }, runningOnRoot);
};

Folder.prototype.setDescriptorsRecursively = function(descriptors, callback, uriOfUserDeletingTheFolder)
{
    var self = this;
    var setDescriptors = function(node, cb)
    {
        if(node instanceof File)
        {
            node.updateDescriptorsInMemory(descriptors);
            node.save(cb);
        }
        else if(node instanceof Folder)
        {
            node.updateDescriptorsInMemory(descriptors);
            node.save(function(err, result){
                if(!err)
                {
                    node.getLogicalParts(function(err, children){
                        if(!err && children != null && children instanceof Array)
                        {
                            if(children.length > 0)
                            {
                                async.map(children, setDescriptors, function(err, results)
                                {
                                    if(!err)
                                    {
                                        /*if(Config.debug.active && Config.debug.files.log_all_restore_operations)
                                        {
                                            var message = "Finished updating a complete folder at " + node.uri;
                                            console.log(message);
                                        }*/

                                        cb(null);
                                    }
                                    else
                                    {
                                        var error = "Error saving a file node (leaf) at " + node.uri + " " + results;
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
                            var error = "Error getting children of node at " + node.uri + " " + err + ", when attempting to save descriptors : " + JSON.stringify(descriptors);
                            console.error(error);
                            cb(1, error);
                        }
                    });
                }
                else
                {
                    cb(1, "Unable to save descriptors "+ JSON.stringify(descriptors) + " for folder " + node.uri);
                }
            }, true, uriOfUserDeletingTheFolder);
        }
        else
        {
            console.log("Null or invalid node " + JSON.stringify(node) + ", when attempting to save the descriptors " + JSON.stringify(descriptors));
        }
    };

    setDescriptors(self,callback);
}

Folder.prototype.delete = function(callback, uriOfUserDeletingTheFolder, notRecursive, reallyDelete)
{
    var self = this;

    if(notRecursive)
    {
        if(self.ddr.deleted && reallyDelete)
        {
            self.deleteAllMyTriples(function(err, result){
                if(!err)
                {
                    self.unlinkFromParent(function(err, result){
                        if(!err)
                        {
                            callback(err, self);
                        }
                        else
                        {
                            callback(err, "Error unlinking folder " + self.uri + " from its parent. Error reported : " + result);
                        }
                    });
                }
                else
                {
                    callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                }
            });
        }
        else
        {
            self.updateDescriptorsInMemory(
                [
                    new Descriptor({
                        prefixedForm : "ddr:deleted",
                        value : true
                    })
                ]
            );

            self.save(function(err, result){
                callback(err, self);
            }, true, uriOfUserDeletingTheFolder);
        }
    }
    else //recursive delete
    {
        if(self.ddr.deleted)
        {
            self.getLogicalParts(function(err, children){

                var deleteChild = function(child, cb)
                {
                    child.delete(cb, uriOfUserDeletingTheFolder, notRecursive);
                }

                async.map(children, deleteChild, function(err, result){
                    if(!err)
                    {
                        self.deleteAllMyTriples(function(err, result){
                            if(!err)
                            {
                                self.unlinkFromParent(function(err, result){
                                    if(!err)
                                    {
                                        callback(null, self);
                                    }
                                    else
                                    {
                                        callback(err, "Error unlinking folder " + self.uri + " from its parent. Error reported : " + result);
                                    }
                                });
                            }
                            else
                            {
                                callback(err, "Error clearing descriptors for deleting folder " + self.uri + ". Error reported : " + result);
                            }
                        });
                    }
                    else
                    {
                        callback(err, "Error deleting children of folder " + self.uri + " during recursive delete. Error reported : " + result);
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
                    callback(err, self);
                },

                uriOfUserDeletingTheFolder
            );
        }
    }
}

Folder.prototype.undelete = function(callback, uriOfUserUnDeletingTheFolder, notRecursive)
{
    var self = this;

    if(notRecursive)
    {
        self.updateDescriptorsInMemory(
            [
                new Descriptor({
                    prefixedForm : "ddr:deleted",
                    value : null
                })
            ]
        );

        self.save(function(err, result){
            callback(err, result);
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
                callback(err, result);
            },
            uriOfUserUnDeletingTheFolder
        );
    }
};

Folder.deleteOnLocalFileSystem = function(absPath, callback)
{
    var exec = require('child_process').exec;
    var command = "rm -rf absPath";
    var rm = exec(command, {}, function (error, stdout, stderr)
    {
        callback(error, stdout, stderr);
    });
}

Folder.rdfType = "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#Folder";
Folder.prefixedRDFType = "nfo:Folder";
Folder = Class.extend(Folder, InformationElement);

module.exports.Folder = Folder;