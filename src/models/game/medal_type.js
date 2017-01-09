var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

var util = require('util');
var async = require('async');
var _ = require('underscore');
var path = require('path');

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();


function MedalType (object)
{
    MedalType.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    if(self.uri == null)
    {
        self.uri = db.baseURI+"/medaltype/"+self.dcterms.title;
    }


    self.rdf.type = "gm:MedalType";

    return self;
}

MedalType.prefixedRDFType = "gm:MedalType";

MedalType.createAndInsertFromObject = function(object, callback) {

    var self = new MedalType(object);

    console.log("creating MedalType from object" + util.inspect(object));


    //TODO CACHE DONE

    self.save(function(err, newMedalType) {
        if(!err)
        {
            if(newMedalType instanceof MedalType)
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
            callback(err, newMedalType);
        }
    });
};

MedalType.findByTitle = function(title, callback)
{
    MedalType.findByPropertyValue(title, "dcterms:title", callback);
};

MedalType.all = function(callback) {
    var query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE {\n" +
        "?uri rdf:type gm:MedalType  \n"+
        "} \n";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value : db.graphUri
            }
        ],
        function(err, medaltypes) {
            if(!err)
            {
                if(medaltypes instanceof Array && medaltypes.length > 0)
                {
                    var getMedalTypeProperties = function(resultRow, cb)
                    {
                        MedalType.findByUri(resultRow.uri, function(err, project)
                        {
                            cb(err, project);
                        });
                    };

                    //get all the information about all the projects
                    // and return the array of projects, complete with that info
                    async.map(medaltypes, getMedalTypeProperties, function(err, medaltypesToReturn)
                    {
                        if(!err)
                        {
                            callback(null, medaltypesToReturn);
                        }
                        else
                        {
                            callback("error fetching user information : " + err, medaltypesToReturn);
                        }
                    });
                }
                else
                {
                    callback(null, []);
                }
            }
            else
            {
                callback(1, results);
            }
        });
};

MedalType.findByPropertyValue = function(value, propertyInPrefixedForm, callback) {

    var query =
        "SELECT * \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        " ?uri [1] [2] . \n" +
        "} \n";


    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.prefixedResource,
                value : propertyInPrefixedForm
            },
            {
                type : DbConnection.string,
                value : value
            }
        ],

        function(err, medalType) {
            if(!err)
            {
                if(medalType.length > 1)
                {
                    console.log("Duplicate medalType "+title+" found!!!!")
                }

                else if(medalType.length == 1)
                {
                    var uri = medalType[0].uri;
                    MedalType.findByUri(uri, function(err, fetchedMedalType)
                    {
                        if(!err)
                        {
                            var medalType= new MedalType(fetchedMedalType);

                                callback(err, medalType);

                        }
                        else
                        {
                            callback(1, "Unable to fetch user with uri :" + uri + ". Error reported : " + fetchedMedalType);
                        }
                    });
                }
                else
                {
                    callback(0,null);
                }
            }
            else
            {
                callback(err, medalType);
            }
        });
};
MedalType = Class.extend(MedalType, Resource);

module.exports.MedalType = MedalType;