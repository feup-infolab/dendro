// follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;
const File = rlequire("dendro", "src/models/directory_structure/file.js").File;
const User = rlequire("dendro", "src/models/user.js").User;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const ArchivedResource = rlequire("dendro", "src/models/versions/archived_resource").ArchivedResource;
const Storage = rlequire("dendro", "src/kb/storage/storage.js").Storage;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const dbMySQL = rlequire("dendro", "src/mysql_models");

const async = require("async");
const _ = require("underscore");

function Project (object)
{
    const self = this;
    self.addURIAndRDFType(object, "project", Project);
    Project.baseConstructor.call(this, object);

    if (!isNull(object.ddr))
    {
        if (object.ddr.hasStorageLimit)
        {
            self.ddr.hasStorageLimit = Config.maxProjectSize;
        }

        if (isNull(object.ddr.requiresVerifiedUploads))
        {
            self.ddr.requiresVerifiedUploads = false;
        }
    }

    return self;
}

Project.prototype.backup = function (callback)
{
    const self = this;
    self.ddr.beingBackedUp = true;

    if (typeof isNull(self.ddr.rootFolder) && !isNull(self.nie.hasLogicalPart))
    {
        self.ddr.rootFolder = self.nie.hasLogicalPart;
    }

    self.save(function (err, result)
    {
        if (isNull(err) && result instanceof Project)
        {
            if (!isNull(self.ddr.rootFolder))
            {
                Logger.log("Started backup of project " + self.uri);
                Folder.findByUri(self.ddr.rootFolder, function (err, folder)
                {
                    if (isNull(err) && folder instanceof Folder)
                    {
                        const bagItOptions = {
                            cryptoMethod: "sha256",
                            sourceOrganization: (self.dcterms.publisher) ? self.dcterms.publisher : "No publisher specified",
                            organizationAddress: (self.schema.address) ? self.schema.address : "No contact physical address specified",
                            contactName: (self.schema.provider) ? self.schema.provider : "No contact name specified",
                            contactPhone: (self.schema.telephone) ? self.schema.telephone : "No contact phone specified",
                            contactEmail: (self.schema.email) ? self.schema.email : "No contact email specified",
                            externalDescription: (self.dcterms.description) ? self.dcterms.description : "No project description specified"
                        };

                        folder.bagit(
                            bagItOptions,
                            function (err, result, absolutePathOfFinishedFolder, parentFolderPath)
                            {
                                if (isNull(err))
                                {
                                    const path = require("path");

                                    const finishedZipFileName = "bagit_backup.zip";
                                    const finishedZipFileAbsPath = path.join(parentFolderPath, finishedZipFileName);

                                    Folder.zip(absolutePathOfFinishedFolder, finishedZipFileAbsPath, function (err, zipFileFullPath)
                                    {
                                        return callback(err, zipFileFullPath, parentFolderPath);
                                    }, finishedZipFileName, true);
                                }
                                else
                                {
                                    return callback(1, "Unable to zip folder at " + finalBagItOptions.bagName + " \n " + finalBagItOptions);
                                }
                            }
                        );
                    }
                    else
                    {
                        return callback(1, "Folder with " + self.ddr.rootFolder + " does not exist: " + folder);
                    }
                });
            }
            else
            {
                return callback(1, "Project : " + self.uri + " has no root folder.");
            }
        }
    });
};

Project.addProjectInformations = function (arrayOfProjectsUris, callback)
{
    if (arrayOfProjectsUris instanceof Array)
    {
        const getProjectInformation = function (project, callback)
        {
            Project.findByUri(project.uri, callback);
        };

        // get all the information about all the projects
        // and return the array of projects, complete with that info
        async.mapSeries(arrayOfProjectsUris, getProjectInformation, function (err, projectsToReturn)
        {
            if (isNull(err))
            {
                return callback(null, projectsToReturn);
            }
            return callback("error fetching project information : " + err, projectsToReturn);
        });
    }
    else
    {
    // projects var will contain an error message instead of an array of results.
        return callback(1);
    }
};

Project.allNonPrivate = function (currentUser, callback)
{
    // TODO @silvae86 exception for the projects where the current user is either creator or contributor.
    const query =
        "SELECT * " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Project " +
        " FILTER NOT EXISTS {" +
        "    ?uri ddr:privacyStatus [1] " +
        "   } " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.ddr.privacyStatus.type,
                value: "private"
            }
        ],

        function (err, projects)
        {
            if (isNull(err) && !isNull(projects) && projects instanceof Array)
            {
                Project.addProjectInformations(projects, callback);
            }
            else
            {
                // projects var will contain an error message instead of an array of results.
                return callback(1, projects);
            }
        });
};

Project.allNonPrivateUnlessTheyBelongToMe = function (currentUser, callback)
{
    // TODO @silvae86 exception for the projects where the current user is either creator or contributor.
    const query =
        "SELECT DISTINCT(?uri) \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "    {  \n" +
        "        ?uri rdf:type ddr:Project \n" +
        "        FILTER NOT EXISTS { \n" +
        "           ?uri ddr:privacyStatus [1] \n" +
        "        }\n" +
        "    }\n" +
        "    UNION \n" +
        "    {\n" +
        "        ?uri rdf:type ddr:Project .\n" +
        "        ?uri dcterms:creator  [2]\n" +
        "    }\n" +
        "    UNION\n" +
        "    {\n" +
        "        ?uri rdf:type ddr:Project .\n" +
        "        ?uri dcterms:contributor  [3]\n" +
        "    }\n" +
        "}\n";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.ddr.privacyStatus.type,
                value: "private"
            },
            {
                type: Elements.ontologies.dcterms.creator.type,
                value: currentUser.uri
            },
            {
                type: Elements.ontologies.dcterms.contributor.type,
                value: currentUser.uri
            }
        ],

        function (err, projects)
        {
            if (isNull(err) && !isNull(projects) && projects instanceof Array)
            {
                Project.addProjectInformations(projects, callback);
            }
            else
            {
                // projects var will contain an error message instead of an array of results.
                return callback(1, projects);
            }
        });
};

