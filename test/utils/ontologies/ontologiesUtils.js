var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

exports.autocomplete = function (agent, path, query, cb) {
    path += query;
    agent
        .get(path)
        .end(function (err, res) {
            cb(err, res);
        });

};