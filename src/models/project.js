// follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const DbConnection = require(Pathfinder.absPathInSrcFolder('/kb/db.js')).DbConnection;
const Cache = require(Pathfinder.absPathInSrcFolder('/kb/cache/cache.js')).Cache;
const Resource = require(Pathfinder.absPathInSrcFolder('/models/resource.js')).Resource;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;
const Folder = require(Pathfinder.absPathInSrcFolder('/models/directory_structure/folder.js')).Folder;
const File = require(Pathfinder.absPathInSrcFolder('/models/directory_structure/file.js')).File;
const User = require(Pathfinder.absPathInSrcFolder('/models/user.js')).User;
const Class = require(Pathfinder.absPathInSrcFolder('/models/meta/class.js')).Class;
const Ontology = require(Pathfinder.absPathInSrcFolder('/models/meta/ontology.js')).Ontology;
const Interaction = require(Pathfinder.absPathInSrcFolder('/models/recommendation/interaction.js')).Interaction;
const Descriptor = require(Pathfinder.absPathInSrcFolder('/models/meta/descriptor.js')).Descriptor;
const ArchivedResource = require(Pathfinder.absPathInSrcFolder('/models/versions/archived_resource')).ArchivedResource;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const util = require('util');
const async = require('async');
const _ = require('underscore');