Project.all = function (callback, req)
{
    const self = this;
    Project.baseConstructor.all.call(self, function (err, projects)
    {
    // projects var will contain an error message instead of an array of results.
        return callback(err, projects);
    }, req);
};

Project.findByHandle = function (handle, callback)
{
    const query =
        "SELECT ?uri \n" +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Project. " +
        " ?uri ddr:handle [1] " +
        "} ";

    db.connection.execute(query,
        [

            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.ddr.handle.type,
                value: handle
            }
        ],

        function (err, project)
        {
            if (isNull(err))
            {
                if (project instanceof Array && project.length > 0)
                {
                    if (project.length > 1)
                    {
                        Logger.log("Duplicate projects found!! Project handle : " + handle);
                    }
                    else
                    {
                        const projectUri = project[0].uri;
                        Project.findByUri(projectUri, function (err, project)
                        {
                            return callback(err, project);
                        });
                    }
                }
                else
                {
                    // project does not exist, return null
                    return callback(null, null);
                }
            }
            else
            {
                // project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, project);
            }
        });
};

Project.prototype.getCreatorsAndContributors = function (callback)
{
    const self = this;

    const query =
        "SELECT * \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   { \n" +
        "       [1] dcterms:contributor ?uri .\n" +
        "       OPTIONAL { ?uri ddr:username ?username . }\n" +
        "       OPTIONAL { ?uri foaf:mbox ?email . }\n" +
        "       OPTIONAL { ?uri foaf:firstName ?firstname . }\n" +
        "       OPTIONAL { ?uri foaf:surname ?surname . }\n" +
        "   } \n" +
        "   UNION " +
        "   { " +
        "       [1] dcterms:creator ?uri .\n" +
        "       OPTIONAL { ?uri ddr:username ?username . }\n" +
        "       OPTIONAL { ?uri foaf:mbox ?email . }\n" +
        "       OPTIONAL { ?uri foaf:firstName ?firstname . }\n" +
        "       OPTIONAL { ?uri foaf:surname ?surname . }\n" +
        "   } \n" +
        "} \n";

    db.connection.execute(query,
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
        function (err, contributors)
        {
            if (isNull(err))
            {
                if (contributors instanceof Array)
                {
                    const contributorsToReturn = [];
                    for (let i = 0; i < contributors.length; i++)
                    {
                        const contributor = contributors[i];
                        const aContributor = new User(contributor);
                        contributorsToReturn.push(aContributor);
                    }

                    return callback(null, contributorsToReturn);
                }
                // project does not exist, return null
                return callback(null, null);
            }
            // project var will contain an error message instead of a single-element
            // array containing project data.
            return callback(err, [contributors]);
        });
};

Project.findByContributor = function (contributor, callback)
{
    const query =
        "SELECT * " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri ddr:handle ?handle . " +
        " ?uri dcterms:contributor [1] ." +
        " ?uri dcterms:title ?title ." +
        " ?uri dcterms:description ?description . " +
        " ?uri dcterms:subject ?subject . " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.dcterms.contributor.type,
                value: contributor
            }
        ],
        function (err, projects)
        {
            if (isNull(err))
            {
                if (projects instanceof Array)
                {
                    const projectsToReturn = [];
                    for (let i = 0; i < projects.length; i++)
                    {
                        const aProject = new Project(projects[i]);
                        projectsToReturn.push(aProject);
                    }

                    return callback(null, projectsToReturn);
                }
                // project does not exist, return null
                return callback(null, null);
            }
            // project var will contain an error message instead of a single-element
            // array containing project data.
            return callback(err, [projects]);
        });
};

Project.findByCreator = function (creator, callback)
{
    const query =
        "SELECT * " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Project . " +
        " ?uri ddr:handle ?handle . " +
        " ?uri dcterms:creator [1] ." +
        " ?uri dcterms:title ?title ." +
        " ?uri dcterms:description ?description . " +
        " ?uri dcterms:subject ?subject . " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.dcterms.creator.type,
                value: creator
            }
        ],
        function (err, projects)
        {
            if (isNull(err))
            {
                if (projects instanceof Array)
                {
                    const projectsToReturn = [];
                    for (let i = 0; i < projects.length; i++)
                    {
                        const aProject = new Project(projects[i]);

                        aProject.creator = creator;
                        projectsToReturn.push(aProject);
                    }

                    return callback(null, projectsToReturn);
                }
                // project does not exist, return null
                return callback(null, null);
            }
            // project var will contain an error message instead of a single-element
            // array containing project data.
            return callback(err, [projects]);
        });
};

Project.findByCreatorOrContributor = function (creatorOrContributor, callback)
{
    const query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "{ \n" +
        " ?uri rdf:type ddr:Project . " +
        " ?uri dcterms:creator [1] \n" +
        "} \n" +
        " UNION \n" +
        "{ \n" +
        " ?uri rdf:type ddr:Project . " +
        " ?uri dcterms:contributor [1] \n" +
        "} \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.dcterms.contributor.type,
                value: creatorOrContributor
            }
        ],
        function (err, rows)
        {
            if (isNull(err))
            {
                if (rows instanceof Array)
                {
                    const getProjectProperties = function (resultRow, cb)
                    {
                        Project.findByUri(resultRow.uri, function (err, project)
                        {
                            cb(err, project);
                        });
                    };

                    async.mapSeries(rows, getProjectProperties, function (err, projects)
                    {
                        return callback(err, projects);
                    });
                }
                else
                {
                    // project does not exist, return null
                    return callback(null, null);
                }
            }
            else
            {
                // project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, [rows]);
            }
        });
};

