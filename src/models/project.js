//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

var Config = require("./meta/config.js").Config;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource")).ArchivedResource;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var util = require('util');
var async = require('async');
var _ = require('underscore');

function Project(object)
{
    Project.baseConstructor.call(this, object);
    var self = this;

    if(self.uri == null)
    {
        self.uri = Config.baseUri + "/project/" + self.ddr.handle;
    }

    self.rdf.type = "ddr:Project";

    return self;
}

Project.prototype.rootFolder = function()
{
    var self = this;
    return db.baseURI + "/project/" + self.ddr.handle + "/data";
};

Project.prototype.delete = function(callback)
{
    var self = this;
    self.ddr.deleted = true;
    this.save(callback);
};

Project.prototype.undelete = function(callback)
{
    var self = this;
    delete self.ddr.deleted;
    this.save(callback);
};

Project.prototype.backup = function(callback)
{
    var self = this;
    self.ddr.beingBackedUp = true;

    if(self.ddr.rootFolder == null && self.nie.hasLogicalPart != null)
    {
        self.ddr.rootFolder = self.nie.hasLogicalPart;
    }

    self.save(function(err, result){
        if(!err && result instanceof Project)
        {
            if(self.ddr.rootFolder != null)
            {
                console.log("Started backup of project " + self.uri);
                Folder.findByUri(self.ddr.rootFolder, function(err, folder){
                    if(!err && folder instanceof Folder)
                    {
                        var bagItOptions = {
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
                                    var path = require('path');

                                    var finishedZipFileName = "bagit_backup.zip";
                                    var finishedZipFileAbsPath = path.join(parentFolderPath, finishedZipFileName);
                                    Folder.zip(absolutePathOfFinishedFolder, finishedZipFileAbsPath, function(err, zipFileFullPath){
                                        callback(err, zipFileFullPath, parentFolderPath);
                                    }, finishedZipFileName, true);
                                }
                                else
                                {
                                    callback(1, "Unable to zip folder at " + finalBagItOptions.bagName + " \n " + finalBagItOptions);
                                }
                            }
                        );
                    }
                    else
                    {
                        callback(1, "Folder with " + self.ddr.rootFolder + " does not exist: " + folder);
                    }
                });
            }
            else
            {
                callback(1, "Project : " + self.uri + " has no root folder.");
            }
        }
    });
};

Project.all = function(callback) {
    var query =
            "SELECT * " +
            "FROM [0] "+
            "WHERE " +
            "{ " +
            " ?uri rdf:type ddr:Project " +
            "} ";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            }
        ],

        function(err, projects) {
            if(!err && projects instanceof Array)
            {
                var getProjectInformation = function(project, callback)
                {
                    Project.findByUri(project.uri, callback);
                };

                //get all the information about all the projects
                // and return the array of projects, complete with that info
                async.map(projects, getProjectInformation, function(err, projectsToReturn)
                {
                    if(!err)
                    {
                        callback(null, projectsToReturn);
                    }
                    else
                    {
                        callback("error fetching project information : " + err, projectsToReturn);
                    }
                });
            }
            else
            {
                //projects var will contain an error message instead of an array of results.
                callback(err, projects);
            }
    });
}

Project.findByHandle = function(handle, callback) {
    var self = this;

    var query =
            "SELECT ?uri " +
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
                        var projectUri = project[0].uri;
                        Project.findByUri(projectUri, function(err, project)
                        {
                            callback(err, project);
                        });
                    }
                }
                else
                {
                    //project does not exist, return null
                    callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                callback(err, project);
            }
        });
}

Project.prototype.getCreatorsAndContributors = function(callback)
{
    var self = this;

    var query =
            "SELECT * \n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   { \n" +
            "       [1] dcterms:contributor ?uri .\n"+
            "       OPTIONAL { ?uri ddr:username ?username . }\n" +
            "       OPTIONAL { ?uri foaf:mbox ?email . }\n" +
            "       OPTIONAL { ?uri foaf:firstName ?firstname . }\n" +
            "       OPTIONAL { ?uri foaf:surname ?surname . }\n" +
            "   } \n" +
            "   UNION " +
            "   { " +
            "       [1] dcterms:creator ?uri .\n"+
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
                    var contributorsToReturn = [];
                    for(var i = 0; i < contributors.length; i++)
                    {
                        var contributor = contributors[i];
                        var aContributor = new User(contributor);
                        contributorsToReturn.push(aContributor);
                    }

                    callback(null, contributorsToReturn);
                }
                else
                {
                    //project does not exist, return null
                    callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                callback(err, [contributors]);
            }
        });


}

