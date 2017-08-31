
//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Utils = require(Pathfinder.absPathInPublicFolder("/js/utils.js")).Utils;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project")).Project;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const ArchivedResource = require(Pathfinder.absPathInSrcFolder("/models/versions/archived_resource")).ArchivedResource;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const util = require('util');
const async = require("async");
const _ = require("underscore");

function Registry(object){

    const self = this;
    self.addURIAndRDFType(object, "registry", Registry);
    Registry.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const now = new Date();
    self.dcterms.created = now.toDateString();
    const uuid = require('uuid');

    self.uri = Config.baseUri + "/deposit/" + uuid.v4();

    return self;
}

Registry.createDepositRegistry = function (object, callback) {
    const newRegistry = new Registry(object);

    console.log("creating registry from deposit\n" + util.inspect(object));

    newRegistry.save(function(err, newRegistry){
        if(!err){
            callback(err, newRegistry);
        } else{

        }
    });
};

Registry.getDeposits = function(req, res){
    //const loggedIn = req.body.user;

    const query =
        "SELECT * \n" +
        "FROM [0] \n"  +
        "WHERE { \n" +
        "?uri rdf:type ddr:Registry . \n" +
        "?uri ddr:exportedFromProject ?projused . \n" +
        "?projused ddr:privacyStatus [1] . \n" +
        "}";

    db.connection.execute(query,
        [   {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.string,
                value : "public"
            }
        ], function (err, regs){

            res.json(regs)


        });
};

Registry.getPublicRegistry = function(req, callback){
    const query =
        "SELECT * \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?uri ?e ddr:Registry. " +
        "?uri ?p ?o. \n" +
        "}";

    db.connection.execute(query,
        [{
            type: DbConnection.resourceNoEscape,
            value: db.graphUri

        }], function (err, regs){
            callback(err, regs);
        });


};

Registry.createAndInsertFromObject = function(object, callback){
    const self = Object.create(this.prototype);
    self.constructor(object);
    self.save(function(err, newRegistry){
        if(isNull(err)){

        }else{

        }
    })
};

Registry = Class.extend(Registry, Resource, "ddr:Registry");

module.exports.Registry = Registry;