Project.createAndInsertFromObject = function (object, callback)
{
    const newProject = new Project(object);
    newProject.save(function (err, newProject)
    {
        if (isNull(err))
        {
            if (newProject instanceof Project)
            {
                const rootFolder = new Folder({
                    nie: {
                        title: object.ddr.handle,
                        isLogicalPartOf: newProject.uri
                    },
                    ddr: {
                        humanReadableURI: newProject.ddr.humanReadableURI + "/data"
                    }
                });

                rootFolder.save(function (err, result)
                {
                    if (isNull(err))
                    {
                        newProject.ddr.rootFolder = rootFolder.uri;
                        newProject.nie.hasLogicalPart = rootFolder.uri;

                        newProject.save(function (err, result)
                        {
                            if (isNull(err))
                            {
                                newProject.reindex(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(err, newProject);
                                    }

                                    const msg = "Error reindexing resource " + newProject.uri + " : " + result;
                                    Logger.log("error", msg);
                                    return callback(1, msg);
                                });
                            }
                            else
                            {
                                Logger.log("error", "There was an error re-saving the project " + newProject.ddr.humanReadableURI + " while creating it: " + JSON.stringify(result));
                                callback(err, result);
                            }
                        });
                    }
                    else
                    {
                        Logger.log("error", "There was an error saving the root folder of project " + newProject.ddr.humanReadableURI + ": " + JSON.stringify(result));
                        return callback(err, result);
                    }
                });
            }
            else
            {
                return callback(1, "Statement executed but result was not what was expected. " + newProject);
            }
        }
        else
        {
            return callback(err, newProject);
        }
    });
};

Project.prototype.isUserACreatorOrContributor = function (userUri, callback)
{
    const self = this;
    const query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        " { \n" +
        "       [1] rdf:type ddr:Project . \n" +
        "       ?uri dcterms:creator [2] \n" +
        "   } \n" +
        "   UNION \n" +
        "   { \n" +
        "       [1] rdf:type ddr:Project . \n" +
        "       ?uri dcterms:contributor [3] \n" +
        "   } \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
                value: self.uri
            },
            {
                type: Elements.ontologies.dcterms.creator.type,
                value: userUri
            },
            {
                type: Elements.ontologies.dcterms.contributor.type,
                value: userUri
            }
        ],
        function (err, properties)
        {
            if (!isNull(err))
            {
                const errorMsg = "[Error] When checking if a user is a contributor or creator of a project: " + JSON.stringify(properties);
                Logger.log("error", errorMsg);
            }

            if (properties.length > 0)
            {
                callback(err, true);
            }
            else
            {
                callback(err, false);
            }
        });
};

Project.prototype.getRootFolder = function (callback)
{
    const self = this;
    const folderUri = self.ddr.rootFolder;

    Folder.findByUri(folderUri, callback);
};

Project.prototype.getFirstLevelDirectoryContents = function (callback)
{
    const self = this;

    self.getRootFolder(function (err, folder)
    {
        if (isNull(err))
        {
            if (!isNull(folder) && folder instanceof Folder)
            {
                folder.getLogicalParts(function (err, children)
                {
                    if (isNull(err))
                    {
                        return callback(null, children);
                    }
                    return callback(1, "Error fetching children of project root folder");
                });
            }
            else
            {
                return callback(1, "unable to retrieve project " + self.ddr.handle + " 's root folder. Error :" + err);
            }
        }
        else
        {
            return callback(1, "unable to retrieve project " + self.ddr.handle + " 's root folder's contents. Error :" + err);
        }
    });
};

Project.prototype.getProjectWideFolderFileCreationEvents = function (callback)
{
    const self = this;
    Logger.log("In getProjectWideFolderFileCreationEvents");
    Logger.log("the projectUri is:");
    const projectData = self.uri + "/data";

    // TODO test query first

    const query =
        "SELECT ?dataUri \n" +
        "WHERE " +
        "{ \n" +
        "   GRAPH [0] \n" +
        "   { \n" +
        "       ?dataUri ddr:modified ?date. \n" +
        "       [1] nie:hasLogicalPart ?dataUri. \n" +
        "   } \n" +
        "} \n" +
        "ORDER BY DESC(?date) \n";

    // query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resourceNoEscape,
                value: projectData
            }
        ]),
        function (err, itemsUri)
        {
            if (isNull(err))
            {
                Logger.log("itemsUri: ", itemsUri);

                async.mapSeries(itemsUri, function (itemUri)
                {
                    Resource.findByUri(itemUri.dataUri, function (error, item)
                    {
                        if (isNull(error))
                        {
                            Logger.log(item);
                        }
                        else
                        {
                            Logger.log("error", error);
                            Logger.log("error", item);
                        }

                        // item.get
                        // TODO get author
                    });
                }, function (err, fullItems)
                {
                    if (isNull(err))
                    {
                        return callback(null, fullItems);
                    }
                    const msg = "Error fetching file/folders creation info for project:" + self.uri;
                    return callback(true, msg);
                });

                /*
                var getVersionDetails = function(result, callback){
                    ArchivedResource.findByUri(result.version, function(err, result){
                        if(isNull(err))
                        {
                            result.getDetailedInformation(function(err, versionWithDetailedInfo)
                            {
                                return callback(err, versionWithDetailedInfo);
                            });
                        }
                        else
                        {
                            return callback(err, result);
                        }
                    });
                };

                async.mapSeries(results, getVersionDetails, function(err, fullVersions){
                    return callback(err, fullVersions);
                }) */
            }
            else
            {
                const msg = "Error fetching file/folder change data";
                Logger.log(msg);
                return callback(1, msg);
            }
        });
};

