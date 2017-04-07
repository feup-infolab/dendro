process.env.NODE_ENV = 'test';

const Config = GLOBAL.Config;

const chai = require('chai');
chai.use(require('chai-http'));

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));

const should = chai.should();

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
require(Config.absPathInTestsFolder("units/bootup.Unit.js")).setup();

module.exports.setup = function(finish)
{

    /*
    before(function(){
        require(Config.absPathInTestsFolder("units/bootup.Unit.js"));
    });*/

    describe("[UNIT] create all projects", function () {

        /*
        before(function(done){
            require(Config.absPathInTestsFolder("units/bootup.Unit.js")).setup(done);
        });*/

        it('demouser1 should create the public project', function (done) {
            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                const projectData = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
                projectUtils.createNewProject(true, agent, projectData, function (err, res) {

                    //ignore redirection, make new request
                    if (err) return done(err);
                    res.should.have.status(200);
                    done();

                    userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res) {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });

        it('demouser1 should create the private project', function (done) {
            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                const projectData = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));
                projectUtils.createNewProject(true, agent, projectData, function (err, res) {
                    //ignore redirection, make new request
                    if (err) return done(err);
                    res.should.have.status(200);
                    done();
                });
            });
        });

        it('demouser1 should create the metadata-only project', function (done) {
            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                const projectData = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
                projectUtils.createNewProject(true, agent, projectData, function (err, res) {
                    //ignore redirection, make new request
                    if (err) return done(err);
                    res.should.have.status(200);

                    userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res) {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });
        
        after(function(done){
            done();
            finish();
        })
    });

};

