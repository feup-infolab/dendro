const chai = require("chai");
const fs = require("fs");
const tmp = require("tmp");
const path = require("path");
const async = require("async");
const rlequire = require("rlequire");
const chaiHttp = require("chai-http");
const _ = require("underscore");
const recursive = require("recursive-readdir");

chai.use(chaiHttp);

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const File = rlequire("dendro", "src/models/directory_structure/file.js").File;
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;

exports.sendDeposits = function (jsonOnly, params, agent, callback)
{
    const path = "deposits/search";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .send(params)
            .end(function (err, res)
            {
                callback(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .send(params)
            .end(function (err, res)
            {
                callback(err, res);
            });
    }
};

exports.createDeposit = function (deposit, callback)
{
    Deposit.createDeposit(deposit, function (err, deposit)
    {
        callback(err, deposit);
    });
};

exports.getDeposit = function (jsonOnly, uri, agent, callback)
{
    if (jsonOnly)
    {
        agent
            .get(uri)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                callback(err, res);
            });
    }
    else
    {
        agent
            .get(uri)
            .end(function (err, res)
            {
                callback(err, res);
            });
    }
};

module.exports = exports;
