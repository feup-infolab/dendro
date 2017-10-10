process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const path = require('path');
const async = require('async');
const Config = global.Config;

const should = chai.should();
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject= require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const md5File = require('md5-file');

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

let demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
let demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
let demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const createFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

let Project;
let User;

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module)
}

const createPublicDeposit =

describe("Project deposits", function (done) {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, res) {
            should.equal(err, null);
            Project = require(Pathfinder.absPathInTestsFolder("models/project.js")).Project;
            User = require(Pathfinder.absPathInTestsFolder("/models/user.js")).User;
            done();
        });
    });
    describe('deposits/latest', function(){

        it("should not show a private deposit"){

        }
    });
});
