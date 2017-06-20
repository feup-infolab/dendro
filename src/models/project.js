//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Utils = require(Config.absPathInPublicFolder("/js/utils.js")).Utils;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
const Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource")).ArchivedResource;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

const util = require('util');
const async = require('async');
const _ = require('underscore');

function Project(object)
{
    Project.baseConstructor.call(this, object);
    const self = this;

    if(
        !isNull(self.ddr) &&
        !isNull(self.ddr.username)
    )
    {
        self.ddr.humanReadableURI = db.baseURI+"/user/"+self.ddr.username;
    }

    if(isNull(self.uri))
    {
        if(isNull(object.uri))
        {
            const uuid = require('uuid');
            self.uri = "/r/user/" + uuid.v4();
        }
        else
        {
            self.uri = object.uri;
        }
    }

    if(isNull(self.uri))
    {
        self.uri = Config.baseUri + "/project/" + self.ddr.handle;
    }

    self.rdf.type = "ddr:Project";

    return self;
}

Project.prototype.rootFolder = function()
{
    const self = this;
    return db.baseURI + "/project/" + self.ddr.handle + "/data";
};

Project.prototype.delete = function(callback)
{
    const self = this;
    self.ddr.deleted = true;
    this.save(callback);
};

Project.prototype.undelete = function(callback)
{
    const self = this;
    delete self.ddr.deleted;
    this.save(callback);
};

Project.prototype.backup = function(callback)
{
    const self = this;
    self.ddr.beingBackedUp = true;

    if(typeof isNull(self.ddr.rootFolder) && !isNull(self.nie.hasLogicalPart))
    {
        self.ddr.rootFolder = self.nie.hasLogicalPart;
    }

    self.save(function(err, result){
        if(!err && result instanceof Project)
        {
            if(!isNull(self.ddr.rootFolder))
            {
                console.log("Started backup of project " + self.uri);
                Folder.findByUri(self.ddr.rootFolder, function(err, folder){
                    if(!err && folder instanceof Folder)
                    {
                        //TODO Add this information
                        const bagItOptions = {
                            cryptoMethod: 'sha256',
                            sourceOrganization: self.dcterms.publisher,
                            organizationAddress: '123 Street',
                            contactName: 'Contact Name',
                            contactPhone: '555-555-5555',
                            contactEmail: 'test@example.org',
                            externalDescription: 'An example description'
                        };

                        folder.bagit(
                            bagItOptions,
                            function(err, result, absolutePathOfFinishedFolder, parentFolderPath){
                                if(!err)
                                {
                                    const path = require('path');

                                    const finishedZipFileName = "bagit_backup.zip";
                                    const finishedZipFileAbsPath = path.join(parentFolderPath, finishedZipFileName);
                                    Folder.zip(absolutePathOfFinishedFolder, finishedZipFileAbsPath, function(err, zipFileFullPath){
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

Project.addProjectInformations = function(arrayOfProjectsUris, callback)
{
    if(arrayOfProjectsUris instanceof Array)
    {
        const getProjectInformation = function (project, callback) {
            Project.findByUri(project.uri, callback);
        };

        //get all the information about all the projects
        // and return the array of projects, complete with that info
        async.map(arrayOfProjectsUris, getProjectInformation, function(err, projectsToReturn)
        {
            if(!err)
            {
                return callback(null, projectsToReturn);
            }
            else
            {
                return callback("error fetching project information : " + err, projectsToReturn);
            }
        });
    }
    else
    {
        //projects var will contain an error message instead of an array of results.
        return callback(1);
    }
};

Project.allNonPrivate = function(currentUser, callback) {

    //TODO @silvae86 exception for the projects where the current user is either creator or contributor.
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
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.string,
                value: "private"
            }
        ],

        function(err, projects) {

            if(!err && !isNull(projects) && projects instanceof Array)
            {
                Project.addProjectInformations(projects, callback);
            }
            else
            {
                //projects var will contain an error message instead of an array of results.
                return callback(1, projects);
            }
        });
};

Project.allNonPrivateUnlessTheyBelongToMe = function(currentUser, callback) {

    //TODO @silvae86 exception for the projects where the current user is either creator or contributor.
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
        "        ?uri dcterms:contributor  [2]\n" +
        "    }\n" +
        "}\n";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.string,
                value: "private"
            },
            {
                type: DbConnection.resourceNoEscape,
                value: currentUser.uri
            }
        ],

        function(err, projects) {

            if(!err && !isNull(projects) && projects instanceof Array)
            {
                Project.addProjectInformations(projects, callback);
            }
            else
            {
                //projects var will contain an error message instead of an array of results.
                return callback(1, projects);
            }
        });
};

Project.all = function(callback, req) {
    const self = this;
    Project.baseConstructor.all.call(self, function(err, projects) {

        //projects var will contain an error message instead of an array of results.
        return callback(err, projects);

    }, req);
};

Project.findByHandle = function(handle, callback) {
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
                type : DbConnection.resourceNoEscape,
                value :db.graphUri
            },
            {
                type : DbConnection.string,
                value : handle
            }
        ],

        function(err, project) {
            if(!err)
            {
                if(project instanceof Array && project.length > 0)
                {
                    if(project.length > 1)
                    {
                        console.log("Duplicate projects found!! Project handle : " + handle);
                    }
                    else
                    {
                        const projectUri = project[0].uri;
                        Project.findByUri(projectUri, function(err, project)
                        {
                            return callback(err, project);
                        });
                    }
                }
                else
                {
                    //project does not exist, return null
                    return callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, project);
            }
        });
};

Project.prototype.getCreatorsAndContributors = function(callback)
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
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, contributors) {
            if(!err)
            {
                if(contributors instanceof Array)
                {
                    const contributorsToReturn = [];
                    for(let i = 0; i < contributors.length; i++)
                    {
                        const contributor = contributors[i];
                        const aContributor = new User(contributor);
                        contributorsToReturn.push(aContributor);
                    }

                    return callback(null, contributorsToReturn);
                }
                else
                {
                    //project does not exist, return null
                    return callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, [contributors]);
            }
        });


};

Project.findByContributor = function(contributor, callback)
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
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : contributor
            }
        ],
        function(err, projects) {
            if(!err)
            {
                if(projects instanceof Array)
                {
                    const projectsToReturn = [];
                    for(let i = 0; i < projects.length; i++)
                    {
                        const aProject = new Project(projects[i]);
                        projectsToReturn.push(aProject);
                    }

                    return callback(null, projectsToReturn);
                }
                else
                {
                    //project does not exist, return null
                    return callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, [projects]);
            }
        });
};

