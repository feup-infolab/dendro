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

MedalType = Class.extend(MedalType, Resource);

module.exports.MedalType = MedalType;


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