function Project (object)
{
    const self = this;
    self.addURIAndRDFType(object, 'project', Project);
    Project.baseConstructor.call(this, object);

    if (isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + '/project/' + self.ddr.handle;
    }

    if (isNull(object.ddr.hasStorageLimit))
    {
        self.ddr.hasStorageLimit = Config.maxProjectSize;
    }

    if (isNull(object.ddr.requiresVerifiedUploads))
    {
        self.ddr.requiresVerifiedUploads = false;
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
                console.log('Started backup of project ' + self.uri);
                Folder.findByUri(self.ddr.rootFolder, function (err, folder)
                {
                    if (isNull(err) && folder instanceof Folder)
                    {
                        const bagItOptions = {
                            cryptoMethod: 'sha256',
                            sourceOrganization: (self.dcterms.publisher) ? self.dcterms.publisher : 'No publisher specified',
                            organizationAddress: (self.schema.address) ? self.schema.address : 'No contact physical address specified',
                            contactName: (self.schema.provider) ? self.schema.provider : 'No contact name specified',
                            contactPhone: (self.schema.telephone) ? self.schema.telephone : 'No contact phone specified',
                            contactEmail: (self.schema.email) ? self.schema.email : 'No contact email specified',
                            externalDescription: (self.dcterms.description) ? self.dcterms.description : 'No project description specified'
                        };

                        folder.bagit(
                            bagItOptions,
                            function (err, result, absolutePathOfFinishedFolder, parentFolderPath)
                            {
                                if (isNull(err))
                                {
                                    const path = require('path');

                                    const finishedZipFileName = 'bagit_backup.zip';
                                    const finishedZipFileAbsPath = path.join(parentFolderPath, finishedZipFileName);

                                    Folder.zip(absolutePathOfFinishedFolder, finishedZipFileAbsPath, function (err, zipFileFullPath)
                                    {
                                        return callback(err, zipFileFullPath, parentFolderPath);
                                    }, finishedZipFileName, true);
                                }
                                else
                                {
                                    return callback(1, 'Unable to zip folder at ' + finalBagItOptions.bagName + ' \n ' + finalBagItOptions);
                                }
                            }
                        );
                    }
                    else
                    {
                        return callback(1, 'Folder with ' + self.ddr.rootFolder + ' does not exist: ' + folder);
                    }
                });
            }
            else
            {
                return callback(1, 'Project : ' + self.uri + ' has no root folder.');
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
            return callback('error fetching project information : ' + err, projectsToReturn);
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
        'SELECT * ' +
        'FROM [0] ' +
        'WHERE ' +
        '{ ' +
        ' ?uri rdf:type ddr:Project ' +
        ' FILTER NOT EXISTS {' +
        '    ?uri ddr:privacyStatus [1] ' +
        '   } ' +
        '} ';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.string,
                value: 'private'
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
        'SELECT DISTINCT(?uri) \n' +
        'FROM [0] \n' +
        'WHERE \n' +
        '{ \n' +
        '    {  \n' +
        '        ?uri rdf:type ddr:Project \n' +
        '        FILTER NOT EXISTS { \n' +
        '           ?uri ddr:privacyStatus [1] \n' +
        '        }\n' +
        '    }\n' +
        '    UNION \n' +
        '    {\n' +
        '        ?uri rdf:type ddr:Project .\n' +
        '        ?uri dcterms:creator  [2]\n' +
        '    }\n' +
        '    UNION\n' +
        '    {\n' +
        '        ?uri rdf:type ddr:Project .\n' +
        '        ?uri dcterms:contributor  [2]\n' +
        '    }\n' +
        '}\n';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.string,
                value: 'private'
            },
            {
                type: Elements.types.resourceNoEscape,
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
        'SELECT ?uri \n' +
        'FROM [0] ' +
        'WHERE ' +
        '{ ' +
        ' ?uri rdf:type ddr:Project. ' +
        ' ?uri ddr:handle [1] ' +
        '} ';

    db.connection.executeViaJDBC(query,
        [

            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.string,
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
                        console.log('Duplicate projects found!! Project handle : ' + handle);
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
        'SELECT * \n' +
        'FROM [0] \n' +
        'WHERE \n' +
        '{ \n' +
        '   { \n' +
        '       [1] dcterms:contributor ?uri .\n' +
        '       OPTIONAL { ?uri ddr:username ?username . }\n' +
        '       OPTIONAL { ?uri foaf:mbox ?email . }\n' +
        '       OPTIONAL { ?uri foaf:firstName ?firstname . }\n' +
        '       OPTIONAL { ?uri foaf:surname ?surname . }\n' +
        '   } \n' +
        '   UNION ' +
        '   { ' +
        '       [1] dcterms:creator ?uri .\n' +
        '       OPTIONAL { ?uri ddr:username ?username . }\n' +
        '       OPTIONAL { ?uri foaf:mbox ?email . }\n' +
        '       OPTIONAL { ?uri foaf:firstName ?firstname . }\n' +
        '       OPTIONAL { ?uri foaf:surname ?surname . }\n' +
        '   } \n' +
        '} \n';

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
        'SELECT * ' +
        'FROM [0] ' +
        'WHERE ' +
        '{ ' +
        ' ?uri ddr:handle ?handle . ' +
        ' ?uri dcterms:contributor [1] .' +
        ' ?uri dcterms:title ?title .' +
        ' ?uri dcterms:description ?description . ' +
        ' ?uri dcterms:subject ?subject . ' +
        '} ';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
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
        'SELECT * ' +
        'FROM [0] ' +
        'WHERE ' +
        '{ ' +
        ' ?uri rdf:type ddr:Project . ' +
        ' ?uri ddr:handle ?handle . ' +
        ' ?uri dcterms:creator [1] .' +
        ' ?uri dcterms:title ?title .' +
        ' ?uri dcterms:description ?description . ' +
        ' ?uri dcterms:subject ?subject . ' +
        '} ';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
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
        'SELECT ?uri \n' +
        'FROM [0] \n' +
        'WHERE { \n' +
        '{ \n' +
        ' ?uri rdf:type ddr:Project . ' +
        ' ?uri dcterms:creator [1] \n' +
        '} \n' +
        ' UNION \n' +
        '{ \n' +
        ' ?uri rdf:type ddr:Project . ' +
        ' ?uri dcterms:contributor [1] \n' +
        '} \n' +
        '} \n';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
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
                    ddr:
          {
              humanReadableURI: newProject.ddr.humanReadableURI + '/data'
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
                            return callback(err, result);
                        });
                    }
                    else
                    {
                        console.error('There was an error saving the root folder of project ' + newProject.ddr.humanReadableURI + ': ' + JSON.stringify(result));
                        return callback(err, result);
                    }
                });
            }
            else
            {
                return callback(1, 'Statement executed but result was not what was expected. ' + result);
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
        'SELECT ?uri \n' +
        'FROM [0] \n' +
        'WHERE { \n' +
        ' { \n' +
        '       [1] rdf:type ddr:Project . \n' +
        '       ?uri dcterms:creator [2] \n' +
        '   } \n' +
        '   UNION \n' +
        '   { \n' +
        '       [1] rdf:type ddr:Project . \n' +
        '       ?uri dcterms:contributor [2] \n' +
        '   } \n' +
        '} \n';

    db.connection.executeViaJDBC(query,
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
                type: Elements.types.resource,
                value: userUri
            }
        ],
        function (err, properties)
        {
            if (!isNull(err))
            {
                const errorMsg = '[Error] When checking if a user is a contributor or creator of a project: ' + JSON.stringify(properties);
                console.error(errorMsg);
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
                    return callback(1, 'Error fetching children of project root folder');
                });
            }
            else
            {
                return callback(1, 'unable to retrieve project ' + self.ddr.handle + " 's root folder. Error :" + err);
            }
        }
        else
        {
            return callback(1, 'unable to retrieve project ' + self.ddr.handle + " 's root folder's contents. Error :" + err);
        }
    });
};

