
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
const Deposit = require(Pathfinder.absPathInSrcFolder("/models/deposit.js")).Deposit;

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const util = require('util');
const async = require("async");
const _ = require("underscore");

exports.public = function (req, res) {
    let deposits = {};

    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    const depositType = "public";

    Deposit.getDeposits(depositType, function(err, results){
        if(isNull(err)){
            deposits = results;
            res.json(deposits);
        }
    });
};

exports.allowed = function (req, res) {
    let deposits = {};

    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    Deposit.getAllowedDeposits(req, function(err, results){
        if(isNull(err)){
            deposits = results;
            res.json(deposits);
        }
    });
};