Project.findByCreator = function(creator, callback) {
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
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : creator
            }
        ],
        function(err, projects) {
            if(!err)
            {
                if(projects instanceof Array)
                {
                    const projectsToReturn = [];
                    for(let i = 0; i < projects.length; i++)
                    {
                        const aProject = new Project(projects[i]);

                        aProject.creator = creator;
                        projectsToReturn.push(aProject);
                    }

                    return callback(null, projectsToReturn);
                }
                else
                {
                    //project does not exist, return null
                    return callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, [projects]);
            }
        });
};

Project.findByCreatorOrContributor = function(creatorOrContributor, callback)
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
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : creatorOrContributor
            }
        ],
        function(err, rows) {
            if(!err)
            {
                if(rows instanceof Array)
                {
                    const getProjectProperties = function (resultRow, cb) {
                        Project.findByUri(resultRow.uri, function (err, project) {
                            cb(err, project);
                        });
                    };

                    async.map(rows, getProjectProperties, function(err, projects)
                    {
                        return callback(err, projects);
                    });
                }
                else
                {
                    //project does not exist, return null
                    return callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                return callback(err, [rows]);
            }
    });
};

Project.createAndInsertFromObject = function(object, callback) {

    const newProject = new Project(object);
    const projectRootFolderURI = newProject.rootFolder();

    console.log("creating project from object\n" + util.inspect(object));

    newProject.save(function(err, newProject) {
        if(!err)
        {
            if(newProject instanceof Project)
            {
                const rootFolder = new Folder({
                    uri: projectRootFolderURI,
                    nie: {
                        title: object.ddr.handle,
                        isLogicalPartOf: newProject.uri
                    }
                });

                rootFolder.save(function(err, result)
                {
                    newProject.ddr.rootFolder = rootFolder.uri;
                    newProject.nie.hasLogicalPart = rootFolder.uri;

                    newProject.save(function(err, result){
                        return callback(err, result);
                    });
                });
            }
            else
            {
                return callback(1, "Statement executed but result was not what was expected. " + result);
            }
        }
        else
        {
            return callback(err, newProject);
        }
    });
};