Project.prototype.getProjectWideFolderFileCreationEvents = function (callback)
{
    const self = this;
    console.log('In getProjectWideFolderFileCreationEvents');
    console.log('the projectUri is:');
    // <http://127.0.0.1:3001/project/testproject3/data>
    // var projectData = projectUri + '/data'; //TODO this is probably wrong
    const projectData = self.uri + '/data'; // TODO this is probably wrong
    /* WITH <http://127.0.0.1:3001/dendro_graph>
     SELECT ?dataUri
     WHERE {
     ?dataUri ddr:modified ?date.
     <http://127.0.0.1:3001/project/testproject3/data> <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#hasLogicalPart> ?dataUri.
     }
     ORDER BY DESC(?date)
     OFFSET 0
     LIMIT 5 */

    // TODO test query first

    const query =
        'WITH [0] \n' +
        'SELECT ?dataUri \n' +
        'WHERE { \n' +
        '?dataUri ddr:modified ?date. \n' +
        '[1] nie:hasLogicalPart ?dataUri. \n' +
        '} \n' +
        'ORDER BY DESC(?date) \n';

    // query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resourceNoEscape,
                value: projectData
            }/*,
            {
                type : Elements.types.date,
                value: createdAfterDate
            } */
        ]), //, startingResultPosition, maxResults),
        function (err, itemsUri)
        {
            if (isNull(err))
            {
                console.log('itemsUri: ', itemsUri);

                async.mapSeries(itemsUri, function (itemUri, cb1)
                {
                    Resource.findByUri(itemUri.dataUri, function (error, item)
                    {
                        console.log(item);
                        // item.get
                        // TODO get author
                    });
                }, function (err, fullItems)
                {
                    if (isNull(err))
                    {
                        return callback(null, fullItems);
                    }
                    const msg = 'Error fetching file/folders creation info for project:' + self.uri;
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
                const msg = 'Error fetching file/folder change data';
                console.log(msg);
                return callback(1, msg);
            }
        });
};

Project.prototype.getRecentProjectWideChangesSocial = function (callback, startingResultPosition, maxResults, createdAfterDate)
{
    const self = this;
    console.log('createdAfterDate:', createdAfterDate);
    console.log('startingResultPosition: ', startingResultPosition);
    console.log('maxResults: ', maxResults);

    let query =
        'WITH [0] \n' +
        'SELECT ?version \n' +
        'WHERE { \n' +
        '?version ddr:created ?date. \n' +
        'filter ( \n' +
        'xsd:dateTime(?date) >= [2]' + '^^xsd:dateTime' + ' ). \n' +
        '?version rdf:type ddr:ArchivedResource . \n' +
        ' filter ( \n' +
        'STRSTARTS(STR(?version), [1]) \n' +
        ' ) \n' +
        '} \n' +
        'ORDER BY DESC(?date) \n';

    query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.executeViaJDBC(query,
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
                return callback(1, 'Error fetching children of project root folder');
            }
        });
};

