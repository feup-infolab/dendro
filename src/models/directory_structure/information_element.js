// complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require('path');
const async = require('async');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Class = require(Pathfinder.absPathInSrcFolder('/models/meta/class.js')).Class;
const DbConnection = require(Pathfinder.absPathInSrcFolder('/kb/db.js')).DbConnection;
const Cache = require(Pathfinder.absPathInSrcFolder('/kb/cache/cache.js')).Cache;
const Resource = require(Pathfinder.absPathInSrcFolder('/models/resource.js')).Resource;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;

const db = Config.getDBByID();

function InformationElement (object)
{
    const self = this;
    self.addURIAndRDFType(object, 'information_element', InformationElement);
    InformationElement.baseConstructor.call(this, object);

    if (!isNull(object.nie))
    {
        if (!isNull(object.nie.isLogicalPartOf))
        {
            self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        }

        if (!isNull(object.nie.title))
        {
            self.nie.title = object.nie.title;
        }

        if (isNull(self.ddr.humanReadableURI))
        {
            self.ddr.humanReadableURI = object.nie.isLogicalPartOf + '/' + object.nie.title;
        }
    }

    return self;
}

InformationElement.prototype.getParent = function (callback)
{
    const self = this;

    const query =
        'SELECT ?parent_folder ?parent_project \n' +
        'FROM [0] \n' +
        'WHERE \n' +
        '{ \n' +
        ' { \n' +
        '[1] nie:isLogicalPartOf ?parent_folder. \n' +
        ' ?parent_folder rdf:type nfo:Folder. \n' +
        ' } \n' +
        ' UNION ' +
        ' { ' +
        '[1] nie:isLogicalPartOf ?parent_project. \n' +
        ' ?parent_project rdf:type ddr:Project. \n' +
        ' } \n' +
        '} ';

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
        function (err, results)
        {
            if (isNull(err))
            {
                if (results instanceof Array)
                {
                    if (results.length === 1)
                    {
                        const result = results[0];
                        if (!isNull(results[0].parent_folder))
                        {
                            result.uri = result.parent_folder;
                            const Folder = require(Pathfinder.absPathInSrcFolder('/models/directory_structure/folder.js')).Folder;
                            let parent = new Folder(result);
                            return callback(null, parent);
                        }
                        else if (!isNull(result[0].parent_project))
                        {
                            result.uri = result.parent_project;
                            const Project = require(Pathfinder.absPathInSrcFolder('/models/project.js')).Project;
                            let parent = new Project(result);
                            return callback(null, parent);
                        }

                        return callback(1, 'There was an error calculating the parent of resource ' + self.uri);
                    }
                    else if (results.length === 0)
                    {
                        return callback(null, 'There is no parent of ' + self.uri);
                    }

                    return callback(1, 'ERROR : There is more than one parent to ' + self.uri + ' !');
                }

                return callback(1, 'Invalid result set or no parent found when querying for the parent of' + self.uri);
            }

            return callback(1, 'Error reported when querying for the parent of' + self.uri + ' . Error was ->' + results);
        }
    );
};

InformationElement.prototype.getAllParentsUntilProject = function (callback)
{
    const self = this;

    /**
     *   Note the PLUS sign (+) on the nie:isLogicalPartOf+ of the query below.
     *    (Recursive querying through inference).
     *   @type {string}
     */
    const query =
        'SELECT ?uri \n' +
        'FROM [0] \n' +
        'WHERE \n' +
        '{ \n' +
        '   [1] nie:isLogicalPartOf+ ?uri. \n' +
        '   ?uri rdf:type ddr:Resource. \n' +
        '   ?uri rdf:type nfo:Folder \n' +
        '   FILTER NOT EXISTS \n' +
        '   { \n' +
        '       ?project ddr:rootFolder ?uri\n' +
        '   }\n' +
        '}\n ';

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
                if (result instanceof Array)
                {
                    const async = require('async');
                    const Folder = require(Pathfinder.absPathInSrcFolder('/models/directory_structure/folder.js')).Folder;
                    async.mapSeries(result, function (result, callback)
                    {
                        Folder.findByUri(result.uri, function (err, parentFolder)
                        {
                            return callback(err, parentFolder);
                        });
                    }, callback);
                }
                else
                {
                    return callback(1, 'Invalid result set or no parent PROJECT found when querying for the parent project of' + self.uri);
                }
            }
            else
            {
                return callback(1, 'Error reported when querying for the parent PROJECT of' + self.uri + ' . Error was ->' + result);
            }
        }
    );
};

