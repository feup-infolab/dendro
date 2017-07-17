//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const db = Config.getDBByID();

function InformationElement (object)
{
    InformationElement.baseConstructor.call(this, object, InformationElement);
    const self = this;

    if(isNull(self.uri))
    {
        const uuid = require('uuid');
        self.uri = "/r/information_element/" + uuid.v4();
    }
    
    if(!isNull(object.nie))
    {
        if(!isNull(object.nie.isLogicalPartOf))
        {
            self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        }

        if(!isNull(object.nie.title))
        {
            self.nie.title = object.nie.title;
        }

        if(isNull(self.ddr.humanReadableURI))
        {
            self.uri = object.nie.isLogicalPartOf + "/" + object.nie.title;
        }
    }

    return self;
}

InformationElement.getType = function(resourceURI, callback)
{
    const self = this;

    const query =
        "SELECT * " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " [1] rdf:type ?type . " +
        "} ";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type : DbConnection.resource,
                value: resourceURI
            }
        ],

        function(err, types) {
            if(isNull(err))
            {
                if(types instanceof Array)
                {
                    const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                    const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;

                    if(types.length === 0)
                    {
                        return callback(1,"Unable to retrieve Information Element's type, error 1");
                    }
                    else
                    {
                        //an information element can be a folder and a project simultaneously...?
                        //TODO not consistent, fix later

                        let hasCalledBack = false;

                        for(let i = 0; i < types.length; i++)
                        {
                            const type = types[i].type;

                            if(type === Folder.prefixedRDFType)
                            {
                                return callback(null, Folder);
                            }
                            else if(type === File.prefixedRDFType)
                            {
                                return callback(null, File);
                            }
                        }

                        if(!hasCalledBack)
                        {
                            return callback(1,"Unable to retrieve Information Element's type, error 2");
                        }
                    }
                }
                else
                {
                    return callback(1,"Unable to retrieve Information Element's type");
                }
            }
            else
            {
                return callback(err, types);
            }
        });
};

