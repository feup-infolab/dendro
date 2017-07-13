const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('underscore');
chai.use(chaiHttp);

const getProjectDescriptorsFromOntology = function (jsonOnly, agent, ontologyPrefix, projectHandle, cb) {
    const path = '/project/' + projectHandle+ '?descriptors_from_ontology=' + ontologyPrefix;
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports = {
    getProjectDescriptorsFromOntology : getProjectDescriptorsFromOntology
};