process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

const db = function() { return GLOBAL.db.default; }();
const db_social = function() { return GLOBAL.db.social; }();
const db_notifications = function () { return GLOBAL.db.notifications;}();
const async = require('async');
const searchUtils = require('./../utils/search/searchUtils.js');

const should = chai.should();

const ecologyFolder = require("../mockdata/folders/ecology_folder");

describe("[GET] /search", function () {
    //TODO for now it is finding everything, but it should not find folders or files inside private/metadataonly projects
    it("[HTML] Should find the " +ecologyFolder.name+ " folder, because it exists.", function (done) {
        let app = GLOBAL.tests.app;
        agent = chai.request.agent(app);
        searchUtils.search(false, agent, ecologyFolder.search_terms, function (err, res) {
            if (err)
            {
                done(err);
            }
            else
            {
                res.should.have.status(200);
                res.text.should.contain(ecologyFolder.metadata.dcterms.abstract);
                done();
            }
        });
    });

    it("[JSON] Should find the " +ecologyFolder.name+ " folder, because it exists.", function (done) {
        let app = GLOBAL.tests.app;
        agent = chai.request.agent(app);
        searchUtils.search(true, agent, ecologyFolder.search_terms, function (err, res) {
            if (err)
            {
                done(err);
            }
            else
            {
                res.should.have.status(200);
                res.text.should.contain(ecologyFolder.metadata.dcterms.abstract);
                done();
            }
        });
    });
});
