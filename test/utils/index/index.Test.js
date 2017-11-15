process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;

const chai = require("chai");
const chaiHttp = require("chai-http");
const async = require("async");
chai.use(chaiHttp);

const should = chai.should();

module.exports.deleteIndexes = function (finish)
{
    let indexConnection = new IndexConnection();
    indexConnection.open(Config.elasticSearchHost, Config.elasticSearchPort, IndexConnection.indexes.dendro, function (index)
    {
        index.delete_index(function (err, res)
        {
            should.equal(err, null);
            finish(err, res);
        });
    });
};