Project.prototype.getRecentProjectWideChanges = function (callback, startingResultPosition, maxResults)
{
    const self = this;

    let query =
        'WITH [0]\n' +
        'SELECT ?version\n' +
        'WHERE {\n' +
        '   ?version ddr:created ?date.\n' +
        '   ?version rdf:type ddr:ArchivedResource .\n' +
        '   ?version ddr:isVersionOf ?resource.\n' +
        '   ?resource nie:isLogicalPartOf+ ?parent.\n' +
        '   [1] ddr:rootFolder ?parent.\n' +
        '}\n' +
        'ORDER BY DESC(?date)\n';

    query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.executeViaJDBC(query,
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
                return callback(1, 'Error fetching children of project root folder');
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
        collectionName = 'fs.files';
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
                    $match: {'metadata.project.uri': self.uri}
                },
                {
                    $group:
          {
              _id: null,
              sum: {
                  $sum: '$length'
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
                console.error('* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : ' + JSON.stringify(err) + JSON.stringify(result));
                return callback(1, 'Error retrieving project size : ' + JSON.stringify(err) + JSON.stringify(result));
            });
        }
        else
        {
            console.error('* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : ' + JSON.stringify(err) + JSON.stringify(collection));
            return callback(1, 'Error retrieving files collection : ' + collection);
        }
    });
};

Project.prototype.getFilesCount = function (callback)
{
    const self = this;

    const query =
        'SELECT COUNT(?file) as ?file_count \n' +
        'FROM [0] \n' +
        'WHERE ' +
        '{ \n' +
        '   { \n' +
        '       ?file rdf:type nfo:FileDataObject . \n' +
        '       ?file nie:isLogicalPartOf+ [1] . \n' +
    '           FILTER EXISTS { \n' +
        '           [1] rdf:type ddr:Project \n' +
        '       }\n' +
        '       FILTER NOT EXISTS { \n' +
        '           ?file ddr:isVersionOf ?some_resource .\n' +
        '       } \n' +
        '   } \n' +
        '} \n';

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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].file_count);
                }
                return callback(1, 'invalid result retrieved when querying for project file count');
            }
            return callback(err, -1);
        });
};

Project.prototype.getMembersCount = function (callback)
{
    const self = this;

    const query =
        'SELECT COUNT(?contributor) as ?contributor_count \n' +
        'FROM [0] \n' +
        'WHERE ' +
        '{ \n' +
        '{ \n' +
        '   [1] rdf:type ddr:Project . \n' +
        '   [1] dcterms:contributor ?contributor. \n' +
        '} \n' +
        ' UNION \n' +
        '{ \n' +
        '   [1] rdf:type ddr:Project . \n' +
        '   [1] dcterms:creator ?contributor. \n' +
        '} \n' +
        '} \n';

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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].contributor_count);
                }
                return callback(1, 'invalid result retrieved when querying for project contributor count');
            }
            return callback(err, -1);
        });
};

Project.prototype.getFoldersCount = function (callback)
{
    const self = this;

    const query =
        'SELECT COUNT(?folder) as ?folder_count \n' +
        'FROM [0] \n' +
        'WHERE ' +
        '{ \n' +
        '   { \n' +
        '       ?folder rdf:type nfo:Folder . \n' +
        '       ?folder nie:isLogicalPartOf+ [1] . \n' +
        '       FILTER EXISTS { \n' +
        '           [1] rdf:type ddr:Project \n' +
        '       }\n' +
        '       FILTER NOT EXISTS ' +
        '       { \n' +
        '           ?folder ddr:isVersionOf ?some_resource .\n' +
        '       } \n' +
        '   } \n' +
        '} \n';

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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].folder_count);
                }
                return callback(1, 'invalid result retrieved when querying for project folder count');
            }
            return callback(err, -1);
        });
};

Project.prototype.getRevisionsCount = function (callback)
{
    const self = this;

    const query =
        'SELECT COUNT(?revision) as ?revision_count \n' +
        'FROM [0] \n' +
        'WHERE ' +
        '{ \n' +
        '   { \n' +
        '       ?revision ddr:isVersionOf ?resource . \n' +
        '       ?resource nie:isLogicalPartOf+ [1] . \n' +
    '           FILTER EXISTS { \n' +
        '           ?resource rdf:type ddr:Project \n' +
        '       }\n' +
        '   } \n' +
        '} \n';

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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length > 0)
                {
                    return callback(null, result[0].revision_count);
                }
                return callback(1, 'invalid result retrieved when querying for revisions count');
            }
            return callback(err, -1);
        });
};