InformationElement.prototype.getOwnerProject = function (callback)
{
    const self = this;

    /**
    *   Note the sign (*) on the nie:isLogicalPartOf* of the query below.
    *    (Recursive querying through inference).
    *   @type {string}
    */
    const query =
        'SELECT ?uri \n' +
        'FROM [0] \n' +
        'WHERE \n' +
        '{ \n' +
        '   [1] nie:isLogicalPartOf+ ?uri \n' +
        '   FILTER EXISTS { \n' +
        '       ?uri rdf:type ddr:Project \n' +
        '   }\n' +
        '} ';

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
                if (result instanceof Array && result.length === 1)
                {
                    const Project = require(Pathfinder.absPathInSrcFolder('/models/project.js')).Project;
                    Project.findByUri(result[0].uri, function (err, project)
                    {
                        callback(err, project);
                    });
                }
                else
                {
                    return callback(1, 'Invalid result set or no parent PROJECT found when querying for the parent project of' + self.uri);
                }
            }
            else
            {
                return callback(1, 'Error reported when querying for the parent PROJECT of' + self.uri + ' . Error was ->' + result);
            }
        }
    );
};

InformationElement.prototype.rename = function (newTitle, callback)
{
    const self = this;

    const query =
        'DELETE DATA \n' +
        '{ \n' +
        'GRAPH [0] \n' +
        '   { \n' +
        '       [1] nie:title ?title . ' +
        '   } \n' +
        '}; \n' +

        'INSERT DATA \n' +
        '{ \n' +
        '   GRAPH [0] \n' +
        '   { ' +
        '       [1] nie:title [2] \n' +
        '   } \n' +
        '}; \n';

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
                type: Elements.types.string,
                value: newTitle
            }
        ],
        function (err, result)
        {
            Cache.getByGraphUri(db.graphUri).delete(self.uri, function (err, result)
            {
                return callback(err, result);
            });
        }
    );
};

InformationElement.prototype.moveToFolder = function (newParentFolder, callback)
{
    const self = this;

    const oldParent = self.nie.isLogicalPartOf;
    const newParent = newParentFolder.uri;

    // "WITH GRAPH [0] \n" +
    // "DELETE \n" +
    // "{ \n" +
    // deleteString + " \n" +
    // "} \n" +
    // "WHERE \n" +
    // "{ \n" +
    // deleteString + " \n" +
    // "} \n" +
    // "INSERT DATA\n" +
    // "{ \n" +
    // insertString + " \n" +
    // "} \n";

    const query =
        'WITH GRAPH [0] \n' +
        'DELETE \n' +
        '{ \n' +
        '   [1] nie:hasLogicalPart [2]. \n' +
        '   [2] nie:isLogicalPartOf [1] \n' +
        '} \n' +
        'INSERT \n' +
        '{ \n' +
        '   [3] nie:hasLogicalPart [2]. \n' +
        '   [2] nie:isLogicalPartOf [3] \n' +
        '} \n';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
                value: oldParent
            },
            {
                type: Elements.types.resource,
                value: self.uri
            },
            {
                type: Elements.types.resource,
                value: newParent
            }
        ],
        function (err, result)
        {
            if (isNull(err))
            {
                // invalidate caches on parent, old parent and child...
                async.series([
                    function (callback)
                    {
                        Cache.getByGraphUri(db.graphUri).delete(self.uri, callback);
                    },
                    function (callback)
                    {
                        Cache.getByGraphUri(db.graphUri).delete(newParent, callback);
                    },
                    function (callback)
                    {
                        Cache.getByGraphUri(db.graphUri).delete(oldParent, callback);
                    }
                ], function (err)
                {
                    return callback(err, result);
                });
            }
            else
            {
                return callback(err, result);
            }
        }, null, null, null, true);
};

InformationElement.prototype.unlinkFromParent = function (callback)
{
    const self = this;
    self.getParent(function (err, parent)
    {
        if (isNull(err))
        {
            if (parent instanceof Object && !isNull(parent.nie))
            {
                let parentParts = parent.nie.hasLogicalPart;

                // remove myself from parent.
                if (parentParts instanceof Array)
                {
                    parentParts = _.without(parentParts, [self.uri]);
                }
                else
                {
                    if (parentParts === self.uri)
                    {
                        parentParts = null;
                    }
                }

                parent.nie.hasLogicalPart = parentParts;

                // Save modified parts, now with myself removed from them.
                parent.save(function (err, result)
                {
                    return callback(err, result);
                });
            }
            else
            {
                return callback(null, self.uri + ' already has no parent.');
            }
        }
        else
        {
            return callback(1, 'Unable to retrieve the parent of ' + self.uri + ' for unlinking it. Error reported by database : ' + parent);
        }
    });
};

InformationElement.prototype.isHiddenOrSystem = function ()
{
    const self = this;

    if (isNull(self.nie) || isNull(self.nie.title))
    {
        return false;
    }

    for (let i = 0; i < Config.systemOrHiddenFilesRegexes.length; i++)
    {
        const regex = new RegExp(Config.systemOrHiddenFilesRegexes[i]);

        if (self.nie.title.match(regex))
        {
            return true;
        }
    }

    return false;
};