Project.prototype.getRecentProjectWideChangesSocial = function (callback, startingResultPosition, maxResults, createdAfterDate)
{
    const self = this;
    Logger.log("createdAfterDate:", createdAfterDate);
    Logger.log("startingResultPosition: ", startingResultPosition);
    Logger.log("maxResults: ", maxResults);

    let query =
        "SELECT ?version \n" +
        "WHERE " +
        "{ \n" +
        "   GRAPH [0] \n" +
        "   { \n" +
        "       ?version ddr:created ?date. \n" +
        "       filter ( \n" +
        "       xsd:dateTime(?date) >= [2]" + "^^xsd:dateTime" + " ). \n" +
        "       ?version rdf:type ddr:ArchivedResource . \n" +
        "       filter ( \n" +
        "           STRSTARTS(STR(?version), [1]) \n" +
        "       ) \n" +
        "   } \n" +
        "} \n" +
        "ORDER BY DESC(?date) \n";

    query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.stringNoEscape,
                value: self.uri
            },
            {
                type: Elements.types.date,
                value: createdAfterDate
            }
        ], startingResultPosition, maxResults),
        function (err, results)
        {
            if (isNull(err))
            {
                const getVersionDetails = function (result, callback)
                {
                    ArchivedResource.findByUri(result.version, function (err, result)
                    {
                        if (isNull(err))
                        {
                            result.getDetailedInformation(function (err, versionWithDetailedInfo)
                            {
                                return callback(err, versionWithDetailedInfo);
                            });
                        }
                        else
                        {
                            return callback(err, result);
                        }
                    });
                };

                async.mapSeries(results, getVersionDetails, function (err, fullVersions)
                {
                    return callback(err, fullVersions);
                });
            }
            else
            {
                return callback(1, "Error fetching children of project root folder");
            }
        });
};

Project.prototype.getRecentProjectWideChanges = function (callback, startingResultPosition, maxResults)
{
    const self = this;

    let query =
        "SELECT ?version\n" +
        "WHERE " +
        "{\n" +
        "   GRAPH [0] \n" +
        "   {\n" +
        "       ?version ddr:created ?date.\n" +
        "       ?version rdf:type ddr:ArchivedResource .\n" +
        "       ?version ddr:isVersionOf ?resource.\n" +
        "       ?resource nie:isLogicalPartOf+ ?parent.\n" +
        "       [1] ddr:rootFolder ?parent.\n" +
        "   }\n" +
        "}\n" +
        "ORDER BY DESC(?date)\n";

    query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resourceNoEscape,
                value: self.uri
            }
        ],
        function (err, results)
        {
            if (isNull(err))
            {
                const getVersionDetails = function (result, callback)
                {
                    ArchivedResource.findByUri(result.version, function (err, result)
                    {
                        if (isNull(err))
                        {
                            result.getDetailedInformation(function (err, versionWithDetailedInfo)
                            {
                                return callback(err, versionWithDetailedInfo);
                            });
                        }
                        else
                        {
                            return callback(err, result);
                        }
                    });
                };

                async.mapSeries(results, getVersionDetails, function (err, fullVersions)
                {
                    return callback(err, fullVersions);
                });
            }
            else
            {
                return callback(1, "Error fetching children of project root folder");
            }
        });
};

Project.prototype.getStorageSize = function (callback, customBucket)
{
    const self = this;

    let collectionName;
    if (!isNull(customBucket))
    {
        collectionName = customBucket;
    }
    else
    {
        collectionName = "fs.files";
    }

    /**
     * YOU NEED MONGODB 10GEN to run this, or it will give errors.
     */
    gfs.connection.db.collection(collectionName, function (err, collection)
    {
        if (isNull(err))
        {
            collection.aggregate([
                {
                    $match: {"metadata.project.uri": self.uri}
                },
                {
                    $group:
                    {
                        _id: null,
                        sum: {
                            $sum: "$length"
                        }
                    }
                }
            ], function (err, result)
            {
                if (isNull(err))
                {
                    if (!isNull(result) && result instanceof Array && result.length === 1 && !isNull(result[0].sum))
                    {
                        return callback(null, result[0].sum);
                    }
                    return callback(null, 0);
                }
                Logger.log("error", "* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : " + JSON.stringify(err) + JSON.stringify(result));
                return callback(1, "Error retrieving project size : " + JSON.stringify(err) + JSON.stringify(result));
            });
        }
        else
        {
            Logger.log("error", "* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : " + JSON.stringify(err) + JSON.stringify(collection));
            return callback(1, "Error retrieving files collection : " + collection);
        }
    });
};

Project.prototype.getFilesCount = function (callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?file) as ?file_count \n" +
        "FROM [0] \n" +
        "WHERE " +
        "{ \n" +
        "   { \n" +
        "       ?file rdf:type nfo:FileDataObject . \n" +
        "       ?file nie:isLogicalPartOf+ [1] . \n" +
    "           FILTER EXISTS { \n" +
        "           [1] rdf:type ddr:Project \n" +
        "       }\n" +
        "       FILTER NOT EXISTS { \n" +
        "           ?file ddr:isVersionOf ?some_resource .\n" +
        "       } \n" +
        "   } \n" +
        "} \n";

    db.connection.execute(query,
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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].file_count);
                }
                return callback(1, "invalid result retrieved when querying for project file count");
            }
            return callback(err, -1);
        });
};

