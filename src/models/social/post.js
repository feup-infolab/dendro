var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var _ = require('underscore');
var async = require('async');

function Post (object)
{
    Post.baseConstructor.call(this, object);
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/posts/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Post";

    self.ddr.numLikes = 0;

    return self;
}

//TODO This should be in a separate model(MetadataChangesPost) extending the post class
Post.buildFromArchivedVersion = function (archivedVersion, project, callback) {
    //CREATE A POST FOR EACH ARCHIVED VERSION CHANGE
    //DON'T SAVE IT HERE
    var changeAuthor = archivedVersion.ddr.versionCreator;
    var numberOfChanges = archivedVersion.changes.length;
    var changesSortedByType = _.groupBy(archivedVersion.changes, function(change){ return change.ddr.changeType;});
    var hasNumberOfDescriptorsAdded = changesSortedByType.add ? changesSortedByType.add.length : 0;
    var hasNumberOfDescriptorsEdited = changesSortedByType.edit ? changesSortedByType.edit.length : 0;
    var hasNumberOfDescriptorsDeleted = changesSortedByType.delete ? changesSortedByType.delete.length : 0;
    var title = changeAuthor.split("/").pop() + " worked on " + numberOfChanges + " metadata changes";
    var versionUri = archivedVersion.uri;

    async.map(changesSortedByType, function(changeType, callback)
    {
        callback(null, changeType[0]);
    }, function(err, results){
        //Add to the post the number of changes added, edited, deleted
        //the number of changes total
        //the version uri for the full details
        //TODO MAYBE ADD THE URI OF THE RESOURCE????
        var newPost = new Post({
            ddr: {
                hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,
                hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,
                hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted,
                hasNumberOfChanges : numberOfChanges,
                //hasContent: JSON.stringify(results),//substituir por sharedContent da SocialMediaPosting http://schema.org/SocialMediaPosting -> fazer JSON.parse depois para aceder
                numLikes: 0,//isto não é necessário aqui
                projectUri: project.uri,
                refersTo : versionUri//Já existe -> http://onto.dm2e.eu/schemas/dm2e#refersTo
            },
            dcterms: {
                creator: changeAuthor,
                title: title
            },
            schema: {
                sharedContent: JSON.stringify(results)
            }
        });
        callback(null, newPost);
    });
};

//TODO This and the build from rmdir changeType should be in another model(FileSystemPost) that extends the post class
Post.buildFromMkdirOperation = function (creatorUri, project, folder, callback) {
    //CREATE A POST FOR EACH MKDIR OPERATION
    //DONT SAVE IT HERE

    //create subclasses for the different post(types)

    //TODO PROPERTIES NEEDED
    //changeType(mkdir)
    //hasContent-> content of the post(name,path etc)
    //the resource it points to???
    //the user who did the work
    //the project

    var title = creatorUri.split("/").pop() + " created folder " + folder.nie.title;

    var newPost = new Post({
        ddr: {
            //hasContent: JSON.stringify(folder),//substituir por sharedContent da SocialMediaPosting http://schema.org/SocialMediaPosting -> fazer JSON.parse depois para aceder
            numLikes: 0,//isto não é necessário aqui
            projectUri: project.uri,
            refersTo : folder.uri,//Já existe -> http://onto.dm2e.eu/schemas/dm2e#refersTo,
            changeType: "mkdir"
        },
        dcterms: {
            creator: creatorUri,
            title: title
        },
        schema: {
            sharedContent: JSON.stringify(folder)
        }
    });

    console.log(JSON.stringify(newPost));
    callback(null, newPost);
};

