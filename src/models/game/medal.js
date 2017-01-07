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


function Medal (object)
{
    Medal.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    if(self.uri == null)
    {
        self.uri = db.baseURI+"/Medal/"+self.dcterms.title;
    }

    self.rdf.type = "gm:Medal";

    return self;
}

Medal.prefixedRDFType = "gm:Medal";

Medal = Class.extend(Medal, Resource);

module.exports.Medal = Medal;


Medal.allByUser = function(username,callback) {
    var query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE {\n" +
        "?uri rdf:type gm:Medal. \n"+
        "?uri gm:belongsTo ?user. \n"+
        "?user ddr:username [1]. \n"+
        "?uri gm:hasType ?mt. \n"+
        "?mt gm:material ?material. \n" +
        "?mt gm:numActions ?numactions. \n" +
        "?mt dcterms:description ?description. \n"+
        "?mt dcterms:title ?title \n"+
        "} \n";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type: DbConnection.string,
                value : username
            }

        ],
        function(err, medals) {
            if(!err)
            {
                if(medals instanceof Array && medals.length > 0)
                {
                    var getMedalProperties = function(resultRow, cb)
                    {
                        Medal.findByUri(resultRow.uri, function(err, project)
                        {
                            cb(err, project);
                        });
                    };

                    //get all the information about all the projects
                    // and return the array of projects, complete with that info
                    async.map(medals, getMedalProperties, function(err, medalsToReturn)
                    {
                        if(!err)
                        {
                            callback(null, medalsToReturn);
                        }
                        else
                        {
                            callback("error fetching user information : " + err, medalsToReturn);
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