Project.findByContributor = function(contributor, callback)
{
    var query =
        "SELECT * " +
            "FROM [0] " +
            "WHERE " +
            "{ " +
            " ?uri ddr:handle ?handle . " +
            " ?uri dcterms:contributor [1] ."+
            " ?uri dcterms:title ?title ."+
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
                    var projectsToReturn = [];
                    for(var i = 0; i < projects.length; i++)
                    {
                        var aProject = new Project(projects[i]);
                        projectsToReturn.push(aProject);
                    }

                    callback(null, projectsToReturn);
                }
                else
                {
                    //project does not exist, return null
                    callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                callback(err, [projects]);
            }
        });
}

Project.findByCreator = function(creator, callback) {
    var query =
            "SELECT * " +
            "FROM [0] " +
            "WHERE " +
            "{ " +
                " ?uri rdf:type ddr:Project . " +
                " ?uri ddr:handle ?handle . " +
                " ?uri dcterms:creator [1] ."+
                " ?uri dcterms:title ?title ."+
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
                    var projectsToReturn = [];
                    for(var i = 0; i < projects.length; i++)
                    {
                        var aProject = new Project(projects[i]);

                        aProject.creator = creator;
                        projectsToReturn.push(aProject);
                    }

                    callback(null, projectsToReturn);
                }
                else
                {
                    //project does not exist, return null
                    callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                callback(err, [projects]);
            }
        });
}

Project.findByCreatorOrContributor = function(creatorOrContributor, callback)
{
    var query =
        "SELECT ?uri \n" +
            "FROM [0] \n" +
            "WHERE { \n" +
                "{ \n" +
                " ?uri rdf:type ddr:Project . "+
                " ?uri dcterms:creator [1] \n"+
                "} \n" +
                " UNION \n" +
                "{ \n" +
                " ?uri rdf:type ddr:Project . "+
                " ?uri dcterms:contributor [1] \n"+
                "} \n"+
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
                    var getProjectProperties = function(resultRow, cb)
                    {
                        Project.findByUri(resultRow.uri, function(err, project)
                        {
                            cb(err, project);
                        });
                    };

                    async.map(rows, getProjectProperties, function(err, projects)
                    {
                        callback(err, projects);
                    });
                }
                else
                {
                    //project does not exist, return null
                    callback(0, null);
                }
            }
            else
            {
                //project var will contain an error message instead of a single-element
                // array containing project data.
                callback(err, [rows]);
            }
    });
};

Project.createAndInsertFromObject = function(object, callback) {

    var newProject = new Project(object);
    var projectRootFolderURI = newProject.rootFolder();

    console.log("creating project from object\n" + util.inspect(object));

    //TODO CACHE DONE

    newProject.save(function(err, newProject) {
        if(!err)
        {
            if(newProject instanceof Project)
            {
                var rootFolder = new Folder({
                    uri : projectRootFolderURI,
                    nie :
                    {
                        title : object.ddr.handle,
                        isLogicalPartOf : newProject.uri
                    }
                });

                rootFolder.save(function(err, result)
                {
                    newProject.ddr.rootFolder = rootFolder.uri;
                    newProject.nie.hasLogicalPart = rootFolder.uri;

                    newProject.save(function(err, result){
                        callback(err, result);
                    });
                });
            }
            else
            {
                callback(1, "Statement executed but result was not what was expected. " + result);
            }
        }
        else
        {
            callback(err, result);
        }
    });
};

Project.prototype.getFirstLevelDirectoryContents = function(callback)
{
    var self = this;

    Folder.findByUri(self.rootFolder(), function(err, folder){
        if(!err && folder != null)
        {
            folder.getLogicalParts(function(err, children){
                if(!err)
                {
                    callback(null, children);
                }
                else
                {
                    callback(1, "Error fetching children of project root folder");
                }
            });
        }
        else
        {
            callback(1, "unable to retrieve project " + self.ddr.handle + " 's root folder's contents. Error :" + err);
        }
    });
};

