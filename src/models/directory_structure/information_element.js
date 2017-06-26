//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

function InformationElement (object)
{
    InformationElement.baseConstructor.call(this, object);
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
    
    self.rdf.type = "nie:InformationElement";

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
                    const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                    const File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;

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

                            if(type === Folder.rdfType)
                            {
                                return callback(null, Folder);
                            }
                            else if(type === File.rdfType)
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
            if(!err)
            {
                if(results instanceof Array)
                {
                    if(results.length === 1)
                    {
                        const result = results[0];
                        if(!isNull(results[0].parent_folder))
                        {
                            result.uri = result.parent_folder;
                            const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                            let parent = new Folder(result);
                            return callback(null,parent);
                        }
                        else if(!isNull(result[0].parent_project))
                        {
                            result.uri = result.parent_project;
                            const Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
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
                        return callback(0, "There is no parent of " + self.uri);
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
            if(!err)
            {
                if(result instanceof Array && result.length === 1)
                {
                    const Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
                    const parent = new Project(result[0]);
                    return callback(null,parent);
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
            redis.connection.delete(self.uri, function(err, result){
                return callback(err, result);
            });
        }
    );
};

InformationElement.prototype.unlinkFromParent = function(callback)
{
    const self = this;
    self.getParent(function(err, parent){
        if(!err)
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
                return callback(0, self.uri +" already has no parent.");
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
    const Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
    const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder")).Folder;

    const self = this;
    InformationElement.findByUri(self.uri, function(err, resource){
        if(!err){
            if(!isNull(resource))
            {
                resource.getPropertiesFromOntologies(
                    Ontology.getPublicOntologiesUris(),
                    function(err, descriptors)
                    {
                        if(!err)
                        {
                            //remove locked descriptors
                            for(let i = 0 ; i < descriptors.length ; i++)
                            {
                                if(descriptors[i].locked)
                                {
                                    descriptors.splice(i, 1);
                                    i--;
                                }
                            }

                            Folder.findByUri(resource.uri, function(err, folder) {
                                const metadataResult = {
                                    title: resource.nie.title,
                                    descriptors: descriptors,
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

                                if(!err){

                                    folder.getLogicalParts(function (err, children) {
                                        if (!err) {
                                            const _ = require('underscore');
                                            children = _.reject(children, function (child) {
                                                return child.ddr.deleted;
                                            });

                                            if (children.length > 0) {

                                                const async = require("async");

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
                                                        if(!err) {
                                                            // All tasks are done now
                                                            return callback(false, metadataResult);
                                                        }
                                                        else{
                                                            return callback(true, null);
                                                        }
                                                    }
                                                );
                                            }
                                            else {
                                                return callback(false, metadataResult);
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
                                    return callback(false, metadataResult);
                                }

                            });
                        }
                        else
                        {

                            console.error("[findMetadataRecursive] error accessing properties from ontologies in " + self.uri);

                            return callback(true, [descriptors]);
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
    });
};

InformationElement.rdfType = "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#FileDataObject";

InformationElement = Class.extend(InformationElement, Resource);

module.exports.InformationElement = InformationElement;
