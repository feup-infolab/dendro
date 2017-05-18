process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const path = require('path');
const async = require('async');
const Config = GLOBAL.Config;

const should = chai.should();
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

var demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
var demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));
var demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3"));
var demouser4 = require(Config.absPathInTestsFolder("mockdata/users/demouser4"));
var demouser5 = require(Config.absPathInTestsFolder("mockdata/users/demouser5"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
var createFoldersUnit = requireUncached(Config.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

let Project;
let User;

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

describe("private project descriptors autocomplete", function (done) {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, res) {
            should.equal(err, null);
            Project = require(Config.absPathInSrcFolder("models/project.js")).Project;
            User = require(Config.absPathInSrcFolder("/models/user.js")).User;
            done();
        });
    });
    describe('project/' + privateProject.handle + '?descriptor_autocomplete', function () {

        it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
        {
            projectUtils.descriptors_autocomplete(false, privateProject.handle, "", "abstract", function(err, cb){

            });
            done();
        });

        it('[JSON] should forbid descriptor autocomplete requests for ontologies in project '+ privateProjectUrl +' if no user is authenticated.', function (done)
        {
            projectUtils.descriptors_autocomplete(true, privateProject.handle, "", "abstract", function(err, cb){

            });
            done();
        });

        it('[JSON] should allow descriptor autocomplete requests for ontologies in project '+ privateProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.descriptors_autocomplete(true, privateProject.handle, "", "abstract", function(err, cb){
                    done();

                });
            });
        });

        it('[JSON] should forbid requests for descriptor autocomplete in project '+ privateProjectUrl +' if user ' +demouser3.username+ ' is authenticated (not contributor nor creator).', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.descriptors_autocomplete(true, privateProject.handle, "", "abstract", function(err, cb){
                    done();

                });
            });
        });

        it('[JSON] should allow requests for descriptor autocomplete in project '+ privateProjectUrl +' if user ' +demouser2.username+ ' is authenticated (contributor).', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.descriptors_autocomplete(true, privateProject.handle, "", "abstract", function(err, cb){
                    done();

                });
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        db.deleteGraphs(function (err, data) {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    });
});