Project.prototype.getMembersCount = function (callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?contributor) as ?contributor_count \n" +
        "FROM [0] \n" +
        "WHERE " +
        "{ \n" +
        "{ \n" +
        "   [1] rdf:type ddr:Project . \n" +
        "   [1] dcterms:contributor ?contributor. \n" +
        "} \n" +
        " UNION \n" +
        "{ \n" +
        "   [1] rdf:type ddr:Project . \n" +
        "   [1] dcterms:creator ?contributor. \n" +
        "} \n" +
        "} \n";

    db.connection.execute(query,
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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].contributor_count);
                }
                return callback(1, "invalid result retrieved when querying for project contributor count");
            }
            return callback(err, -1);
        });
};

Project.prototype.getFoldersCount = function (callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?folder) as ?folder_count \n" +
        "FROM [0] \n" +
        "WHERE " +
        "{ \n" +
        "   { \n" +
        "       ?folder rdf:type nfo:Folder . \n" +
        "       ?folder nie:isLogicalPartOf+ [1] . \n" +
        "       FILTER EXISTS { \n" +
        "           [1] rdf:type ddr:Project \n" +
        "       }\n" +
        "       FILTER NOT EXISTS " +
        "       { \n" +
        "           ?folder ddr:isVersionOf ?some_resource .\n" +
        "       } \n" +
        "   } \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.nie.isLogicalPartOf.type,
                value: self.uri
            }
        ],
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].folder_count);
                }
                return callback(1, "invalid result retrieved when querying for project folder count");
            }
            return callback(err, -1);
        });
};

Project.prototype.getRevisionsCount = function (callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?revision) as ?revision_count \n" +
        "FROM [0] \n" +
        "WHERE " +
        "{ \n" +
        "   { \n" +
        "       ?revision ddr:isVersionOf ?resource . \n" +
        "       ?resource nie:isLogicalPartOf+ [1] . \n" +
    "           FILTER EXISTS { \n" +
        "           ?resource rdf:type ddr:Project \n" +
        "       }\n" +
        "   } \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.nie.isLogicalPartOf.type,
                value: self.uri
            }
        ],
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].revision_count);
                }
                return callback(1, "invalid result retrieved when querying for revisions count");
            }
            return callback(err, -1);
        });
};

Project.prototype.getFavoriteDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;
    const mysql = Config.getMySQLByID();
    const targetTable = Config.recommendation.getTargetTable();
    let projectFavoriteDescriptorsList = [];

    let queryProjectDescriptorFavorites = "call " + Config.mySQLDBName + ".getProjectFavoriteDescriptors(:uri);";

    dbMySQL.sequelize
        .query(queryProjectDescriptorFavorites,
            {replacements: { uri: self.uri }})
        .then(result =>
        {
            if (isNull(result))
            {
                return callback(null, []);
            }

            async.mapSeries(result, function (row, callback)
            {
                Descriptor.findByUri(row.executedOver, function (err, descriptor)
                {
                    if (isNull(err))
                    {
                        if (!isNull(descriptor))
                        {
                            if (descriptor.recommendation_types != null)
                            {
                                descriptor.recommendation_types.project_favorite = true;
                            }
                            else
                            {
                                descriptor.recommendation_types = {};
                                descriptor.recommendation_types.project_favorite = true;
                            }
                            projectFavoriteDescriptorsList.push(descriptor);
                            callback(null, null);
                        }
                        else
                        {
                            const errorMsg = "Descriptor with uri: " + row.executedOver + " does not exist!";
                            Logger.log("error", errorMsg);
                            callback(true, errorMsg);
                        }
                    }
                    else
                    {
                        Logger.log("error", JSON.stringify(descriptor));
                        callback(true, JSON.stringify(descriptor));
                    }
                });
            }, function (err, results)
            {
                if (isNull(err))
                {
                    return callback(err, projectFavoriteDescriptorsList);
                }

                return callback(err, results);
            });
        })
        .catch(err =>
            callback(1, "Error seeing if interaction with URI " + self.uri + " already existed in the MySQL database."));
};

Project.prototype.getHiddenDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;
    const mysql = Config.getMySQLByID();
    const targetTable = Config.recommendation.getTargetTable();
    let projectHiddenDescriptorsList = [];

    let queryProjectHiddenDescriptors = "call " + Config.mySQLDBName + ".getProjectHiddenDescriptors(:uri);";

    dbMySQL.sequelize
        .query(queryProjectHiddenDescriptors,
            {replacements: { uri: self.uri }})
        .then(result =>
        {
            if (isNull(result))
            {
                return callback(null, []);
            }

            async.mapSeries(result, function (row, callback)
            {
                Descriptor.findByUri(row.executedOver, function (err, descriptor)
                {
                    if (isNull(err))
                    {
                        if (!isNull(descriptor))
                        {
                            if (descriptor.recommendation_types != null)
                            {
                                descriptor.recommendation_types.project_hidden = true;
                            }
                            else
                            {
                                descriptor.recommendation_types = {};
                                descriptor.recommendation_types.project_hidden = true;
                            }
                            projectHiddenDescriptorsList.push(descriptor);
                            callback(null, null);
                        }
                        else
                        {
                            const errorMsg = "Descriptor with uri: " + row.executedOver + " does not exist!";
                            Logger.log("error", errorMsg);
                            callback(true, errorMsg);
                        }
                    }
                    else
                    {
                        Logger.log("error", JSON.stringify(descriptor));
                        callback(true, JSON.stringify(descriptor));
                    }
                });
            }, function (err, results)
            {
                if (isNull(err))
                {
                    return callback(err, projectHiddenDescriptorsList);
                }

                return callback(err, results);
            });
        })
        .catch(err =>
            callback(1, "Error seeing if interaction with URI " + self.uri + " already existed in the MySQL database."));
};

Project.prototype.findMetadata = function (callback, typeConfigsToRetain)
{
    const self = this;

    const descriptors = self.getPropertiesFromOntologies(
        null,
        typeConfigsToRetain);

    return callback(null,
        {
            descriptors: descriptors,
            title: self.dcterms.title
        }
    );
};