Project.prototype.getFirstLevelDirectoryContents = function(callback)
{
    const self = this;

    Folder.findByUri(self.rootFolder(), function(err, folder){
        if(!err && !isNull(folder))
        {
            folder.getLogicalParts(function(err, children){
                if(!err)
                {
                    return callback(null, children);
                }
                else
                {
                    return callback(1, "Error fetching children of project root folder");
                }
            });
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
    console.log('In getProjectWideFolderFileCreationEvents');
    console.log('the projectUri is:');
    //<http://127.0.0.1:3001/project/testproject3/data>
    //var projectData = projectUri + '/data'; //TODO this is probably wrong
    const projectData = self.uri + '/data'; //TODO this is probably wrong
    /*WITH <http://127.0.0.1:3001/dendro_graph>
     SELECT ?dataUri
     WHERE {
     ?dataUri dcterms:modified ?date.
     <http://127.0.0.1:3001/project/testproject3/data> <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#hasLogicalPart> ?dataUri.
     }
     ORDER BY DESC(?date)
     OFFSET 0
     LIMIT 5*/

    //TODO test query first

    const query =
        "WITH [0] \n" +
        "SELECT ?dataUri \n" +
        "WHERE { \n" +
        "?dataUri dcterms:modified ?date. \n" +
        "[1] nie:hasLogicalPart ?dataUri. \n" +
        "} \n" +
        "ORDER BY DESC(?date) \n";

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resourceNoEscape,
                value : projectData
            }/*,
            {
                type : DbConnection.date,
                value: createdAfterDate
            }*/
        ]),//, startingResultPosition, maxResults),
        function(err, itemsUri) {
            if(!err)
            {
                console.log('itemsUri: ', itemsUri);

                async.map(itemsUri, function (itemUri, cb1) {
                    Resource.findByUri(itemUri.dataUri, function (error, item) {
                        console.log(item);
                        //item.get
                        //TODO get author
                    });
                }, function (err, fullItems) {
                    if(!err)
                    {
                        return callback(null, fullItems);
                    }
                    else
                    {
                        const msg = "Error fetching file/folders creation info for project:" + self.uri;
                        return callback(true, msg);
                    }
                });

                /*
                var getVersionDetails = function(result, callback){
                    ArchivedResource.findByUri(result.version, function(err, result){
                        if(!err)
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

                async.map(results, getVersionDetails, function(err, fullVersions){
                    return callback(err, fullVersions);
                })*/
            }
            else
            {
                var msg = "Error fetching file/folder change data";
                console.log(msg);
                return callback(1, msg);
            }
        });
};

Project.prototype.getRecentProjectWideChangesSocial = function (callback, startingResultPosition, maxResults, createdAfterDate) {
    const self = this;
    console.log('createdAfterDate:', createdAfterDate);
    console.log('startingResultPosition: ', startingResultPosition);
    console.log('maxResults: ', maxResults);

    let query =
        "WITH [0] \n" +
        "SELECT ?version \n" +
        "WHERE { \n" +
        "?version dcterms:created ?date. \n" +
        "filter ( \n" +
        "xsd:dateTime(?date) >= [2]" + "^^xsd:dateTime" + " ). \n" +
        "?version rdf:type ddr:ArchivedResource . \n" +
        " filter ( \n" +
        "STRSTARTS(STR(?version), [1]) \n" +
        " ) \n" +
        "} \n" +
        "ORDER BY DESC(?date) \n";

    query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.stringNoEscape,
                value : self.uri
            },
            {
                type : DbConnection.date,
                value: createdAfterDate
            }
        ], startingResultPosition, maxResults),
        function(err, results) {
            if(!err)
            {
                const getVersionDetails = function (result, callback) {
                    ArchivedResource.findByUri(result.version, function (err, result) {
                        if (!err) {
                            result.getDetailedInformation(function (err, versionWithDetailedInfo) {
                                return callback(err, versionWithDetailedInfo);
                            });
                        }
                        else {
                            return callback(err, result);
                        }
                    });
                };

                async.map(results, getVersionDetails, function(err, fullVersions){
                    return callback(err, fullVersions);
                })
            }
            else
            {
                return callback(1, "Error fetching children of project root folder");
            }
        });
};

