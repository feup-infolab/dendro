process.env.NODE_ENV = 'test';

const Config = GLOBAL.Config;

const chai = require('chai');
chai.use(require('chai-http'));

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));

const should = chai.should();

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));

module.exports.setup = function(finish)
{
    describe("[UNIT] add demouser2 as contributor to all projects", function () {

        before(function(done){
            require(Config.absPathInTestsFolder("units/projects/createProjects.Unit.js")).setup(done);
            done();
        });

        it('should add demouser2 as contributor of the public project', function (done) {
            const projectData = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
            userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should add demouser2 as contributor of the private project', function (done) {
            const projectData = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));
            userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should add demouser2 as contributor of the metadata-only project', function (done) {
            const projectData = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
            userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });

        after(function(done){
            done();
            finish();
        });
    });
};