Post.buildFromRmdirOperation = function (creatorUri, project, folder, callback) {
    //CREATE A POST FOR EACH RMDIR OPERATION
    //DONT SAVE IT HERE

    //changeType(rmdir)
    //hasContent-> content of the post(name,path etc)
    //the resource it points to???
    //the user who did the work
    //the project

    var title = creatorUri.split("/").pop() + " deleted folder " + folder.nie.title;

    var newPost = new Post({
        ddr: {
            //hasContent: JSON.stringify(folder),//substituir por sharedContent da SocialMediaPosting http://schema.org/SocialMediaPosting -> fazer JSON.parse depois para aceder
            numLikes: 0,//isto não é necessário aqui
            projectUri: project.uri,
            refersTo : folder.uri,//Já existe -> http://onto.dm2e.eu/schemas/dm2e#refersTo,
            changeType: "rmdir"
        },
        dcterms: {
            creator: creatorUri,
            title: title
        },
        schema: {
            sharedContent: JSON.stringify(folder)
        }
    });

    console.log(JSON.stringify(newPost));
    callback(null, newPost);
};

//TODO This should be in another model(ManualPost) that extends the post class
Post.buildManualPost = function (project, creatorUri, postContent, callback) {
    //CREATE A POST WITH MANUAL CONTENT
    //DONT SAVE IT HERE

    //TODO PROPERTIES NEEDED
    //hasContent-> content of the post(name,path etc)
    //the resource it points to???
    //the user who did the work
    //the project
    //possible users to be mentioned in the post
    var newPost = new Post({
        ddr: {
            //hasContent: postContent.body,//substituir por sharedContent da SocialMediaPosting http://schema.org/SocialMediaPosting
            numLikes: 0,//isto não é necessário aqui
            projectUri: project.uri,
            refersTo : postContent.refersTo,//Já existe -> http://onto.dm2e.eu/schemas/dm2e#refersTo
            notifiedUsers : JSON.stringify(postContent.notifiedUsers)//não consigo encontrar nada já definido para isto
        },
        dcterms: {
            creator: creatorUri,
            title: postContent.title
        },
        schema: {
            sharedContent: JSON.stringify(postContent.body)
        }
    });
    callback(null, newPost);
};

Post.findByUri = function (uri, callback, allowedGraphsArray, customGraphUri, skipCache, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval) {
    var self = this;

    var getFromTripleStore = function(uri, callback, customGraphUri)
    {
        var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;

        if (uri instanceof Object && uri.uri != null)
        {
            uri = uri.uri;
        }

        if (allowedGraphsArray != null && allowedGraphsArray instanceof Array)
        {
            var ontologiesArray = allowedGraphsArray;
        }
        else
        {
            var ontologiesArray = Ontology.getAllOntologiesUris();
        }

        Post.exists(uri, function(err, exists){
            if(!err)
            {
                if(exists)
                {
                    var post = Object.create(self.prototype);
                    //initialize all ontology namespaces in the new object as blank objects
                    // if they are not already present

                    post.uri = uri;

                    /**
                     * TODO Handle the edge case where there is a resource with the same uri in different graphs in Dendro
                     */
                    post.loadPropertiesFromOntologies(ontologiesArray, function (err, loadedObject)
                    {
                        if (!err)
                        {
                            post.baseConstructor(loadedObject);
                            callback(null, post);
                        }
                        else
                        {
                            var msg = "Error " + post + " while trying to retrieve post with uri " + uri + " from triple store.";
                            console.error(msg);
                            callback(1, msg);
                        }
                    }, customGraphUri);
                }
                else
                {
                    if(Config.debug.resources.log_missing_resources)
                    {
                        var msg = uri + " does not exist in Dendro.";
                        console.log(msg);
                    }

                    callback(0, null);
                }
            }
            else
            {
                var msg = "Error " + exists + " while trying to check existence of post with uri " + uri + " from triple store.";
                console.error(msg);
                callback(1, msg);
            }
        }, customGraphUri);
    };


    getFromTripleStore(uri, function(err, result){
        callback(err, result);
    }, customGraphUri);
};

Post.prefixedRDFType = "ddr:Post";

Post = Class.extend(Post, Event);

module.exports.Post = Post;