Project.prototype.getRecentProjectWideChanges = function(callback, startingResultPosition, maxResults)
{
    const self = this;

    let query =
        "WITH [0] \n" +
        "SELECT ?version \n" +
        "WHERE { \n" +
        "?version dcterms:created ?date. \n" +
        "?version rdf:type ddr:ArchivedResource . \n" +
        " filter ( \n" +
        "STRSTARTS(STR(?version), [1]) \n" +
        " ) \n" +
        "} \n" +
        "ORDER BY DESC(?date) \n";

    query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.stringNoEscape,
                value : self.uri
            }
        ], startingResultPosition, maxResults),
        function(err, results) {
            if(!err)
            {
                const getVersionDetails = function (result, callback) {
                    ArchivedResource.findByUri(result.version, function (err, result) {
                        if (!err) {
                            result.getDetailedInformation(function (err, versionWithDetailedInfo) {
                                return callback(err, versionWithDetailedInfo);
                            });
                        }
                        else {
                            return callback(err, result);
                        }
                    });
                };

                async.map(results, getVersionDetails, function(err, fullVersions){
                    return callback(err, fullVersions);
                })
            }
            else
            {
                return callback(1, "Error fetching children of project root folder");
            }
        });
};

Project.prototype.getStorageSize = function(callback)
{
    const self = this;

    /**
     * YOU NEED MONGODB 10GEN to run this, or it will give errors.
     */
    gfs.connection.db.collection("fs.files", function(err, collection) {
        if(!err)
        {
            collection.aggregate([
                {
                    $match: {"metadata.project" : self.uri}
                },
                {
                    $group:
                    {
                        _id : null,
                        sum : {
                            $sum: "$length"
                        }
                    }
                }
            ],function(err, result){
                if(!err)
                {
                    if(!isNull(result) && result instanceof Array && result.length === 1 && !isNull(result[0].sum))
                    {
                        return callback(null, result[0].sum);
                    }
                    else
                    {
                        return callback(null, 0);
                    }
                }
                else
                {
                    console.error("* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : " + JSON.stringify(err)  + JSON.stringify(result));
                    return callback(1, "Error retrieving project size : " + JSON.stringify(err) + JSON.stringify(result));
                }
            });
        }
        else
        {
            console.error("* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : " + JSON.stringify(err)  + JSON.stringify(result));
            return callback(1, "Error retrieving files collection : " + collection);
        }
    });
};

Project.prototype.getFilesCount = function(callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?file) as ?file_count \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "{ \n" +
        " ?file rdf:type nfo:FileDataObject . \n" +
        " ?file nie:isLogicalPartOf+ [1] . \n" +
        " [1] rdf:type ddr:Project . \n" +
        " FILTER NOT EXISTS " +
        "{ \n" +
        " ?file ddr:isVersionOf ?some_resource .\n" +
        "} \n" +
        "} \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, result)
        {
            if (!err)
            {
                if(result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].file_count);
                }
                else
                {
                    return callback(1, "invalid result retrieved when querying for project file count");
                }
            }
            else
            {
                return callback(err, -1);
            }
        });
};

Project.prototype.getMembersCount = function(callback)
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
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, result)
        {
            if (!err)
            {
                if(result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].contributor_count);
                }
                else
                {
                    return callback(1, "invalid result retrieved when querying for project contributor count");
                }
            }
            else
            {
                return callback(err, -1);
            }
        });
};

