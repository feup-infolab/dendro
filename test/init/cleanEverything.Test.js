const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Pathfinder = require('../../src/models/meta/pathfinder').Pathfinder;

const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const folderUtils = require(Pathfinder.absPathInTestsFolder('utils/folder/folderUtils.js'));
const httpUtils = require(Pathfinder.absPathInTestsFolder('utils/http/httpUtils.js'));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder('utils/descriptor/descriptorUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const folder = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folder.js'));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderDemoUser2.js'));
const ontologyPrefix = 'foaf';
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));

let bootupUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/bootup.Unit.js'));

describe('Initial clean-up...', function ()
{
    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        bootupUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe('Clean everything', function ()
    {
        it('Should destroy all test graphs', function (done)
        {
            // destroy graphs
            this.timeout(Config.testsTimeout);
            appUtils.clearAppState(function (err, data)
            {
                should.equal(err, null);
                done();
            });
        });
    });
});