Project.prototype.getRecentProjectWideChangesSocial = function (callback, startingResultPosition, maxResults, createdAfterDate) {
    var self = this;
    console.log('createdAfterDate:', createdAfterDate);
    console.log('startingResultPosition: ', startingResultPosition);
    console.log('maxResults: ', maxResults);

    var query =
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
                var getVersionDetails = function(result, callback){
                    ArchivedResource.findByUri(result.version, function(err, result){
                        if(!err)
                        {
                            result.getDetailedInformation(function(err, versionWithDetailedInfo)
                            {
                                callback(err, versionWithDetailedInfo);
                            });
                        }
                        else
                        {
                            callback(err, result);
                        }
                    });
                };

                async.map(results, getVersionDetails, function(err, fullVersions){
                    callback(err, fullVersions);
                })
            }
            else
            {
                callback(1, "Error fetching children of project root folder");
            }
        });
};

Project.prototype.getRecentProjectWideChanges = function(callback, startingResultPosition, maxResults)
{
    var self = this;

    var query =
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
                var getVersionDetails = function(result, callback){
                    ArchivedResource.findByUri(result.version, function(err, result){
                        if(!err)
                        {
                            result.getDetailedInformation(function(err, versionWithDetailedInfo)
                            {
                                callback(err, versionWithDetailedInfo);
                            });
                        }
                        else
                        {
                            callback(err, result);
                        }
                    });
                };

                async.map(results, getVersionDetails, function(err, fullVersions){
                    callback(err, fullVersions);
                })
            }
            else
            {
                callback(1, "Error fetching children of project root folder");
            }
        });
};

Project.prototype.getStorageSize = function(callback)
{
    var self = this;

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
                    if(result != null && result instanceof Array && result.length == 1 && result[0].sum != null)
                    {
                        callback(null, result[0].sum);
                    }
                    else
                    {
                        callback(null, 0);
                    }
                }
                else
                {
                    console.error("* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : " + JSON.stringify(err)  + JSON.stringify(result));
                    callback(1, "Error retrieving project size : " + JSON.stringify(err) + JSON.stringify(result));
                }
            });
        }
        else
        {
            console.error("* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : " + JSON.stringify(err)  + JSON.stringify(result));
            callback(1, "Error retrieving files collection : " + collection);
        }
    });
};

Project.prototype.getFilesCount = function(callback)
{
    var self = this;

    var query =
        "SELECT COUNT(?file) as ?file_count \n" +
            "FROM [0] \n" +
            "WHERE { \n" +
                "{ \n" +
                " ?file rdf:type nfo:FileDataObject . \n" +
                " ?file nie:isLogicalPartOf+ [1] . \n" +
                " [1] rdf:type ddr:Project . \n" +
                    " FILTER NOT EXISTS " +
                    "{ \n"+
                    " ?file ddr:isVersionOf ?some_resource .\n" +
                    "} \n"+
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
                    callback(null, result[0].file_count);
                }
                else
                {
                    callback(1, "invalid result retrieved when querying for project file count");
                }
            }
            else
            {
                callback(err, -1);
            }
        });
};

Project.prototype.getMembersCount = function(callback)
{
    var self = this;

    var query =
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
                    callback(null, result[0].contributor_count);
                }
                else
                {
                    callback(1, "invalid result retrieved when querying for project contributor count");
                }
            }
            else
            {
                callback(err, -1);
            }
        });
};

Project.prototype.getFoldersCount = function(callback)
{
    var self = this;

    var query =
        "SELECT COUNT(?folder) as ?folder_count \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "{ \n" +
        " ?folder rdf:type nfo:Folder . \n" +
        " ?folder nie:isLogicalPartOf+ [1] . \n" +
        " [1] rdf:type ddr:Project . \n" +
            " FILTER NOT EXISTS " +
            "{ \n"+
            " ?folder ddr:isVersionOf ?some_resource .\n" +
            "} \n"+
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
                    callback(null, result[0].folder_count);
                }
                else
                {
                    callback(1, "invalid result retrieved when querying for project folder count");
                }

            }
            else
            {
                callback(err, -1);
            }
        });
};

