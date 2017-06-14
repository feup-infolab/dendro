var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

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
const publicProjectHTMLTests = require(Config.absPathInTestsFolder("mockdata/projects/public_project_for_html.js"))

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));

const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
const createUsersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));

describe("Test showing private descriptors", function () {
    before(function (done) {
        this.timeout(60000);
        createUsersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[JSON] [GET] /project/:handle/delete", function () {
        //TODO HTML AND API
        it("Should not provide private information about the user via API", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                userUtils.getUserInfo(demouser1.username, true, agent, function(err, data)
                {
                    if(data.body.ddr.password)
                        done(1);
                    else
                        done();
                });
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});