Project.prototype.getFoldersCount = function(callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?folder) as ?folder_count \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "{ \n" +
        " ?folder rdf:type nfo:Folder . \n" +
        " ?folder nie:isLogicalPartOf+ [1] . \n" +
        " [1] rdf:type ddr:Project . \n" +
        " FILTER NOT EXISTS " +
        "{ \n" +
        " ?folder ddr:isVersionOf ?some_resource .\n" +
        "} \n" +
        "} \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, result)
        {
            if (!err)
            {
                if(result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].folder_count);
                }
                else
                {
                    return callback(1, "invalid result retrieved when querying for project folder count");
                }

            }
            else
            {
                return callback(err, -1);
            }
        });
};

Project.prototype.getRevisionsCount = function(callback)
{
    const self = this;

    const query =
        "SELECT COUNT(?revision) as ?revision_count \n" +
        "FROM [0] \n" +
        "WHERE " +
        "{ \n" +
        "{ \n" +
        " ?revision ddr:isVersionOf ?resource . \n" +
        " ?resource nie:isLogicalPartOf+ [1] . \n" +
        " [1] rdf:type ddr:Project . \n" +
        "} \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, result)
        {
            if (!err)
            {
                if(result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].revision_count);
                }
                else
                {
                    return callback(1, "invalid result retrieved when querying for revisions count");
                }

            }
            else
            {
                return callback(err, -1);
            }
        });
};

