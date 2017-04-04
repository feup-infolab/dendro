var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

exports.publicDisplay = function (jsonOnly, agent, cb) {
    var path = '/ontologies/public';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else{
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


exports.allDisplay = function (jsonOnly, agent, cb) {
    var path = '/ontologies/all';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else{
        agent
            .get(path)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};






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


exports.editOntologies = function (agent, cb) {
            agent
                .post('/ontologies/edit')
                .send( {description: "Social and Behavioural Studies... Methodology, Sample procedure, Kind of data...", domain: "Social and Behavioural Science", prefix:"social"})
                .end(function (err, res) {
                    cb(err, res);
                });
};

