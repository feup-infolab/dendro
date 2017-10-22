
//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const path = require("path");
const moment = require("moment");
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

function Deposit(object){

    const self = this;
    self.addURIAndRDFType(object, "deposit", Deposit);
    Deposit.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    let now = moment().format();
    self.dcterms.date = now;
    const uuid = require('uuid');

    self.uri = Config.baseUri + "/deposit/" + uuid.v4();

    return self;
}

Deposit.createDepositRegistry = function (object, callback) {
    const newRegistry = new Deposit(object);

    console.log("creating registry from deposit\n" + util.inspect(object));

    newRegistry.save(function(err, newRegistry){
        if(!err){
            callback(err, newRegistry);
        } else{

        }
    });
};

Deposit.public = function(publicPrivacy, page, offset, callback){

    const query =
        "SELECT ?label ?user ?date ?description ?title ?projused ?creator ?privacy \n" +
        "FROM [0] \n"  +
        "WHERE { \n" +
            "?uri rdf:type ddr:Registry . \n" +
            "?uri ddr:exportedFromProject ?projused . \n" +
            "?projused ddr:privacyStatus [1] . \n" +
            "?projused ddr:privacyStatus ?privacy . \n" +
            "?projused dcterms:title ?title . \n" +
            "?uri dcterms:creator ?user . \n" +
            "?uri dcterms:title ?label . \n" +
            "?uri dcterms:date ?date . \n" +
            "?uri dcterms:description ?description . \n" +
        "} \n" +
        "ORDER BY ?date \n" +
        "LIMIT [2] \n" +
        "OFFSET [3]";

    db.connection.execute(query,
        [   {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.string,
                value : publicPrivacy
            },
            {
                type : DbConnection.string,
                value : page
            },
            {
                type : DbConnection.string,
                value : offset
            }
        ], function (err, results){

            //do this client-side
            let deposits = results;
            for(let i = 0; i < deposits.length; i++){
                deposits[i].date = moment(deposits[i].date).fromNow();
            }
            //check for error
            callback(err, deposits);
        });
};

Deposit.allowed = function(username, parameters, callback){

    const query =
        "SELECT DISTINCT ?label ?user ?date ?description ?projectTitle ?projused ?creator ?privacy\n" +
        "FROM [0] \n"  +
        "WHERE " +
        "{ \n" +
        "   ?uri rdf:type ddr:Registry . \n" +
        "   ?uri ddr:exportedFromProject ?projused . \n" +
        "   { \n" +
        "       ?projused ddr:privacyStatus [1] . \n" +
        "       ?projused rdf:type ddr:Project . \n" +
        "       ?projused dcterms:title ?projectTitle . \n" +
        "       ?projused ddr:privacyStatus ?privacy . \n" +
        "       { \n" +
        "           ?projused dcterms:creator ?creator . \n" +
        "           ?creator ddr:username [2] \n" +
        "       } \n" +
        "       UNION \n" +
        "       { \n" +
        "           ?projused dcterms:contributor ?contributor . \n" +
        "           ?contributor ddr:username [2] \n" +
        "       } \n" +
        "       UNION \n" +
        "       { " +
        "           ?projused ddr:privacyStatus [3] \n" +
        "       }\n"+
        "   } \n" +
        "   ?uri dcterms:creator ?user . \n" +
        "   ?uri dcterms:title ?label . \n" +
        "   ?uri dcterms:date ?date . \n" +
        "   ?uri dcterms:description ?description . \n" +
        "} \n" +
        "ORDER BY ?date ";

    db.connection.execute(query,
        [   {
            type : DbConnection.resourceNoEscape,
            value : db.graphUri
        },
            {
                type : DbConnection.string,
                value : "private"
            },
            {
                type : DbConnection.string,
                value : username
            },
            {
                type : DbConnection.string,
                value : "public"
            }
        ], function (err, results){

            let deposits = results;

            //make this operation client-side
            for(let i = 0; i < deposits.length; i++){
                deposits[i].date = moment(deposits[i].date).fromNow();
            }
            //check for error
            callback(err, deposits);
        });
};

Deposit.createQuery = function(params, callback){
    let query =
        "SELECT DISTINCT ?label ?user ?date ?description ?projectTitle ?projused ?creator ?privacy\n" +
        "FROM [0] \n"  +
        "WHERE " +
        "{ \n" +
        "   ?uri rdf:type ddr:Registry . \n" +
        "   ?uri ddr:exportedFromProject ?projused . \n" +
        "   { \n" +
        "       ?uri ddr:privacyStatus [1] . \n" +
        "       ?projused rdf:type ddr:Project . \n" +
        "       ?projused dcterms:title ?projectTitle . \n" +
        "       ?projused ddr:privacyStatus ?privacy . \n" +
        "       { \n" +
        "           ?projused dcterms:creator ?creator . \n" +
        "           ?creator ddr:username [2] \n" +
        "       } \n" +
        "       UNION \n" +
        "       { \n" +
        "           ?projused dcterms:contributor ?contributor . \n" +
        "           ?contributor ddr:username [2] \n" +
        "       } \n" +
        "       UNION \n" +
        "       { " +
        "           ?projused ddr:privacyStatus [3] \n" +
        "       }\n"+
        "   } \n" +
        "   ?uri dcterms:creator ?user . \n" +
        "   ?uri dcterms:title ?label . \n" +
        "   ?uri dcterms:date ?date . \n" +
        "   ?uri dcterms:description ?description . \n";


    let ending =
        "} \n" +
        "ORDER BY ?date \n" +
        "OFFSET [4] \n" +
        "LIMIT [5]";

    let variables = [
        {
            type: DbConnection.resourceNoEscape,
            value: db.graphUri
        },
        {
            type : DbConnection.string,
            value : params.username
        },
        {
            type : DbConnection.string,
            value : "private"
        }];

    if(params.offset){
        variables.push({
            type: DbConnection.string,
            value: params.offset
        });
    } else{
        variables.push({
            type: DbConnection.string,
            value: "0"
        });
    }

    if(params.limit){
        variables.push({
            type: DbConnection.string,
            value: params.limit
        });
    } else{
        variables.push({
            type: DbConnection.string,
            value: "10"
        });
    }

    let i = 6;
    if(params.projId){
        query += "  ?uri ddr:exportedFromProject [" + i++ + "] \n";
        variables.push({
            type: DbConnection.resourceNoEscape,
            value: params.projId
        });
    }
    if(params.creator){
        query += "  ?uri dcterms:creator [" + i++ + "] \n";
        variables.push({
            type: DbConnection.resourceNoEscape,
            value: params.creator
        });
    }
    if(params.description){
        query += "  ?uri dcterms:description [" + i++ + "] \n";
        variables.push({
            type: DbConnection.resourceNoEscape,
            value: params.description
        });
    }

    query += ending;
    db.connection.execute(query,variables, function (err, regs){
            callback(err, regs);
        });
};

Deposit.createAndInsertFromObject = function(object, callback){
    const self = Object.create(this.prototype);
    self.constructor(object);
    self.save(function(err, newRegistry){
        if(isNull(err)){

        }else{

        }
    })
};

Deposit = Class.extend(Deposit, Resource, "ddr:Registry");

module.exports.Deposit = Deposit;
