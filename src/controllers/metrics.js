
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


const util = require('util');
const async = require("async");
const _ = require("underscore");


exports.getDeposits = function(req, res) {

    const user = req.user;
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    let display;

    const verification = function (err, results) {
        if(isNull(err)){
            if(display === "json"){
                res.json({deposits: results[0], repositories: results[1]});
            }else{
                res.render("", {deposits: results[0], repositories: results[1]});
            }
        }
    };

    if(acceptsJSON && !acceptsHTML){
        display = "json";
    }else if(!acceptsJSON && acceptsHTML){
        display = "render";
    }

    exports.allowed(req, verification);
};



/*exports.allowed = function (req, callback) {

    let params = req.query;
    params.self = req.user.uri;
    Project.findByUri(params.id, function (err,project){
        params.project = project.dcterms.title;
        Deposit.createQuery(params, function(err, results){
            callback(err, results);
        });
    });

};*/

exports.allowed = function (req, callback) {
    let params = req.query;
    if(req.user)
        params.self = req.user.uri;
    if(!isNull(params.dateFrom))
        params.dateFrom = dateFormat(params.dateFrom, "isoDateTime");
    if(!isNull(params.dateTo)){
        let nextDay = new Date(params.dateTo);
        nextDay.setDate(nextDay.getDate() + 1);
        params.dateTo = dateFormat(nextDay, "isoDateTime");
    }

    let platforms = [];
    for(platform in params.platforms){
        const p = JSON.parse(params.platforms[platform]);
        if(p.value){
            platforms.push(p.name);
        }
    }
    if(platforms.length !== 0){
        params.platforms = platforms;
    }else{
        params.platforms = null;
    }

    let repositories = [];
    if(!isNull(params.repositories)){
        if(params.repositories instanceof Array){
            for(repo in params.repositories){
                const p = JSON.parse(params.repositories[repo]);
                if(p.value){
                    repositories.push(p.name);
                }
            }
        }
        else{
            const p = JSON.parse(params.repositories);
            if(p.value){
                repositories.push(p.name);
            }
        }

    }
    if(repositories.length !== 0){
        params.repositories = repositories;
    }else{
        params.repositories = null;
    }

    switch (params.order){
        case "Username":
            params.order = "user";
            break;
        case "Project":
            params.order = "projectTitle";
            break;
        case "Date":
        default:
            params.order = "date";
            break;
    }

    async.series([
        function(callback){
            Deposit.createQuery(params, callback);
        },
        function(callback){
            if(isNull(params.repositories))
                Deposit.getAllRepositories(params, callback);
            else{
                callback(null);
            }
        }
    ],function(err, results){
        callback(err, results);
    });

    /*Deposit.createQuery(params, function(err, results){
        Deposit.getAllRepositories(function(err, repos){
          callback(err, results);
        })
    });*/
};