Project.prototype.findMetadataOfRootFolder = function (callback)
{
    const self = this;

    const rootFolder = new Folder({
        uri: self.ddr.rootFolder
    });

    rootFolder.findMetadata(callback);
};

Project.privacy = function (projectUri, callback)
{
    Project.findByUri(projectUri, function (err, project)
    {
        if (isNull(err))
        {
            if (isNull(project))
            {
                return callback(1, null);
            }
            const privacy = project.ddr.privacyStatus;

            if (!isNull(privacy) && privacy instanceof Array && privacy.length > 0)
            {
                return callback(null, privacy[0].p);
            }
            return callback(null, null);
        }
        return callback(1, "Error occurred fetching the privacy status of project " + projectUri + ". Error : " + project);
    });
};

Project.validateBagItFolderStructure = function (absPathOfBagItFolder, callback)
{
    const fs = require("fs");
    const path = require("path");

    fs.stat(absPathOfBagItFolder, function (err, stat)
    {
        if (isNull(err))
        {
            if (stat.isDirectory())
            {
                const dataFolder = path.join(absPathOfBagItFolder, "data");
                fs.stat(dataFolder, function (err, stat)
                {
                    if (isNull(err))
                    {
                        if (stat.isDirectory())
                        {
                            fs.readdir(dataFolder, function (err, folderContents)
                            {
                                if (isNull(err))
                                {
                                    if (!isNull(folderContents) && folderContents instanceof Array && folderContents.length === 1)
                                    {
                                        const childOfDataFolderAbsPath = path.join(dataFolder, folderContents[0]);

                                        fs.stat(childOfDataFolderAbsPath, function (err, stat)
                                        {
                                            if (isNull(err))
                                            {
                                                if (stat.isDirectory())
                                                {
                                                    fs.readdir(childOfDataFolderAbsPath, function (err, folderContents)
                                                    {
                                                        if (isNull(err))
                                                        {
                                                            if (!isNull(folderContents) && folderContents instanceof Array && folderContents.indexOf(Config.packageMetadataFileName) >= 0)
                                                            {
                                                                return callback(null, true, childOfDataFolderAbsPath);
                                                            }
                                                            return callback(null, false, "There is no " + Config.packageMetadataFileName + " inside the /data subdirectory.");
                                                        }
                                                        return callback(err, false, "child of /data contains only one element but is not a directory.");
                                                    });
                                                }
                                                else
                                                {
                                                    return callback(null, false, "child of /data contains only one element but is not a directory.");
                                                }
                                            }
                                            else
                                            {
                                                return callback(err, false, "/data contains only one element but is not a directory.");
                                            }
                                        });
                                    }
                                    else
                                    {
                                        return callback(null, false, "/data folder should contain exactly one directory.");
                                    }
                                }
                                else
                                {
                                    return callback(err, false, "/data exists but is not a directory.");
                                }
                            });
                        }
                        else
                        {
                            return callback(null, false, "/data exists but is not a directory.");
                        }
                    }
                    else if (err.code === "ENOENT")
                    {
                        return callback(null, false, "/data subfolder does not exist.");
                    }
                });
            }
            else
            {
                return callback(null, false, absPathOfBagItFolder + " is not a directory");
            }
        }
        else if (err.code === "ENOENT")
        {
            return callback(null, false);
        }
    });
};

Project.unzipAndValidateBagItBackupStructure = function (absPathToZipFile, maxStorageSize, req, callback)
{
    File.estimateUnzippedSize(absPathToZipFile, function (err, size)
    {
        if (isNull(err))
        {
            if (!isNaN(size))
            {
                // admin is god, can import as much data as (s)he wants
                if (size < maxStorageSize || req.user.isAdmin || req.session.isAdmin)
                {
                    File.unzip(absPathToZipFile, function (err, absPathOfRootFolder)
                    {
                        if (isNull(err))
                        {
                            Project.validateBagItFolderStructure(absPathOfRootFolder, function (err, valid, pathToFolderToRestore)
                            {
                                if (isNull(err))
                                {
                                    if (valid)
                                    {
                                        return callback(null, true, pathToFolderToRestore, absPathOfRootFolder);
                                    }
                                    return callback(500, "Invalid Bagit structure. Are you sure this is a Dendro project backup? Error reported: " + pathToFolderToRestore);
                                }
                                return callback(err, pathToFolderToRestore);
                            });
                        }
                        else
                        {
                            const msg = "Unable to unzip file " + absPathToZipFile + ". Error reported: " + absPathToZipFile;
                            return callback(err, msg);
                        }
                    });
                }
                else
                {
                    const filesize = require("file-size");
                    const difference = maxStorageSize - size;

                    const humanSizeDifference = filesize(difference).human("jedec");
                    const humanZipFileSize = filesize(size).human("jedec");
                    const humanMaxStorageSize = filesize(maxStorageSize).human("jedec");

                    const msg = "Estimated storage size of the project after unzipping ( " + humanZipFileSize + " ) exceeds the maximum storage allowed for a project ( " + humanMaxStorageSize + " ) by " + humanSizeDifference;
                    return callback(true, msg);
                }
            }
            else
            {
                return callback(1, "Unable to determine the size of the ZIP File, because the file was corrupted during transfer!");
            }
        }
        else
        {
            const msg = "Unable to estimate size of the zip file sent in as the project backup. Error reported: " + absPathToZipFile;
            return callback(err, msg);
        }
    });
};