Project.prototype.getFavoriteDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;

    let argumentsArray = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.types.stringNoEscape,
            value: self.uri
        },
        {
            type: Elements.types.string,
            value: Interaction.types.favorite_descriptor_from_quick_list_for_project.key
        },
        {
            type: Elements.types.string,
            value: Interaction.types.unfavorite_descriptor_from_quick_list_for_project.key
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    let fromString = '';

    const fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, 'favorited_descriptor');

    const query =
    '       SELECT ?favorited_descriptor as ?descriptor ?label ?comment ?last_favorited ?last_unfavorited \n' +
    fromString + '\n' +
    '		WHERE \n' +
    '		{ \n' +
    '			?favorited_descriptor rdfs:label ?label.  \n' +
    '			?favorited_descriptor rdfs:comment ?comment.  \n' +
    '			FILTER(    (str(?label) != "") && ( str(?comment) != "") ).  \n' +
    '			FILTER(   lang(?label) = "" || lang(?label) = "en") .  \n' +
    '			FILTER(   lang(?comment) = "" || lang(?comment) = "en")   \n' +
    filterString + '\n' +
    '			{ \n' +
    '				SELECT ?favorited_descriptor MAX(?date_favorited) as ?last_favorited \n' +
    '				FROM [0]  \n' +
    '				WHERE  \n' +
    '				{  \n' +
    '				   	?favorite_interaction ddr:executedOver ?favorited_descriptor. \n' +
    '				   	?favorite_interaction ddr:interactionType [2] . \n' +
    '					?favorite_interaction ddr:originallyRecommendedFor ?information_element. \n' +
    '				   	?favorite_interaction ddr:created ?date_favorited. \n' +
    '				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n' +
    '				} \n' +
    '			}. \n' +
    '			OPTIONAL ' +
    '           { \n' +
    '				SELECT ?favorited_descriptor MAX(?date_unfavorited) as ?last_unfavorited \n' +
    '				FROM [0]  \n' +
    '				WHERE  \n' +
    '				{  \n' +
    '				   	?unfavorite_interaction ddr:executedOver ?favorited_descriptor. \n' +
    '				   	?unfavorite_interaction ddr:interactionType [3]. \n' +

    '				   	?unfavorite_interaction ddr:originallyRecommendedFor ?information_element. \n' +
    '				   	?unfavorite_interaction ddr:created ?date_unfavorited. \n' +
    '				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n' +
    '				} \n' +
    '			} \n' +
    '		   	FILTER' +
    '           ( \n' +
    '		   	    ( \n' +
    '		   	        bound(?last_unfavorited) && (?last_favorited > ?last_unfavorited)\n' +
    '		   	    ) \n' +
    '		   	    || \n' +
    '		   	    ( \n' +
    '                   !bound(?last_unfavorited)\n' +
    '		   	    ) \n' +
    '		   	) \n' +
    '		} \n';

    db.connection.executeViaJDBC(
        query,
        argumentsArray,
        function (err, descriptors)
        {
            if (isNull(err))
            {
                if (descriptors instanceof Array)
                {
                    const fullDescriptors = [];
                    for (let i = 0; i < descriptors.length; i++)
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
                return callback(1, "invalid result retrieved when querying for project's favorite descriptors");
            }
            return callback(err, -1);
        });
};

