const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Config = require("../src/models/meta/config").Config;

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Config.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Config.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));
const ontologyPrefix = "foaf";
const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

let bootupUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));

describe("Initial clean-up...", function () {
    before(function (done) {
        this.timeout(60000);
        bootupUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("Clean everything", function () {
        it("Should destroy all test graphs", function (done) {
            //destroy graphs
            this.timeout(60000);
            appUtils.clearAppState(function (err, data) {
                should.equal(err, null);
                done();
            });
        });
    });
});