InformationElement.prototype.getParent = function(callback)
{
    const self = this;

    const query =
        "SELECT ?parent_folder ?parent_project \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        " { \n" +
        "[1] nie:isLogicalPartOf ?parent_folder. \n" +
        " ?parent_folder rdf:type nfo:Folder. \n" +
        " } \n" +
        " UNION " +
        " { " +
        "[1] nie:isLogicalPartOf ?parent_project. \n" +
        " ?parent_project rdf:type ddr:Project. \n" +
        " } \n" +
        "} ";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: self.uri
            }
        ],
        function(err, results) {
            if(isNull(err))
            {
                if(results instanceof Array)
                {
                    if(results.length === 1)
                    {
                        const result = results[0];
                        if(!isNull(results[0].parent_folder))
                        {
                            result.uri = result.parent_folder;
                            const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                            let parent = new Folder(result);
                            return callback(null,parent);
                        }
                        else if(!isNull(result[0].parent_project))
                        {
                            result.uri = result.parent_project;
                            const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
                            let parent = new Project(result);
                            return callback(null,parent);
                        }
                        else
                        {
                            return callback(1,"There was an error calculating the parent of resource " + self.uri);
                        }
                    }
                    else if(results.length === 0)
                    {
                        return callback(null, "There is no parent of " + self.uri);
                    }
                    else
                    {
                        return callback(1, "ERROR : There is more than one parent to " + self.uri + " !");
                    }
                }
                else
                {
                    return callback(1, "Invalid result set or no parent found when querying for the parent of" + self.uri);
                }
            }
            else
            {
                return callback(1, "Error reported when querying for the parent of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

InformationElement.prototype.getAllParentsUntilProject = function(callback)
{
    const self = this;

    /**
     *   Note the PLUS sign (+) on the nie:isLogicalPartOf+ of the query below.
     *    (Recursive querying through inference).
     *   @type {string}
     */
    const query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   [1] nie:isLogicalPartOf+ ?uri. \n" +
        "   ?uri rdf:type ddr:Resource. \n" +
        "   ?uri rdf:type nie:FileDataObject \n" +
        "} ";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: self.uri
            }
        ],
        function(err, result) {
            if(isNull(err))
            {
                if(result instanceof Array)
                {
                    const async = require('async');
                    const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                    async.map(result, function(result, callback){
                        Folder.findByUri(result.uri, function(err, parentFolder){
                            return callback(err,parentFolder);
                        });
                    }, callback);
                }
                else
                {
                    return callback(1, "Invalid result set or no parent PROJECT found when querying for the parent PROJECT of" + self.uri);
                }
            }
            else
            {
                return callback(1, "Error reported when querying for the parent PROJECT of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

InformationElement.prototype.getOwnerProjectFromUri = function()
{
    const self = this;

    const leadingPart = self.uri.match(new RegExp("http://[\/]*.*/project\/"));
    let ownerProject = self.uri.replace(leadingPart, "");
    if(!isNull(ownerProject) && !isNull(leadingPart))
    {
        ownerProject = ownerProject.replace(new RegExp("\/.*"), "");
        ownerProject = leadingPart + ownerProject;
    }

    return ownerProject;
};


InformationElement.prototype.getOwnerProject = function(callback)
{
    const self = this;

    /**
    *   Note the PLUS sign (+) on the nie:isLogicalPartOf+ of the query below.
    *    (Recursive querying through inference).
    *   @type {string}
    */
    const query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   [1] nie:isLogicalPartOf+ ?uri. \n" +
        "   ?uri rdf:type ddr:Project \n" +
        "} ";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: self.uri
            }
        ],
        function(err, result) {
            if(isNull(err))
            {
                if(result instanceof Array && result.length === 1)
                {
                    const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
                    Project.findByUri(result[0].uri, function(err, project){
                        callback(err,project);
                    });
                }
                else
                {
                    return callback(1, "Invalid result set or no parent PROJECT found when querying for the parent PROJECT of" + self.uri);
                }
            }
            else
            {
                return callback(1, "Error reported when querying for the parent PROJECT of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

InformationElement.prototype.rename = function(newTitle, callback)
{
    const self = this;

    //an update is made through a delete followed by an insert
    // http://www.w3.org/TR/2013/REC-sparql11-update-20130321/#insertData

    //TODO CACHE DONE
    const query =
        "DELETE DATA " +
        "{ " +
        "GRAPH [0] " +
        "{ " +
        "[1] nie:title ?title . " +
        "} " +
        "}; " +

        "INSERT DATA " +
        "{ " +
        "GRAPH [0] " +
        "{ " +
        "[1] nie:title [2] " +
        "} " +
        "}; ";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: self.uri
            },
            {
                type: DbConnection.string,
                value: newTitle
            }
        ],
        function(err, result) {
            cache.delete(self.uri, function(err, result){
                return callback(err, result);
            });
        }
    );
};

InformationElement.prototype.unlinkFromParent = function(callback)
{
    const self = this;
    self.getParent(function(err, parent){
        if(isNull(err))
        {
            if(parent instanceof Object && !isNull(parent.nie))
            {
                let parentParts = parent.nie.hasLogicalPart;

                //remove myself from parent.
                if(parentParts instanceof Array)
                {
                    parentParts = _.without(parentParts, [self.uri]);
                }
                else
                {
                    if(parentParts === self.uri)
                    {
                        parentParts = null;
                    }
                }

                parent.nie.hasLogicalPart = parentParts;

                //Save modified parts, now with myself removed from them.
                parent.save(function(err, result){
                    return callback(err, result);
                });
            }
            else
            {
                return callback(null, self.uri +" already has no parent.");
            }
        }
        else
        {
            return callback(1, "Unable to retrieve the parent of "+ self.uri +" for unlinking it. Error reported by database : " + parent);
        }
    });
};

InformationElement.prototype.isHiddenOrSystem = function()
{
    const self = this;

    if(isNull(self.nie) || isNull(self.nie.title))
    {
        return false;
    }

    for(let i = 0; i < Config.systemOrHiddenFilesRegexes.length; i++)
    {
        const regex = new RegExp(Config.systemOrHiddenFilesRegexes[i]);

        if(self.nie.title.match(regex))
        {
            return true;
        }
    }

    return false;
};

InformationElement.removeInvalidFileNames = function(fileNamesArray)
{
    const _ = require('underscore');

    const validFiles = [];

    _.each(fileNamesArray, function(fileName){
        const ie = new InformationElement({
            nie: {
                title: fileName
            }
        });

        if(!ie.isHiddenOrSystem())
        {
            validFiles.push(fileName);
        }
    });

    return validFiles;
};


InformationElement.findByParentAndName = function(parentURI, name, callback)
{
    const self = this;

    const ie = Object.create(self.prototype).constructor({
        nie: {
            isLogicalPartOf: parentURI,
            title: name
        }
    });

    self.findByUri(ie.uri, callback);
};

InformationElement.prototype.findMetadata = function(callback){
    const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder")).Folder;
    const async = require("async");

    const self = this;
    InformationElement.findByUri(self.uri, function(err, resource){
        if(isNull(err)){
            if(!isNull(resource))
            {
                Folder.findByUri(resource.uri, function(err, folder) {
                    const metadataResult = {
                        title: resource.nie.title,
                        descriptors: folder.getDescriptors([Config.types.private], [Config.types.api_readable]),
                        file_extension: resource.ddr.fileExtension,
                        hasLogicalParts: []
                    };

                    if(!isNull(folder.ddr) && !isNull(folder.ddr.metadataQuality))
                    {
                        metadataResult.metadata_quality = folder.ddr.metadataQuality;
                    }
                    else
                    {
                        metadataResult.metadata_quality = 0;
                    }

                    if(isNull(err)){

                        folder.getLogicalParts(function (err, children) {
                            if (isNull(err)) {
                                const _ = require('underscore');
                                children = _.reject(children, function (child) {
                                    return child.ddr.deleted;
                                });

                                if (children.length > 0) {
                                    // 1st parameter in async.each() is the array of items
                                    async.each(children,
                                        // 2nd parameter is the function that each item is passed into
                                        function(child, callback){
                                            // Call an asynchronous function
                                            metadataResult.hasLogicalParts.push({
                                                'title':child.nie.title
                                            });
                                            return callback(null);
                                        },
                                        // 3rd parameter is the function call when everything is done
                                        function(err){
                                            if(isNull(err)) {
                                                // All tasks are done now
                                                return callback(null, metadataResult);
                                            }
                                            else{
                                                return callback(true, null);
                                            }
                                        }
                                    );
                                }
                                else {
                                    return callback(null, metadataResult);
                                }
                            }
                            else {
                                console.info("[findMetadataRecursive] error accessing logical parts of folder " + folder.nie.title);
                                return callback(true, null);
                            }
                        });
                    }
                    else {
                        console.info("[findMetadataRecursive] " + folder.nie.title + " is not a folder.");
                        return callback(null, metadataResult);
                    }

                });
            }
            else
            {
                const msg = self.uri + " does not exist in Dendro.";
                console.error(msg);

                return callback(true, msg);
            }
        }
        else
        {
            const msg = "Error fetching " + self.uri + " from the Dendro platform.";
            console.error(msg);

            return callback(true, msg);
        }
    }, null, null, null, [Config.types.private], [Config.types.api_accessible]);
};

InformationElement = Class.extend(InformationElement, Resource, "nie:FileDataObject");

module.exports.InformationElement = InformationElement;
