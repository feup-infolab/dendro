//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Utils = require(Config.absPathInPublicFolder("/js/utils.js")).Utils;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
const Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource")).ArchivedResource;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

const util = require('util');
const async = require('async');
const _ = require('underscore');

function Registry(object){
    Registry.baseConstructor.call(this, object);
    const self = this;

    self.rdf.type = "ddr:Registry";

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
    const loggedIn = req.body.user;

    const query =
        "SELECT * \n" +
        "FROM [0] \n"  +
        "WHERE { \n" +
        "?uri ?e ddr:Registry. " +
        "?uri ?p ?o. \n" +
        "}";

    db.connection.execute(query,
        [{
            type: DbConnection.resourceNoEscape,
            value: db.graphUri

        }], function (err, regs){
            res.json({regs});
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

/*Registry.getAccountRegistry = function(req, res){

};*/

Registry.prefixedRDFType = "ddr:Registry";

Registry = Class.extend(Registry, Resource);

module.exports = Registry;