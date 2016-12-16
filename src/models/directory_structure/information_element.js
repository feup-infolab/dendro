//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

function InformationElement (object)
{
    InformationElement.baseConstructor.call(this, object);
    var self = this;

    if(self.uri == null)
    {
        self.uri = object.nie.isLogicalPartOf + "/" + object.nie.title;
    }

    if(object.nie != null)
    {
        if(object.nie.isLogicalPartOf != null)
        {
            self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        }

        if(object.nie.title != null)
        {
            self.nie.title = object.nie.title;
        }
    }

    self.rdf.type = "nie:InformationElement";

    return self;
}

InformationElement.getType = function(resourceURI, callback)
{
    var self = this;

    var query =
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
            if(err == null)
            {
                if(types instanceof Array)
                {
                    var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                    var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;

                    if(types.length == 0)
                    {
                        callback(1,"Unable to retrieve Information Element's type, error 1");
                    }
                    else
                    {
                        //an information element can be a folder and a project simultaneously...?
                        //TODO not consistent, fix later

                        var hasCalledBack = false;

                        for(var i = 0; i < types.length; i++)
                        {
                            var type = types[i].type;

                            if(type == Folder.rdfType)
                            {
                                callback(null, Folder);
                                return;
                            }
                            else if(type == File.rdfType)
                            {
                                callback(null, File);
                                return;
                            }
                        }

                        if(!hasCalledBack)
                        {
                            callback(1,"Unable to retrieve Information Element's type, error 2");
                        }
                    }
                }
                else
                {
                    callback(1,"Unable to retrieve Information Element's type");
                }
            }
            else
            {
                callback(err, types);
            }
        });
}

InformationElement.prototype.getParent = function(callback)
{
    var self = this;

    var query =
        "SELECT ?parent_folder ?parent_project \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n"+
             " { \n" +
                "[1] nie:isLogicalPartOf ?parent_folder. \n"+
                " ?parent_folder rdf:type nfo:Folder. \n"+
             " } \n" +
             " UNION "+
             " { "+
                 "[1] nie:isLogicalPartOf ?parent_project. \n" +
                 " ?parent_project rdf:type ddr:Project. \n" +
             " } \n"+
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
                    if(results.length == 1)
                    {
                        var result = results[0];
                        if(results[0].parent_folder != null)
                        {
                            result.uri = result.parent_folder;
                            var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
                            var parent = new Folder(result);
                        }
                        else if(result[0].parent_project != null)
                        {
                            result.uri = result.parent_project;
                            var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
                            var parent = new Project(result);
                        }

                        callback(null,parent);
                    }
                    else if(results.length == 0)
                    {
                        callback(0, "There is no parent of " + self.uri);
                    }
                    else
                    {
                        callback(1, "ERROR : There is more than one parent to " + self.uri + " !");
                    }
                }
                else
                {
                    callback(1, "Invalid result set or no parent found when querying for the parent of" + self.uri);
                }
            }
            else
            {
                callback(1, "Error reported when querying for the parent of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

InformationElement.prototype.getOwnerProjectFromUri = function()
{
    var self = this;

    var leadingPart = self.uri.match(new RegExp("http://[\/]*.*/project\/"));
    var ownerProject = self.uri.replace(leadingPart, "");
    if(ownerProject != null && leadingPart != null)
    {
        ownerProject = ownerProject.replace(new RegExp("\/.*"), "");
        ownerProject = leadingPart + ownerProject;
    }

    return ownerProject;
};


InformationElement.prototype.getOwnerProject = function(callback)
{
    var self = this;

    /**
     * Note the PLUS sign (+) on the nie:isLogicalPartOf+ of the query below.
     * (Recursive querying through inference).
     * @type {string}
     */

    var query =
            "SELECT ?uri \n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ " +
                "[1] nie:isLogicalPartOf+ ?uri. "+
                "?uri rdf:type ddr:Project. "+
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
                if(result instanceof Array && result.length == 1)
                {
                    var result = result[0];
                    var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
                    var parent = new Project(result);
                    callback(null,parent);
                }
                else
                {
                    callback(1, "Invalid result set or no parent PROJECT found when querying for the parent PROJECT of" + self.uri);
                }
            }
            else
            {
                callback(1, "Error reported when querying for the parent PROJECT of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

InformationElement.prototype.rename = function(newTitle, callback)
{
    var self = this;

    //an update is made through a delete followed by an insert
    // http://www.w3.org/TR/2013/REC-sparql11-update-20130321/#insertData

    //TODO CACHE DONE
    var query =
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
                    "[1] nie:title [2] "+
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
                callback(err, result);
            });
        }
    );
};

InformationElement.prototype.unlinkFromParent = function(callback)
{
    var self = this;
    self.getParent(function(err, parent){
        if(!err)
        {
            if(parent instanceof Object && parent.nie != null)
            {
                var parentParts = parent.nie.hasLogicalPart;

                //remove myself from parent.
                if(parentParts instanceof Array)
                {
                    parentParts = _.without(parentParts, [self.uri]);
                }
                else
                {
                    if(parentParts == self.uri)
                    {
                        parentParts = null;
                    }
                }

                parent.nie.hasLogicalPart = parentParts;

                //Save modified parts, now with myself removed from them.
                parent.save(function(err, result){
                    callback(err, result);
                });
            }
            else
            {
                callback(0, self.uri +" already has no parent.");
            }
        }
        else
        {
            callback(1, "Unable to retrieve the parent of "+ self.uri +" for unlinking it. Error reported by database : " + parent);
        }
    });
};

InformationElement.prototype.isHiddenOrSystem = function()
{
    var self = this;

    if(self.nie == null || self.nie.title == null)
    {
        return false;
    }

    for(var i = 0; i < Config.systemOrHiddenFilesRegexes.length; i++)
    {
        var regex = new RegExp(Config.systemOrHiddenFilesRegexes[i]);

        if(self.nie.title.match(regex))
        {
            return true;
        }
    }

    return false;
};

InformationElement.removeInvalidFileNames = function(fileNamesArray)
{
    var _ = require('underscore');

    var validFiles = [];

    _.each(fileNamesArray, function(fileName){
        var ie = new InformationElement({
            nie :
            {
                title : fileName
            }
        });

        if(!ie.isHiddenOrSystem())
        {
            validFiles.push(fileName);
        }
    });

    return validFiles;
}


InformationElement.findByParentAndName = function(parentURI, name, callback)
{
    var self = this;

    var ie = Object.create(self.prototype).constructor({
        nie : {
            isLogicalPartOf: parentURI,
            title : name
        }
    });

    self.findByUri(ie.uri, callback);
};

InformationElement.rdfType = "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#FileDataObject";

InformationElement = Class.extend(InformationElement, Resource);

module.exports.InformationElement = InformationElement;
