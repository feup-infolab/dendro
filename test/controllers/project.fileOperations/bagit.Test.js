process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
var fs = require('fs');
var path = require('path');
var async = require('async');

var File = require(Config.absPathInSrcFolder('models/directory_structure/file.js'));

const should = chai.should();


const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/user/userUtils.js');

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");

var walkSync = function(dir, folder) {
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




describe('project/' + publicProject.handle + '?bagit', function () {

    it("[HTML] should perform bagit in project root not logged in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
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
                        var filelist = walkSync(file);
                        filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                        filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                        filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda1');
                        filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda2');
                        filelist.should.include('manifest-sha256.txt');
                        filelist.should.include('bagit.txt');
                        filelist.should.include('tagmanifest-sha256.txt');
                        filelist.should.include('bag-info.txt');
                        done();
                    });
                });
            });
        });
    });


    it("[HTML] should do bag it without being contributor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
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
                            var filelist = walkSync(file);
                            filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                            filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                            filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda1');
                            filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda2');
                            filelist.should.include('manifest-sha256.txt');
                            filelist.should.include('bagit.txt');
                            filelist.should.include('tagmanifest-sha256.txt');
                            filelist.should.include('bag-info.txt');
                            done();
                        });
                    });
                });
            });
        });
    });

    it("[HTML] should do bag it while being contributor", function (done) {
        done(1);
    });

    it("[HTML] should do bag it while creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPublicProject.zip');
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
                            var filelist = walkSync(file);
                            filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                            filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                            filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda1');
                            filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda2');
                            filelist.should.include('manifest-sha256.txt');
                            filelist.should.include('bagit.txt');
                            filelist.should.include('tagmanifest-sha256.txt');
                            filelist.should.include('bag-info.txt');
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
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.bagit(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
            should.not.exist(err);
            fs.writeFile(file, res.body, 'binary', function(err) {
                File['File'].unzip(file, function (err, file) {
                    should.not.exist(err);
                    var filelist = walkSync(file);
                    done();
                });
            });
        });
    });

    it("[JSON] should do bagit of folder while logged in", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err) {
                    File['File'].unzip(file, function (err, file) {
                        should.not.exist(err);
                        var filelist = walkSync(file);
                        done();
                    });
                });
            });
        });
    });

    it("[JSON] should not do bagit of nonexisting folder", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, publicProject.handle, '/data/nonexistentfolder/', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err) {
                    File['File'].unzip(file, function (err, file) {
                        should.not.exist(err);
                        var filelist = walkSync(file);
                        done();
                    });
                });
            });
        });
    });
});




describe('project/' + privateProject.handle + '?bagit', function () {

    it("[HTML] should not perform bagit in project root not logged in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPrivateProject.zip');

        projectUtils.bagit(agent, privateProject.handle, '', function(err, res){
            should.not.exist(err);
            fs.writeFile(file, res.body, function(err) {
                File['File'].unzip(file, function (err, file) {
                    should.exist(err);
                    var filelist = walkSync(file);
                    filelist.should.be.empty();
                    done();
                });
            });
        });
    });


    it("[HTML] should not do bag it without being contributor", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPrivateProject.zip');
            fs.stat(file, function(err, stats){
                if(!err){
                    fs.unlink(file, function(err){
                    });
                }
                projectUtils.bagit(agent, privateProject.handle, '', function(err, res){
                    should.not.exist(err);
                    done(1);
                });
            });
        });
    });

    it("[HTML] should do bag it while being contributor", function (done) {
        done(1);
    });

    it("[HTML] should do bag it while creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitPrivateProject.zip');
            fs.stat(file, function(err, stats){
                if(!err){
                    fs.unlink(file, function(err){
                    });
                }
                projectUtils.bagit(agent, privateProject.handle, '', function(err, res){
                    should.not.exist(err);
                    fs.writeFile(file, res.body, 'binary', function(err){
                        File['File'].unzip(file, function(err, file){
                            should.not.exist(err);
                            var filelist = walkSync(file);
                            filelist.should.include('data/privateprojectcreatedbydemouser1/metadata.json');
                            filelist.should.include('data/privateprojectcreatedbydemouser1/pastinhaLinda');
                            filelist.should.include('data/privateprojectcreatedbydemouser1/pastinhaLinda1');
                            filelist.should.include('data/privateprojectcreatedbydemouser1/pastinhaLinda2');
                            filelist.should.include('manifest-sha256.txt');
                            filelist.should.include('bagit.txt');
                            filelist.should.include('tagmanifest-sha256.txt');
                            filelist.should.include('bag-info.txt');
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
    it("[JSON] should not do bagit of folder while not logged in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.bagit(agent, privateProject.handle, '/data/pastinhaLinda', function(err, res){
            should.not.exist(err);
            fs.writeFile(file, res.body, 'binary', function(err) {
                File['File'].unzip(file, function (err, file) {
                    should.not.exist(err);
                    var filelist = walkSync(file);
                    done();
                });
            });
        });
    });

    it("[JSON] should not do bagit of folder while not contributor nor creator", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, privateProject.handle, '/data/pastinhaLinda', function(err, res){
                done(1);
            });
        });
    });

    it("[JSON] should not do bagit of nonexisting folder", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, privateProject.handle, '/data/nonexistentfolder/', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err) {
                    File['File'].unzip(file, function (err, file) {
                        should.not.exist(err);
                        var filelist = walkSync(file);
                        done();
                    });
                });
            });
        });
    });
});


