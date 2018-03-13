const chai = require("chai");
const fs = require("fs");
const tmp = require("tmp");
const path = require("path");
const async = require("async");
const chaiHttp = require("chai-http");
const _ = require("underscore");
const recursive = require("recursive-readdir");

chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const File = require(Pathfinder.absPathInSrcFolder("models/directory_structure/file.js")).File;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Deposit = require(Pathfinder.absPathInSrcFolder("models/deposit.js")).Deposit;

exports.sendDeposits = function(jsonOnly, params, agent, callback){
    const path = "deposits/get_deposits";
    if(jsonOnly){
        agent
            .get(path)
            .set("Accept", "application/json")
            .send(params)
            .end(function(err, res){
                callback(err, res);
            });
    } else {
        agent
            .get(path)
            .send(params)
            .end(function(err, res){
                callback(err, res);
            });
    }
};

exports.createDeposit = function(deposit, callback){
    Deposit.createDepositRegistry(deposit, function(err, deposit){
        callback(err, deposit);
    })
};

exports.getDeposit = function(jsonOnly, uri, agent, callback){
    if(jsonOnly){
        agent
            .get(uri)
            .set("Accept", "application/json")
            .end(function(err, res){
                callback(err, res);
            });

    } else {
        agent
            .get(uri)
            .end(function (err, res){
                callback(err, res);
            });
    }
};


module.exports = exports;