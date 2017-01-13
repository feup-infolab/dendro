var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var util = require('util');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var uuid = require('node-uuid');

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

function Progress (object)
{
    Progress.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    if(self.uri == null)
    {
        self.uri = db.baseURI+"/progress/"+uuid.v4();
    }

    self.rdf.type = "gm:Progress";

    return self;
}
Progress.findByUserAndType= function(user, typeProgress, callback)
{

    var graphUri= db.graphUri;

    db.connection.execute(
        "WITH GRAPH [0] \n" +
        "SELECT ?uri\n" +
        "WHERE \n" +
        "{ \n" +
        "?uri gm:objectType [1]. \n" +
        "?uri gm:hasUser [2]. \n" +
        "?uri rdf:type gm:Progress.\n" +
        "} \n" ,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : graphUri
            },
            {
                type : DbConnection.prefixedResource,
                value : typeProgress
            },
            {
                type : DbConnection.resource,
                value : user
            }
        ],
        function(err, progress)
        {
                console.log(progress);
            if(!err)
            {
                    var uri = progress[0].uri;
                    console.log(progress[0].uri);
                    Progress.findByUri(uri, function(err, fetchedProgress)
                    {
                        if(!err)
                        {
                            var progressToReturn= new Progress(fetchedProgress);
                            callback(err, progressToReturn);

                        }
                        else
                        {
                            callback(1,"Error finding progress");
                        }
                    });

            }
            else
            {
                callback(err, progress);
            }
        }
    );
};
Progress.prototype.update = function(numActions, callback) {

    var self=this;
    var graphUri= db.graphUri;

    db.connection.execute(
        "WITH GRAPH [0] \n" +
        "DELETE { [1] gm:numActions ?na } \n" +
        "INSERT { [1] gm:numActions [2]  } \n" +
        "WHERE \n" +
        "{ \n" +
        "[1] gm:numActions ?na. \n" +
        "[1] rdf:type gm:Progress. \n" +
        "} \n" ,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            },
            {
                type : DbConnection.int,
                value : numActions
            }
        ],
        function(err, result)
        {
            callback(err, result);
        }
    );


}

Progress.createAndInsertFromObject = function(object, callback) {

    var self = new Progress(object);

    console.log("creating Progress from object" + util.inspect(object));


    //TODO CACHE DONE

    self.save(function(err, newProgress) {
        if(!err)
        {
            if(newProgress instanceof Progress)
            {
                callback(null, self);
            }
            else
            {
                callback(null, false);
            }
        }
        else
        {
            callback(err, newProgress);
        }
    });
};

Progress.removeAllProgress = function(callback)
{
    var progressDescriptor = new Descriptor({
        prefixedForm: "rdf:type",
        value : "gm:Progress"
    });

    Resource.deleteAllWithCertainDescriptorValueAndTheirOutgoingTriples(progressDescriptor, function(err, results)
    {
        if (!err)
        {
            callback(0, results);
        }
        else
        {
            var msg = "Error deleting all progress: " + results;
            console.error(msg);
            callback(1, msg);
        }
    });
};

Progress = Class.extend(Progress, Resource);

module.exports.Progress = Progress;