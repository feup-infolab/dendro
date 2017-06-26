process.env.NODE_ENV = 'test';

var Config = GLOBAL.Config;
var IndexConnection = require(Config.absPathInSrcFolder("/kb/index.js")).IndexConnection;

var chai = require('chai');
var chaiHttp = require('chai-http');
var async = require('async');
chai.use(chaiHttp);

var should = chai.should();

module.exports.deleteIndexes = function (finish) {
    let indexConnection = new IndexConnection();
    indexConnection.open(Config.elasticSearchHost, Config.elasticSearchPort, IndexConnection.indexes.dendro, function(index) {
        index.delete_index(function (err, res) {
            should.equal(err, null);
            finish(err, res);
        });
    });
};