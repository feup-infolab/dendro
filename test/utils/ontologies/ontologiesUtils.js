var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

exports.autocomplete = function (agent, query, cb) {
    var path = '/ontologies/autocomplete';
    path += query;
    agent
        .get(path)
        .end(function (err, res) {
            cb(err, res);
        });

};

exports.showPrefix = function (agent, prefix, cb) {
    var path = '/ontologies/show/' + prefix;
    agent
        .get(path)
        .end(function (err, res) {
            cb(err, res);
        });

};