Project.prototype.getFavoriteDescriptors = function(maxResults, callback, allowedOntologies)
{
    const self = this;

    let argumentsArray = [
        {
            type: DbConnection.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: DbConnection.stringNoEscape,
            value: self.uri
        },
        {
            type: DbConnection.string,
            value: Interaction.types.favorite_descriptor_from_quick_list_for_project.key
        },
        {
            type: DbConnection.string,
            value: Interaction.types.unfavorite_descriptor_from_quick_list_for_project.key
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if(!isNull(allowedOntologies) && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    let fromString = "";

    const fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "favorited_descriptor");

    const query =
    "       SELECT ?favorited_descriptor as ?descriptor ?label ?comment ?last_favorited ?last_unfavorited \n" +
    fromString + "\n" +
    "		WHERE \n" +
    "		{ \n" +
    "			?favorited_descriptor rdfs:label ?label.  \n" +
    "			?favorited_descriptor rdfs:comment ?comment.  \n" +
    "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n" +
    "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n" +
    "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n" +
    filterString + "\n" +
    "			{ \n" +
    "				SELECT ?favorited_descriptor MAX(?date_favorited) as ?last_favorited \n" +
    "				FROM [0]  \n" +
    "				WHERE  \n" +
    "				{  \n" +
    "				   	?favorite_interaction ddr:executedOver ?favorited_descriptor. \n" +
    "				   	?favorite_interaction ddr:interactionType [2] . \n" +
    "					?favorite_interaction ddr:originallyRecommendedFor ?information_element. \n" +
    "				   	?favorite_interaction dcterms:created ?date_favorited. \n" +
    "				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n" +
    "				} \n" +
    "			}. \n" +
    "			OPTIONAL " +
    "           { \n" +
    "				SELECT ?favorited_descriptor MAX(?date_unfavorited) as ?last_unfavorited \n" +
    "				FROM [0]  \n" +
    "				WHERE  \n" +
    "				{  \n" +
    "				   	?unfavorite_interaction ddr:executedOver ?favorited_descriptor. \n" +
    "				   	?unfavorite_interaction ddr:interactionType [3]. \n" +

    "				   	?unfavorite_interaction ddr:originallyRecommendedFor ?information_element. \n" +
    "				   	?unfavorite_interaction dcterms:created ?date_unfavorited. \n" +
    "				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n" +
    "				} \n" +
    "			} \n" +
    "		   	FILTER" +
    "           ( \n" +
    "		   	    ( \n" +
    "		   	        bound(?last_unfavorited) && (?last_favorited > ?last_unfavorited)\n" +
    "		   	    ) \n" +
    "		   	    || \n" +
    "		   	    ( \n" +
    "                   !bound(?last_unfavorited)\n" +
    "		   	    ) \n" +
    "		   	) \n" +
    "		} \n";

    db.connection.execute(
        query,
        argumentsArray,
        function(err, descriptors)
        {
            if (!err)
            {
                if(descriptors instanceof Array)
                {
                    const fullDescriptors = [];
                    for(let i = 0; i < descriptors.length; i++)
                    {
                        const d = new Descriptor({
                            uri: descriptors[i].descriptor,
                            label: descriptors[i].label,
                            comment: descriptors[i].comment
                        });

                        d.recommendation_types = {};
                        d.recommendation_types[Descriptor.recommendation_types.project_favorite.key] = true;

                        d.last_favorited = descriptors.last_favorited;

                        fullDescriptors.push(d);
                    }

                    return callback(null, fullDescriptors);
                }
                else
                {
                    return callback(1, "invalid result retrieved when querying for project's favorite descriptors");
                }

            }
            else
            {
                return callback(err, -1);
            }
        });
};

Project.prototype.getHiddenDescriptors = function(maxResults, callback, allowedOntologies)
{
    const self = this;

    let argumentsArray = [
        {
            type: DbConnection.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: DbConnection.stringNoEscape,
            value: self.uri
        },
        {
            type: DbConnection.string,
            value: Interaction.types.hide_descriptor_from_quick_list_for_project.key
        },
        {
            type: DbConnection.string,
            value: Interaction.types.unhide_descriptor_from_quick_list_for_project.key
        }
    ];


    const publicOntologies = Ontology.getPublicOntologiesUris();
    if(!isNull(allowedOntologies) && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    let fromString = "";

    const fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "hidden_descriptor");


    const query =
        "		SELECT ?hidden_descriptor as ?descriptor ?label ?comment ?last_hidden ?last_unhidden \n" +
        fromString + "\n" +
        "		WHERE \n" +
        "		{ \n" +
        "			?hidden_descriptor rdfs:label ?label.  \n" +
        "			?hidden_descriptor rdfs:comment ?comment.  \n" +
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n" +
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n" +
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n" +
        filterString + "\n" +
        "			{ \n" +
        "				SELECT ?hidden_descriptor MAX(?date_hidden) as ?last_hidden \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?hiding_interaction ddr:executedOver ?hidden_descriptor. \n" +
        "				   	?hiding_interaction ddr:interactionType [2] . \n" +

        "					?hiding_interaction ddr:originallyRecommendedFor ?information_element. \n" +
        "				   	?hiding_interaction dcterms:created ?date_hidden. \n" +
        "				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n" +
        "				} \n" +
        "			}. \n" +
        "			OPTIONAL" +
        "           { \n" +
        "				SELECT ?hidden_descriptor MAX(?date_unhidden) as ?last_unhidden \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?unhiding_interaction ddr:executedOver ?hidden_descriptor. \n" +
        "				   	?unhiding_interaction ddr:interactionType [3]. \n" +

        "				   	?unhiding_interaction ddr:originallyRecommendedFor ?information_element. \n" +
        "				   	?unhiding_interaction dcterms:created ?date_unhidden. \n" +
        "				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n" +
        "				} \n" +
        "			} \n" +
        "		   	FILTER" +
        "           ( \n" +
        "		   	    ( \n" +
        "		   	        bound(?last_unhidden) && (?last_hidden > ?last_unhidden)\n" +
        "		   	    ) \n" +
        "		   	    || \n" +
        "		   	    ( \n" +
        "                   !bound(?last_unhidden)\n" +
        "		   	    ) \n" +
        "		   	) \n" +
        "		} \n";

    db.connection.execute(
        query,
        argumentsArray,
        function(err, descriptors)
        {
            if (!err)
            {
                if(descriptors instanceof Array)
                {
                    const fullDescriptors = [];
                    for(let i = 0; i < descriptors.length; i++)
                    {
                        const d = new Descriptor({
                            uri: descriptors[i].descriptor,
                            label: descriptors[i].label,
                            comment: descriptors[i].comment
                        });

                        d.recommendation_types = {};
                        d.recommendation_types[Descriptor.recommendation_types.project_hidden.key] = true;

                        d.last_hidden = descriptors.last_hidden;

                        fullDescriptors.push(d);
                    }

                    return callback(null, fullDescriptors);
                }
                else
                {
                    return callback(1, "invalid result retrieved when querying for project's favorite descriptors");
                }

            }
            else
            {
                return callback(err, -1);
            }
        });
};

Project.prototype.findMetadata = function(callback)
{
    const self = this;

    self.getPropertiesFromOntologies(
        Ontology.getPublicOntologiesUris(),
        function(err, descriptors)
        {
            return callback(err,
                {
                    descriptors : descriptors,
                    title : self.dcterms.title
                }
            );
        }
    );
};

Project.prototype.findMetadataOfRootFolder = function(callback)
{
    const self = this;
    var rootFolder = self.ddr.rootFolder;

    var rootFolder = new Folder({
        uri : rootFolder
    });

    rootFolder.findMetadata(callback);
};

/**
 * Attempts to determine the project of a requested resource based on its uri
 * @param originalRequestUri
 * @param callback
 */
Project.getOwnerProjectBasedOnUri = function(requestedResource, callback)
{
    let handle = requestedResource.replace(Config.baseUri + "/project/", "");
    handle = handle.replace(/\?.*/,"");
    handle = handle.replace(/\/.*$/,"");
    Project.findByHandle(handle, callback);
};


Project.privacy = function (projectUri, callback) {
    Project.findByUri(projectUri, function (err, project) {
        if (!err)
        {
            if(isNull(project))
            {
                return callback(1, null);
            }
            else
            {
                privacy = project.ddr.privacyStatus;

                if(!isNull(privacy) && privacy instanceof Array && privacy.length > 0)
                {
                    return callback(null, privacy[0].p);
                }
                else
                {
                    return callback(null, null);
                }
            }
        }
        else
        {
            return callback(1, "Error occurred fetching the privacy status of project " + projectUri + ". Error : " + project);
        }
    });
};

Project.validateBagItFolderStructure = function(absPathOfBagItFolder, callback)
{
    const fs = require('fs');
    const path = require('path');

    fs.stat(absPathOfBagItFolder, function(err, stat)
    {
        if (isNull(err))
        {
            if(stat.isDirectory())
            {
                const dataFolder = path.join(absPathOfBagItFolder, "data");
                fs.stat(dataFolder, function(err, stat)
                {
                    if (isNull(err))
                    {
                        if(stat.isDirectory())
                        {
                            fs.readdir(dataFolder, function (err, folderContents) {
                                if(!err)
                                {
                                    if(folderContents instanceof Array && folderContents.length === 1)
                                    {
                                        const childOfDataFolderAbsPath = path.join(dataFolder, folderContents[0]);

                                        fs.stat(childOfDataFolderAbsPath, function(err, stat)
                                        {
                                            if (isNull(err))
                                            {
                                                if (stat.isDirectory())
                                                {
                                                    fs.readdir(childOfDataFolderAbsPath, function (err, folderContents)
                                                    {
                                                        if (isNull(err))
                                                        {
                                                            if(folderContents.indexOf(Config.packageMetadataFileName) >= 0)
                                                            {
                                                                return callback(null, true, childOfDataFolderAbsPath);
                                                            }
                                                            else
                                                            {
                                                                return callback(null, false, "There is no " + Config.packageMetadataFileName + " inside the /data subdirectory.");
                                                            }
                                                        }
                                                        else
                                                        {
                                                            return callback(err, false, "child of /data contains only one element but is not a directory.");
                                                        }
                                                    });
                                                }
                                                else
                                                {
                                                    return callback(0, false, "child of /data contains only one element but is not a directory.");
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
                                        return callback(0, false, "/data folder should contain exactly one directory.");
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
                            return callback(0, false, "/data exists but is not a directory.");
                        }
                    }
                    else if (err.code === 'ENOENT')
                    {
                        return callback(0, false, "/data subfolder does not exist.");
                    }
                });
            }
            else
            {
                return callback(0, false, absPathOfBagItFolder + " is not a directory");
            }
        }
        else if (err.code === 'ENOENT')
        {
            return callback(0, false);
        }
    });
};

Project.getStructureFromBagItZipFolder = function(absPathToZipFile, maxStorageSize, callback)
{
    const path = require('path');

    File.estimateUnzippedSize(absPathToZipFile, function(err, size)
    {
        if(!err)
        {
            if(size < maxStorageSize)
            {
                File.unzip(absPathToZipFile, function(err, absPathOfRootFolder){
                    if(!err)
                    {
                        Project.validateBagItFolderStructure(absPathOfRootFolder, function(err, valid, pathToFolderToRestore)
                        {
                            if(!err)
                            {
                                if(valid)
                                {
                                    const metadataFileAbsPath = path.join(pathToFolderToRestore, Config.packageMetadataFileName);
                                    const metadata = require(metadataFileAbsPath);
                                    return callback(null, true, metadata);
                                }
                                else
                                {
                                    return callback(1, "Invalid Bagit structure. Are you sure this is a Dendro project backup? Error reported: " + pathToFolderToRestore);
                                }
                            }
                            else
                            {
                                return callback(err, pathToFolderToRestore);
                            }
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
                const filesize = require('file-size');
                const difference = maxStorageSize - size;

                const humanSizeDifference = filesize(difference).human('jedec');
                const humanZipFileSize = filesize(size).human('jedec');
                const humanMaxStorageSize = filesize(maxStorageSize).human('jedec');

                var msg = "Estimated storage size of the project after unzipping ( " + humanZipFileSize + " ) exceeds the maximum storage allowed for a project ( "+ humanMaxStorageSize +" ) by " + humanSizeDifference;
                return callback(err, msg);
            }

        }
        else
        {
            var msg = "Unable to estimate size of the zip file sent in as the project backup. Error reported: " + absPathToZipFile;
            return callback(err, msg);
        }
    });


};

Project.restoreFromFolder = function(absPathOfRootFolder,
                                     entityLoadingTheMetadata,
                                     attemptToRestoreMetadata,
                                     replaceExistingFolder,
                                     callback,
                                     runningOnRoot
                            )
{
    const self = this;
    const path = require('path');

    if(typeof entityLoadingTheMetadata != null && entityLoadingTheMetadata instanceof User)
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
                 * Restore metadata values from metadata.json file
                 */
                const metadataFileLocation = path.join(absPathOfRootFolder, Config.packageMetadataFileName);
                const fs = require('fs');

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
                                if(!err)
                                {
                                    return callback(null, "Data and metadata restored successfully. Result : " + result);
                                }
                                else
                                {
                                    return callback(1, "Error restoring metadata for node " + self.uri + " : " + result);
                                }
                            }, entityLoadingTheMetadataUri, [Config.types.locked],[Config.types.restorable])
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

Project.rebaseAllUris = function(structure, newBaseUri)
{
    const modifyNode = function (node) {
        node.resource = Utils.replaceBaseUri(node.resource, newBaseUri);

        for (var i = 0; i < node.metadata.length; i++) {
            let value = node.metadata[i].value;

            if (value instanceof Array) {
                for (let j = 0; j < value.length; j++) {
                    if (Utils.valid_url(value[j])) {
                        value[j] = Utils.replaceBaseUri(value[j], newBaseUri);
                    }
                }
            }
            else if (typeof value === "string" && Utils.valid_url(value)) {
                value = Utils.replaceBaseUri(value, newBaseUri);
            }
        }

        if (!isNull(node.children) && node.children instanceof Array) {
            for (var i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                modifyNode(child);
            }
        }
    };

    modifyNode(structure);
};


Project.prefixedRDFType = "ddr:Project";

Project = Class.extend(Project, Resource);

module.exports.Project = Project;