Project.prototype.getHiddenDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;

    let argumentsArray = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.types.stringNoEscape,
            value: self.uri
        },
        {
            type: Elements.types.string,
            value: Interaction.types.hide_descriptor_from_quick_list_for_project.key
        },
        {
            type: Elements.types.string,
            value: Interaction.types.unhide_descriptor_from_quick_list_for_project.key
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    let fromString = '';

    const fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, 'hidden_descriptor');

    const query =
        '		SELECT ?hidden_descriptor as ?descriptor ?label ?comment ?last_hidden ?last_unhidden \n' +
        fromString + '\n' +
        '		WHERE \n' +
        '		{ \n' +
        '			?hidden_descriptor rdfs:label ?label.  \n' +
        '			?hidden_descriptor rdfs:comment ?comment.  \n' +
        '			FILTER(    (str(?label) != "") && ( str(?comment) != "") ).  \n' +
        '			FILTER(   lang(?label) = "" || lang(?label) = "en") .  \n' +
        '			FILTER(   lang(?comment) = "" || lang(?comment) = "en")   \n' +
        filterString + '\n' +
        '			{ \n' +
        '				SELECT ?hidden_descriptor MAX(?date_hidden) as ?last_hidden \n' +
        '				FROM [0]  \n' +
        '				WHERE  \n' +
        '				{  \n' +
        '				   	?hiding_interaction ddr:executedOver ?hidden_descriptor. \n' +
        '				   	?hiding_interaction ddr:interactionType [2] . \n' +

        '					?hiding_interaction ddr:originallyRecommendedFor ?information_element. \n' +
        '				   	?hiding_interaction ddr:created ?date_hidden. \n' +
        '				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n' +
        '				} \n' +
        '			}. \n' +
        '			OPTIONAL' +
        '           { \n' +
        '				SELECT ?hidden_descriptor MAX(?date_unhidden) as ?last_unhidden \n' +
        '				FROM [0]  \n' +
        '				WHERE  \n' +
        '				{  \n' +
        '				   	?unhiding_interaction ddr:executedOver ?hidden_descriptor. \n' +
        '				   	?unhiding_interaction ddr:interactionType [3]. \n' +

        '				   	?unhiding_interaction ddr:originallyRecommendedFor ?information_element. \n' +
        '				   	?unhiding_interaction ddr:created ?date_unhidden. \n' +
        '				    FILTER( STRSTARTS(STR(?information_element), [1] ) ) \n' +
        '				} \n' +
        '			} \n' +
        '		   	FILTER' +
        '           ( \n' +
        '		   	    ( \n' +
        '		   	        bound(?last_unhidden) && (?last_hidden > ?last_unhidden)\n' +
        '		   	    ) \n' +
        '		   	    || \n' +
        '		   	    ( \n' +
        '                   !bound(?last_unhidden)\n' +
        '		   	    ) \n' +
        '		   	) \n' +
        '		} \n';

    db.connection.executeViaJDBC(
        query,
        argumentsArray,
        function (err, descriptors)
        {
            if (isNull(err))
            {
                if (descriptors instanceof Array)
                {
                    const fullDescriptors = [];
                    for (let i = 0; i < descriptors.length; i++)
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
                return callback(1, "invalid result retrieved when querying for project's favorite descriptors");
            }
            return callback(err, -1);
        });
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
        return callback(1, 'Error occurred fetching the privacy status of project ' + projectUri + '. Error : ' + project);
    });
};

Project.validateBagItFolderStructure = function (absPathOfBagItFolder, callback)
{
    const fs = require('fs');
    const path = require('path');

    fs.stat(absPathOfBagItFolder, function (err, stat)
    {
        if (isNull(err))
        {
            if (stat.isDirectory())
            {
                const dataFolder = path.join(absPathOfBagItFolder, 'data');
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
                                                            return callback(null, false, 'There is no ' + Config.packageMetadataFileName + ' inside the /data subdirectory.');
                                                        }
                                                        return callback(err, false, 'child of /data contains only one element but is not a directory.');
                                                    });
                                                }
                                                else
                                                {
                                                    return callback(null, false, 'child of /data contains only one element but is not a directory.');
                                                }
                                            }
                                            else
                                            {
                                                return callback(err, false, '/data contains only one element but is not a directory.');
                                            }
                                        });
                                    }
                                    else
                                    {
                                        return callback(null, false, '/data folder should contain exactly one directory.');
                                    }
                                }
                                else
                                {
                                    return callback(err, false, '/data exists but is not a directory.');
                                }
                            });
                        }
                        else
                        {
                            return callback(null, false, '/data exists but is not a directory.');
                        }
                    }
                    else if (err.code === 'ENOENT')
                    {
                        return callback(null, false, '/data subfolder does not exist.');
                    }
                });
            }
            else
            {
                return callback(null, false, absPathOfBagItFolder + ' is not a directory');
            }
        }
        else if (err.code === 'ENOENT')
        {
            return callback(null, false);
        }
    });
};

