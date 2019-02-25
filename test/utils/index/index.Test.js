process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const should = chai.should();

module.exports.deleteIndexes = function (finish)
{
    let indexConnection = new IndexConnection();
    indexConnection.open(IndexConnection._all.dendro_graph, function (index)
    {
        index.deleteIndex(function (err, res)
        {
            should.equal(err, null);
            finish(err, res);
        });
    });
};
