const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('underscore');
chai.use(chaiHttp);

const getProjectDescriptorsFromOntology = function (jsonOnly, agent, ontologyPrefix, projectHandle, cb) {
    //http://127.0.0.1:3001/descriptors/from_ontology/dcterms?project_handle=proj1
    const path = '/descriptors/from_ontology/' + ontologyPrefix + '?project_handle=' + projectHandle;
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