Project.unzipAndValidateBagItBackupStructure = function (absPathToZipFile, maxStorageSize, callback)
{
    const path = require('path');

    File.estimateUnzippedSize(absPathToZipFile, function (err, size)
    {
        if (isNull(err))
        {
            if (!isNaN(size))
            {
                if (size < maxStorageSize)
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
                                    return callback(500, 'Invalid Bagit structure. Are you sure this is a Dendro project backup? Error reported: ' + pathToFolderToRestore);
                                }
                                return callback(err, pathToFolderToRestore);
                            });
                        }
                        else
                        {
                            const msg = 'Unable to unzip file ' + absPathToZipFile + '. Error reported: ' + absPathToZipFile;
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

                    const msg = 'Estimated storage size of the project after unzipping ( ' + humanZipFileSize + ' ) exceeds the maximum storage allowed for a project ( ' + humanMaxStorageSize + ' ) by ' + humanSizeDifference;
                    return callback(err, msg);
                }
            }
            else
            {
                return callback(1, 'Unable to determine the size of the ZIP File, because the file was corrupted during transfer!');
            }
        }
        else
        {
            const msg = 'Unable to estimate size of the zip file sent in as the project backup. Error reported: ' + absPathToZipFile;
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
    const path = require('path');
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
                    const fs = require('fs');

                    fs.exists(metadataFileLocation, function (existsMetadataFile)
                    {
                        if (attemptToRestoreMetadata && existsMetadataFile)
                        {
                            fs.readFile(metadataFileLocation, 'utf8', function (err, data)
                            {
                                if (err)
                                {
                                    console.log('Error: ' + err);
                                    return;
                                }

                                const node = JSON.parse(data);

                                rootFolder.loadMetadata(node, function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(null, 'Data and metadata restored successfully. Result : ' + result);
                                    }
                                    return callback(err, 'Error restoring metadata for project ' + self.uri + ' : ' + result);
                                }, entityLoadingTheMetadataUri, [Elements.access_types.locked], [Elements.access_types.restorable]);
                            });
                        }
                        else
                        {
                            return callback(null, 'Since no metadata.json file was found at the root of the zip file, no metadata was restored. Result : ' + result);
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
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === 'string') ? customGraphUri : db.graphUri;
    const pageSize = Config.limits.db.maxResults;
    let currentPage = 0;
    let currentResults = [];

    const findMoreMembersOfProject = function (callback)
    {
        let findQuery =
            'SELECT ?part \n' +
            'FROM [0] \n' +
            'WHERE \n' +
            '{ \n' +
            '   [1] nie:hasLogicalPart* ?part \n' +
            '} \n';

        findQuery = DbConnection.addLimitsClauses(findQuery, pageSize * currentPage, pageSize);

        db.connection.executeViaJDBC(findQuery,
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

Project.prototype.delete = function (callback)
{
    const self = this;

    const deleteProjectTriples = function (callback)
    {
        const deleteQuery =
            'WITH [0] \n' +
            'DELETE \n' +
            '{\n' +
            '    ?resource ?p ?o \n' +
            '} \n' +
            'WHERE \n' +
            '{ \n' +
            '   SELECT ?resource ?p ?o \n' +
            '   WHERE \n' +
            '   { \n' +
            '    [1] nie:hasLogicalPart* ?resource .\n' +
            '    ?resource ?p ?o \n' +
            '   } \n' +
            '} \n';

        db.connection.executeViaJDBC(deleteQuery,
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
            function (err, result)
            {
                callback(err, result);
            }
        );
    };

    const deleteProjectFiles = function (callback)
    {
        gfs.connection.deleteByQuery({ 'metadata.project.uri': self.uri}, function (err, result)
        {
            callback(err, result);
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
        deleteProjectTriples
    ], function (err, results)
    {
        callback(err, results);
    });
};

Project = Class.extend(Project, Resource, 'ddr:Project');

module.exports.Project = Project;
