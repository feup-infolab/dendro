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

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject= require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const md5File = require('md5-file');


const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3"));
const demouser4 = require(Config.absPathInTestsFolder("mockdata/users/demouser4"));
const demouser5 = require(Config.absPathInTestsFolder("mockdata/users/demouser5"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
const createFoldersUnit = requireUncached(Config.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

let Project;
let User;

let walkSync = function(dir, folder) {
    var files = fs.readdirSync(dir);
    var filelist = filelist || [];
    if(files.length == 0){
        return [folder];
    }
    for(var i = 0; i < files.length; i++) {
        var file = files[i];
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            if (folder) {
                filelist = filelist.concat(walkSync(path.join(dir, file), path.join(folder, file)));
            } else {
                filelist = filelist.concat(walkSync(path.join(dir, file), file));
            }
        } else {
            if (folder) {
                filelist.push(path.join(folder, file));
            } else {
                filelist.push(file);
            }
        }
    }
    return filelist;
};

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module)
}

describe("Bagit projects", function (done) {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, res) {
            should.equal(err, null);
            Project = require(Config.absPathInSrcFolder("models/project.js")).Project;
            User = require(Config.absPathInSrcFolder("/models/user.js")).User;
            done();
        });
    });

    describe('project/' + publicProject.handle + '?bagit', function () {

        it("[HTML] should perform bagit in project root not logged in", function (done) {
            let app = GLOBAL.tests.app;
            let agent = chai.request.agent(app);
            let folder = Config.absPathInApp('test/temp');

            fs.mkdir(folder, function(err){
                let file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
                fs.stat(file, function(err, stats){
                    if(!err){
                        fs.unlink(file, function(err){
                        });
                    }
                    projectUtils.bagit(agent, publicProject.handle, '', function(err, res){
                        should.not.exist(err);
                        fs.writeFile(file, res.body, 'binary', function(err){
                            File['File'].unzip(file, function(err, file){
                                should.not.exist(err);
                                let filelist = walkSync(file);
                                //These are the must have components
                                filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLindademouser2');
                                filelist.should.include('manifest-sha256.txt');
                                filelist.should.include('bagit.txt');
                                done();
                            });
                        });
                    });
                });
            });

        });

        it("[HTML] should do bag it without being contributor", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                let file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
                fs.stat(file, function(err, stats){
                    if(!err){
                        fs.unlink(file, function(err){
                        });
                    }
                    projectUtils.bagit(agent, publicProject.handle, '', function(err, res){
                        should.not.exist(err);
                        fs.writeFile(file, res.body, 'binary', function(err){
                            File['File'].unzip(file, function(err, file){
                                should.not.exist(err);
                                let filelist = walkSync(file);
                                filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLindademouser2');
                                filelist.should.include('manifest-sha256.txt');
                                filelist.should.include('bagit.txt');
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("[HTML] should do bag it while being contributor", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                let file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
                fs.stat(file, function(err, stats){
                    if(!err){
                        fs.unlink(file, function(err){
                        });
                    }
                    projectUtils.bagit(agent, publicProject.handle, '', true, function(err, res){
                        should.not.exist(err);
                        fs.writeFile(file, res.body, 'binary', function(err){
                            File['File'].unzip(file, function(err, file){
                                should.not.exist(err);
                                let filelist = walkSync(file);
                                filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLindademouser2');
                                filelist.should.include('manifest-sha256.txt');
                                filelist.should.include('bagit.txt');
                                done();
                            });
                        });
                    });
                });
            });
        });


        it("[HTML] should do bag it while creator", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                let file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
                fs.stat(file, function(err, stats){
                    if(!err){
                        fs.unlink(file, function(err){
                        });
                    }
                    projectUtils.bagit(agent, publicProject.handle, '', function(err, res){
                        should.not.exist(err);
                        fs.writeFile(file, res.body, 'binary', function(err){
                            File['File'].unzip(file, function(err, file){
                                should.not.exist(err);
                                let filelist = walkSync(file);
                                filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                                filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLindademouser2');
                                filelist.should.include('manifest-sha256.txt');
                                filelist.should.include('bagit.txt');
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("[JSON] should not do bagit of non-existing project", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.bagit(agent, 'nonexistinghandle', '', function(err, res){
                    res.should.have.status(404);
                    should.exist(err);
                    err.message.should.equal('Not Found');
                    done();
                });
            });
        });

        //TODO not implemented for filepath yet
        it("[JSON] should do bagit of folder while not logged in", function (done) {
            let app = GLOBAL.tests.app;
            let agent = chai.request.agent(app);
            projectUtils.bagit(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err) {

                    File['File'].unzip(file, function (err, file) {
                        should.not.exist(err);
                        let filelist = walkSync(file);
                        done();
                    });
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