Project.prototype.getRevisionsCount = function(callback)
{
    var self = this;

    var query =
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
                    callback(null, result[0].revision_count);
                }
                else
                {
                    callback(1, "invalid result retrieved when querying for revisions count");
                }

            }
            else
            {
                callback(err, -1);
            }
        });
};

Project.prototype.getFavoriteDescriptors = function(maxResults, callback, allowedOntologies)
{
    var self = this;

    var argumentsArray = [
        {
            type : DbConnection.resourceNoEscape,
            value : db.graphUri
        },
        {
            type : DbConnection.stringNoEscape,
            value : self.uri
        },
        {
            type : DbConnection.string,
            value : Interaction.types.favorite_descriptor_from_quick_list_for_project.key
        },
        {
            type : DbConnection.string,
            value : Interaction.types.unfavorite_descriptor_from_quick_list_for_project.key
        }
    ];

    var publicOntologies = Ontology.getPublicOntologiesUris();
    if(allowedOntologies != null && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    var fromString = "";

    var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "favorited_descriptor");

    var query =
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
                    var fullDescriptors = [];
                    for(var i = 0; i < descriptors.length; i++)
                    {
                        var d = new Descriptor({
                            uri : descriptors[i].descriptor,
                            label : descriptors[i].label,
                            comment : descriptors[i].comment
                        });

                        d.recommendation_types = {};
                        d.recommendation_types[Descriptor.recommendation_types.project_favorite.key] = true;

                        d.last_favorited = descriptors.last_favorited;

                        fullDescriptors.push(d);
                    }

                    callback(null, fullDescriptors);
                }
                else
                {
                    callback(1, "invalid result retrieved when querying for project's favorite descriptors");
                }

            }
            else
            {
                callback(err, -1);
            }
        });
};

Project.prototype.getHiddenDescriptors = function(maxResults, callback, allowedOntologies)
{
    var self = this;

    var argumentsArray = [
        {
            type : DbConnection.resourceNoEscape,
            value : db.graphUri
        },
        {
            type : DbConnection.stringNoEscape,
            value : self.uri
        },
        {
            type : DbConnection.string,
            value : Interaction.types.hide_descriptor_from_quick_list_for_project.key
        },
        {
            type : DbConnection.string,
            value : Interaction.types.unhide_descriptor_from_quick_list_for_project.key
        }
    ];


    var publicOntologies = Ontology.getPublicOntologiesUris();
    if(allowedOntologies != null && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    var fromString = "";

    var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "hidden_descriptor");


    var query =
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
                    var fullDescriptors = [];
                    for(var i = 0; i < descriptors.length; i++)
                    {
                        var d = new Descriptor({
                            uri : descriptors[i].descriptor,
                            label : descriptors[i].label,
                            comment : descriptors[i].comment
                        });

                        d.recommendation_types = {};
                        d.recommendation_types[Descriptor.recommendation_types.project_hidden.key] = true;

                        d.last_hidden = descriptors.last_hidden;

                        fullDescriptors.push(d);
                    }

                    callback(null, fullDescriptors);
                }
                else
                {
                    callback(1, "invalid result retrieved when querying for project's favorite descriptors");
                }

            }
            else
            {
                callback(err, -1);
            }
        });
};



/**
 * Attempts to determine the project of a requested resource based on its uri
 * @param originalRequestUri
 * @param callback
 */
Project.getOwnerProjectBasedOnUri = function(requestedResource, callback)
{
    var handle = requestedResource.replace(Config.baseUri + "/project/","");
    handle = handle.replace(/\?.*/,"");
    handle = handle.replace(/\/.*$/,"");
    Project.findByHandle(handle, callback);
};

Project.privacy = function (projectUri, callback) {
    Project.findByUri(projectUri, function (err, project) {
        if (!err)
        {
            if(project == null)
            {
                callback(1, null);
            }
            else
            {
                privacy = project.ddr.privacyStatus;

                if(privacy != null && privacy instanceof Array && privacy.length > 0)
                {
                    callback(null, privacy[0].p);
                }
                else
                {
                    callback(null, "http://dendro.fe.up.pt/ontology/0.1/privateStatus");
                }
            }
        }
        else
        {
            callback(1, "Error occurred fetching the privacy status of project " + projectUri + ". Error : " + project);
        }
    });
};

Project = Class.extend(Project, Resource);

module.exports.Project = Project;