Project.prototype.restoreFromFolder = function (
    absPathOfRootFolder,
    entityLoadingTheMetadata,
    attemptToRestoreMetadata,
    replaceExistingFolder,
    callback
)
{
    const self = this;
    const path = require("path");
    let entityLoadingTheMetadataUri;

    if (!isNull(entityLoadingTheMetadata) && entityLoadingTheMetadata instanceof User)
    {
        entityLoadingTheMetadataUri = entityLoadingTheMetadata.uri;
    }
    else
    {
        entityLoadingTheMetadataUri = User.anonymous.uri;
    }

    const metadataFileAbsPath = path.join(absPathOfRootFolder, Config.packageMetadataFileName);
    const metadata = require(metadataFileAbsPath);

    self.getRootFolder(function (err, rootFolder)
    {
        if (isNull(err))
        {
            rootFolder.loadContentsOfFolderIntoThis(absPathOfRootFolder, replaceExistingFolder, function (err, result)
            {
                if (isNull(err))
                {
                    /**
                     * Restore metadata values from metadata.json file
                     */
                    const metadataFileLocation = path.join(absPathOfRootFolder, Config.packageMetadataFileName);
                    const fs = require("fs");

                    fs.exists(metadataFileLocation, function (existsMetadataFile)
                    {
                        if (attemptToRestoreMetadata && existsMetadataFile)
                        {
                            fs.readFile(metadataFileLocation, "utf8", function (err, data)
                            {
                                if (err)
                                {
                                    Logger.log("Error: " + err);
                                    return;
                                }

                                const node = JSON.parse(data);

                                rootFolder.loadMetadata(node, function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(null, "Data and metadata restored successfully. Result : " + result);
                                    }
                                    return callback(err, "Error restoring metadata for project " + self.uri + " : " + result);
                                }, entityLoadingTheMetadataUri, [Elements.access_types.locked], [Elements.access_types.restorable]);
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
                    return callback(err, result);
                }
            }, true, entityLoadingTheMetadata);
        }
        else
        {
            callback(err, rootFolder);
        }
    });
};

Project.prototype.clearCacheRecords = function (callback, customGraphUri)
{
    const self = this;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;
    const pageSize = Config.limits.db.maxResults;
    let currentPage = 0;
    let currentResults = [];

    const findMoreMembersOfProject = function (callback)
    {
        let findQuery =
            "SELECT ?part \n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   [1] nie:hasLogicalPart* ?part \n" +
            "} \n";

        findQuery = DbConnection.addLimitsClauses(findQuery, pageSize * currentPage, pageSize);

        db.connection.execute(findQuery,
            [
                {
                    type: Elements.types.resourceNoEscape,
                    value: graphUri
                },
                {
                    type: Elements.types.resourceNoEscape,
                    value: self.uri
                }

            ],
            function (err, results)
            {
                callback(err, results);
            }
        );
    };

    async.doUntil(
        function (callback)
        {
            findMoreMembersOfProject(function (err, members)
            {
                if (!isNull(err))
                {
                    callback(err, members);
                }
                else
                {
                    currentResults = members;
                    Cache.getByGraphUri(graphUri).delete(members, function (err, result)
                    {
                        callback(err, result);
                    });
                }
            });
        },
        function ()
        {
            currentPage++;
            return currentResults.length === 0;
        },
        callback
    );
};

Project.prototype.getActiveStorageConfig = function (callback, customGraphUri)
{
    const self = this;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;
    const StorageConfig = rlequire("dendro", "src/models/storage/storageConfig.js").StorageConfig;

    StorageConfig.findByUri(self.ddr.hasStorageConfig, function (err, config)
    {
        if (!isNull(err))
        {
            config.deleteAllMyTriples(function (err, result)
            {
                callback(err, result);
            }, graphUri);
        }
        else
        {
            callback(err, config);
        }
    });
};

Project.prototype.getActiveStorageConnection = function (callback)
{
    const self = this;
    const StorageB2drop = rlequire("dendro", "src/kb/storage/storageB2Drop.js").StorageB2drop;
    const StorageGridFs = rlequire("dendro", "src/kb/storage/storageGridFs.js").StorageGridFs;
    self.getActiveStorageConfig(function (err, config)
    {
        if (isNull(err))
        {
            if (config.ddr.hasStorageType === "local")
            {
                const newStorageLocal = new StorageGridFs(
                    Config.defaultStorageConfig.username,
                    Config.defaultStorageConfig.password,
                    Config.defaultStorageConfig.host,
                    Config.defaultStorageConfig.port,
                    Config.defaultStorageConfig.collectionName
                );

                return callback(null, newStorageLocal);
            }
            else if (config.ddr.hasStorageType === "b2drop")
            {
                const newStorageB2drop = new StorageB2drop(config.ddr.username, config.ddr.password);
                return callback(null, newStorageB2drop);
            }

            return callback(true, "Unknown storage type");
        }

        return callback(true, "project " + self.uri + " has no storageConfig");
    });
};

Project.prototype.deleteActiveStorageConfig = function (callback, customGraphUri)
{
    const self = this;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    self.getActiveStorageConfig(function (err, config)
    {
        if (!isNull(err))
        {
            config.deleteAllMyTriples(function (err, result)
            {
                callback(err, result);
            }, graphUri);
        }
        else
        {
            callback(err, config);
        }
    });
};

Project.prototype.deleteAllStorageConfigs = function (callback, customGraphUri)
{
    const self = this;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;
    const StorageConfig = rlequire("dendro", "src/models/storage/storageConfig.js").StorageConfig;

    StorageConfig.findByProject(self.uri, function (err, configs)
    {
        if (isNull(err))
        {
            async.mapSeries(configs, function (config, callback)
            {
                config.deleteAllMyTriples(function (err, result)
                {
                    callback(err, result);
                }, graphUri);
            }, function (err, result)
            {
                callback(err);
            });
        }
        else
        {
            callback(err, configs);
        }
    });
};

Project.prototype.delete = function (callback, customGraphUri)
{
    const self = this;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    const deleteProjectTriples = function (callback)
    {
        const deleteQuery =
            "DELETE FROM [0]\n" +
            "{\n" +
            "    ?resource ?p ?o \n" +
            "} \n" +
            "WHERE \n" +
            "{ \n" +
            "    ?resource ?p ?o .\n" +
            "    [1] nie:hasLogicalPart* ?resource\n" +
            "} \n";

        db.connection.execute(deleteQuery,
            [
                {
                    type: Elements.types.resourceNoEscape,
                    value: graphUri
                },
                {
                    type: Elements.types.resourceNoEscape,
                    value: self.uri
                }
            ],
            function (err, result)
            {
                callback(err, result);
            },
            {
                runAsUpdate: true
            }
        );
    };

    const deleteAllStorageConfigs = function (callback)
    {
        self.deleteAllStorageConfigs(callback);
    };

    const deleteProjectFiles = function (callback)
    {
        self.getActiveStorageConnection(function (err, storageConnection)
        {
            if (isNull(err))
            {
                if (!isNull(storageConnection) && storageConnection instanceof Storage)
                {
                    storageConnection.deleteAllInProject(self, function (err, result)
                    {
                        callback(err, result);
                    });
                }
                else
                {
                    callback(1, "Unable to delete files in project " + self.ddr.handle + " because it has an invalid or non-existant connection to the data access adapter.");
                }
            }
            else
            {
                callback(err, storageConnection);
            }
        });
    };

    const clearCacheRecords = function (callback)
    {
        self.clearCacheRecords(function (err, result)
        {
            callback(err, result);
        });
    };

    async.series([
        clearCacheRecords,
        deleteProjectFiles,
        deleteAllStorageConfigs,
        deleteProjectTriples
    ], function (err, results)
    {
        callback(err, results);
    });
};

Project.prototype.reindex = function (callback, customGraphUri)
{
    const self = this;
    let failed;

    self.getRootFolder(function (err, rootFolder)
    {
        if (isNull(err))
        {
            async.series([
                function (callback)
                {
                    // reindex the entire directory structure
                    rootFolder.forAllChildren(
                        function (err, resources)
                        {
                            if (isNull(err))
                            {
                                if (resources.length > 0)
                                {
                                    async.mapSeries(resources, function (resource, callback)
                                    {
                                        if (!isNull(resource))
                                        {
                                            if (self.ddr.privacyStatus === "public" || self.ddr.privacyStatus === "metadata_only")
                                            {
                                                Logger.log("silly", "Folder or File " + resource.uri + " now being REindexed.");
                                                resource.reindex(function (err, resource)
                                                {
                                                    if (err)
                                                    {
                                                        Logger.log("error", "Error reindexing File or Folder " + resource.uri + " : " + JSON.stringify(err, null, 4) + "\n" + JSON.stringify(resource, null, 4));
                                                        failed = true;
                                                    }

                                                    callback(failed, resource);
                                                }, customGraphUri);
                                            }
                                            else
                                            {
                                                Logger.log("silly", "Folder or File " + resource.uri + " now being UNindexed.");
                                                resource.unindex(function (err, results)
                                                {
                                                    if (err)
                                                    {
                                                        Logger.log("error", "Error unindexing File or folder " + resource.uri + " : " + results);
                                                        failed = true;
                                                    }

                                                    callback(failed, results);
                                                }, customGraphUri);
                                            }
                                        }
                                        else
                                        {
                                            callback(false, resource);
                                        }
                                    }, function (err, results)
                                    {
                                        if (err)
                                        {
                                            Logger.log("error", "Errors occurred indexing all children of " + self.uri + " for reindexing : " + resources);
                                            failed = true;
                                        }

                                        return callback(failed, null);
                                    });
                                }
                                else
                                {
                                    return callback(failed, null);
                                }
                            }
                            else
                            {
                                failed = true;
                                return callback(failed, "Error fetching children of " + self.uri + " for reindexing : " + resources);
                            }
                        },
                        function ()
                        {
                            return failed;
                        },
                        function (err)
                        {
                            return callback(err, null);
                        },
                        true,
                        customGraphUri
                    );
                },
                function (callback)
                {
                    if (self.ddr.privacyStatus === "public" || self.ddr.privacyStatus === "metadata_only")
                    {
                        // reindex the Project object itself.
                        Project.baseConstructor.prototype.reindex.call(self, function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        // unindex the Project object itself.
                        Project.baseConstructor.prototype.unindex.call(self, function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                }
            ], function (err, result)
            {
                callback(err, self);
            });
        }
        else
        {
            Logger.log("error", "Unable to fetch root folder of project " + self.uri + " while reindexing it.");
            callback(err, rootFolder);
        }
    });
};

Project.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.handle))
    {
        callback(1, "Unable to get human readable uri for " + self.uri + " because it has no ddr.handle property.");
    }
    else
    {
        callback(null, "/project/" + self.ddr.handle);
    }
};

Project.prototype.save = function (callback)
{
    const self = this;

    if (isNull(self.dcterms.creator) || self.dcterms.creator instanceof Array && self.dcterms.creator.length === 0)
    {
        callback(1, "Cannot save project " + self.uri + " because it does not have a dcterms.creator property!");
    }
    else if (isNull(self.ddr.handle) || self.dcterms.creator instanceof Array && self.dcterms.creator.length === 0)
    {
        callback(1, "Cannot save project " + self.uri + " because it does not have a ddr.handle property!");
    }
    else
    {
        self.baseConstructor.prototype.save.call(self, function (err, result)
        {
            callback(err, result);
        });
    }
};

Project = Class.extend(Project, Resource, "ddr:Project");

module.exports.Project = Project;
