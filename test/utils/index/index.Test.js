process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const IndexConnection = rlequire("dendro", "src/kb/index.js")).IndexConnection;

const chai = require("chai");
const chaiHttp = require("chai-http");
const async = require("async");
chai.use(chaiHttp);

const should = chai.should();

module.exports.deleteIndexes = function (finish)
{
    let indexConnection = new IndexConnection();
    indexConnection.open(Config.elasticSearchHost, Config.elasticSearchPort, IndexConnection._all.dendro_graph, function (index)
    {
        index.delete_index(function (err, res)
        {
            should.equal(err, null);
            finish(err, res);
        });
    });
};