InformationElement.removeInvalidFileNames = function (fileNamesArray)
{
    const _ = require('underscore');

    const validFiles = [];

    _.each(fileNamesArray, function (fileName)
    {
        const ie = new InformationElement({
            nie: {
                title: fileName
            }
        });

        if (!ie.isHiddenOrSystem())
        {
            validFiles.push(fileName);
        }
    });

    return validFiles;
};

InformationElement.isSafePath = function (absPath, callback)
{
    let fs = require('fs');
    fs.realpath(absPath, function (err, realPath)
    {
        function b_in_a (b, a)
        {
            return (b.indexOf(a) === 0);
        }

        const validDirs = [Config.tempFilesDir, Config.tempUploadsDir];

        for (let i = 0; i < validDirs.length; i++)
        {
            if (b_in_a(realPath, validDirs[i]))
            {
                return callback(null, true);
            }
        }

        console.error('Path ' + absPath + " is not within safe paths!! Some operation is trying to modify files outside of Dendro's installation directory!");
        return callback(null, false);
    });
};

InformationElement.prototype.findMetadata = function (callback, typeConfigsToRetain)
{
    const async = require('async');

    const self = this;
    InformationElement.findByUri(self.uri, function (err, resource)
    {
        if (isNull(err))
        {
            if (!isNull(resource))
            {
                const metadataResult = {
                    title: resource.nie.title,
                    descriptors: resource.getDescriptors([Elements.access_types.private], [Elements.access_types.api_readable], typeConfigsToRetain),
                    file_extension: resource.ddr.fileExtension,
                    hasLogicalParts: []
                };

                if (!isNull(resource.ddr) && !isNull(resource.ddr.metadataQuality))
                {
                    metadataResult.metadata_quality = resource.ddr.metadataQuality;
                }
                else
                {
                    metadataResult.metadata_quality = 0;
                }

                if (isNull(err))
                {
                    resource.getLogicalParts(function (err, children)
                    {
                        if (isNull(err))
                        {
                            const _ = require('underscore');
                            children = _.reject(children, function (child)
                            {
                                return child.ddr.deleted;
                            });

                            if (children.length > 0)
                            {
                                // 1st parameter in async.each() is the array of items
                                async.each(children,
                                    // 2nd parameter is the function that each item is passed into
                                    function (child, callback)
                                    {
                                        // Call an asynchronous function
                                        metadataResult.hasLogicalParts.push({
                                            title: child.nie.title
                                        });
                                        return callback(null);
                                    },
                                    // 3rd parameter is the function call when everything is done
                                    function (err)
                                    {
                                        if (isNull(err))
                                        {
                                            // All tasks are done now
                                            return callback(null, metadataResult);
                                        }

                                        return callback(true, null);
                                    }
                                );
                            }
                            else
                            {
                                return callback(null, metadataResult);
                            }
                        }
                        else
                        {
                            console.info('[findMetadataRecursive] error accessing logical parts of folder ' + resource.nie.title);
                            return callback(true, null);
                        }
                    });
                }
                else
                {
                    console.info('[findMetadataRecursive] ' + resource.nie.title + ' is not a folder.');
                    return callback(null, metadataResult);
                }
            }
            else
            {
                const msg = self.uri + ' does not exist in Dendro.';
                console.error(msg);

                return callback(true, msg);
            }
        }
        else
        {
            const msg = 'Error fetching ' + self.uri + ' from the Dendro platform.';
            console.error(msg);

            return callback(true, msg);
        }
    }, null, null, null, [Elements.access_types.private], [Elements.access_types.api_accessible]);
};

InformationElement.prototype.containedIn = function (parentResource, callback, customGraphUri)
{
    const self = this;

    if (parentResource.uri === self.uri)
    {
        callback(null, true);
    }
    else
    {
        const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === 'string') ? customGraphUri : db.graphUri;

        db.connection.executeViaJDBC(
            'WITH [0]\n' +
            'ASK \n' +
            'WHERE \n' +
            '{ \n' +
            '   {\n' +
            '       [2] nie:isLogicalPartOf+ [1]. \n' +
            '       [1] nie:hasLogicalPart+ [2]. \n' +
            '   }\n' +
            '} \n',

            [
                {
                    type: Elements.types.resourceNoEscape,
                    value: graphUri
                },
                {
                    type: Elements.types.resourceNoEscape,
                    value: parentResource.uri
                },
                {
                    type: Elements.types.resourceNoEscape,
                    value: self.uri
                }
            ],
            function (err, result)
            {
                if (isNull(err))
                {
                    if (result instanceof Array)
                    {
                        if (result.length === 0)
                        {
                            return callback(null, false);
                        }

                        return callback(null, true);
                    }

                    return callback(null, result);
                }

                const msg = 'Error checking if resource ' + self.uri + ' is contained in ' + anotherResourceUri;
                console.error(msg);
                return callback(err, msg);
            });
    }
};

InformationElement = Class.extend(InformationElement, Resource, 'nie:InformationElement');

module.exports.InformationElement = InformationElement;