describe('project/' + metadataOnlyProject.handle + '?bagit', function () {

    it("[HTML] should perform bagit in project root not logged in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitMetadataOnlyProject.zip');
        fs.stat(file, function(err, stats){
            if(!err){
                fs.unlink(file, function(err){
                });
            }
            projectUtils.bagit(agent, metadataOnlyProject.handle, '', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err){
                    File['File'].unzip(file, function(err, file){
                        should.not.exist(err);
                        var filelist = walkSync(file);
                        filelist.should.include('data/publicprojectcreatedbydemouser1/metadata.json');
                        filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda');
                        filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda1');
                        filelist.should.include('data/publicprojectcreatedbydemouser1/pastinhaLinda2');
                        filelist.should.include('manifest-sha256.txt');
                        filelist.should.include('bagit.txt');
                        filelist.should.include('tagmanifest-sha256.txt');
                        filelist.should.include('bag-info.txt');
                        done();
                    });
                });
            });
        });
    });


    it("[HTML] should do bag it without being contributor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitMetadataOnlyProject.zip');
            fs.stat(file, function(err, stats){
                if(!err){
                    fs.unlink(file, function(err){
                    });
                }
                projectUtils.bagit(agent, metadataOnlyProject.handle, '', function(err, res){
                    should.not.exist(err);
                    fs.writeFile(file, res.body, 'binary', function(err){
                        File['File'].unzip(file, function(err, file){
                            should.not.exist(err);
                            var filelist = walkSync(file);
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/metadata.json');
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/pastinhaLinda');
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/pastinhaLinda1');
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/pastinhaLinda2');
                            filelist.should.include('manifest-sha256.txt');
                            filelist.should.include('bagit.txt');
                            filelist.should.include('tagmanifest-sha256.txt');
                            filelist.should.include('bag-info.txt');
                            done();
                        });
                    });
                });
            });
        });
    });

    it("[HTML] should do bag it while being contributor", function (done) {
        done(1);
    });

    it("[HTML] should do bag it while creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var file = path.join(Config.absPathInApp('test/temp'), 'testingBagitmetadataOnlyProject.zip');
            fs.stat(file, function(err, stats){
                if(!err){
                    fs.unlink(file, function(err){
                    });
                }
                projectUtils.bagit(agent, metadataOnlyProject.handle, '', function(err, res){
                    should.not.exist(err);
                    fs.writeFile(file, res.body, 'binary', function(err){
                        File['File'].unzip(file, function(err, file){
                            should.not.exist(err);
                            var filelist = walkSync(file);
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/metadata.json');
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/pastinhaLinda');
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/pastinhaLinda1');
                            filelist.should.include('data/metadataonlyprojectcreatedbydemouser1/pastinhaLinda2');
                            filelist.should.include('manifest-sha256.txt');
                            filelist.should.include('bagit.txt');
                            filelist.should.include('tagmanifest-sha256.txt');
                            filelist.should.include('bag-info.txt');
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
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.bagit(agent, metadataOnlyProject.handle, '/data/pastinhaLinda', function(err, res){
            should.not.exist(err);
            fs.writeFile(file, res.body, 'binary', function(err) {
                File['File'].unzip(file, function (err, file) {
                    should.not.exist(err);
                    var filelist = walkSync(file);
                    done();
                });
            });
        });
    });

    it("[JSON] should do bagit of folder while logged in", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, metadataOnlyProject.handle, '/data/pastinhaLinda', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err) {
                    File['File'].unzip(file, function (err, file) {
                        should.not.exist(err);
                        var filelist = walkSync(file);
                        done();
                    });
                });
            });
        });
    });

    it("[JSON] should not do bagit of nonexisting folder", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, metadataOnlyProject.handle, '/data/nonexistentfolder/', function(err, res){
                should.not.exist(err);
                fs.writeFile(file, res.body, 'binary', function(err) {
                    File['File'].unzip(file, function (err, file) {
                        should.not.exist(err);
                        var filelist = walkSync(file);
                        done();
                    });
                });
            });
        });
    });
});