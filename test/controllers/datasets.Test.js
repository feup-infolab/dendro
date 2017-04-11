process.env.NODE_ENV = 'test';

var _ = require('underscore');
var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require('./../utils/project/projectUtils.js');
var userUtils = require('./../utils/user/userUtils.js');
var folderUtils = require('./../utils/folder/folderUtils.js');
var httpUtils = require('./../utils/http/httpUtils.js');
var datasetUtils = require("../utils/dataset/datasetsUtils");

var should = chai.should();

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

var publicProject = require("../mockdata/projects/public_project");
var metadataOnlyProject = require("../mockdata/projects/metadata_only_project");
var privateProject = require("../mockdata/projects/private_project");

var mockFolder = require("../mockdata/folders/folder");

var unknownRepo = require("../mockdata/external_datasets/unknown_export_repo");
var createdUnknownRepo = require("../mockdata/external_datasets/created_unknown_export_repo");
var b2share = require("../mockdata/external_datasets/b2share");
var ckan = require("../mockdata/external_datasets/ckan");
var zenodo = require("../mockdata/external_datasets/zenodo");
var dspace = require("../mockdata/external_datasets/dspace");
var eprints = require("../mockdata/external_datasets/eprints");
var figshare = require("../mockdata/external_datasets/figshare");

var createdB2shareConfigInvalidToken = require("../mockdata/external_datasets/createdB2shareWithInvalidToken");
var createdB2shareConfigInvalidUrl = require("../mockdata/external_datasets/createdB2shareWithInvalidUrl");
var createdZenodoConfigInvalidToken = require("../mockdata/external_datasets/createdZenodoWithInvalidToken");

let b2shareData;
let ckanData;
let zenodoData;
let dspaceData;
let eprintsData;
let figshareData;


describe("[POST] /external_repositories/new", function () {
    it("Should give an error when trying to create a config for an external repository type that does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, unknownRepo, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("No repository username specified.");
                done();
            });
        });
    });

    it("Should give an error when trying to create a export config not authenticated", function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        datasetUtils.createExportConfig(true, agent, b2share, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("Should create a b2share export config with success logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, b2share, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.equal("New bookmark saved as " + b2share.dcterms.title);
                done();
            });
        });
    });

    it("Should create a ckan export config with success logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, ckan, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.equal("New bookmark saved as " + ckan.dcterms.title);
                done();
            });
        });
    });

    it("Should create a zenodo export config with success logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, zenodo, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.equal("New bookmark saved as " + zenodo.dcterms.title);
                done();
            });
        });
    });

    it("Should create a dspace export config with success logged in as demouser1", function (done) {
       /* userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, dspace, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.equal("New bookmark saved as " + dspace.dcterms.title);
                done();
            });
        });
        */
       done(1);
    });

    it("Should create a eprints export config with success logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, eprints, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.equal("New bookmark saved as " + eprints.dcterms.title);
                done();
            });
        });
    });

    it("Should create a figshare export config with success logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.createExportConfig(true, agent, figshare, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.equal("New bookmark saved as " + figshare.dcterms.title);
                done();
            });
        });
    });

});

describe("[GET] /external_repositories/my", function () {
    //[{"uri":"http://127.0.0.1:3001/external_repository/nelsonpereira1991/ckan-export-config-1","dcterms":{"modified":"2017-03-14T14:03:04.263Z","title":"ckan export config 1","creator":"http://127.0.0.1:3001/user/nelsonpereira1991"},"foaf":{},"ddr":{"hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/ckan","dcterms":{"title":"CKAN"},"foaf":{"nick":"ckan","homepage":"http://ckan.org"}},"hasExternalUri":"http://demo.ckan.org","hasUsername":"nelsonpereira1991","hasAPIKey":"b193a37e-de06-4b08-90db-a3cdc7ffad0f","hasOrganization":"infolab-devs"},"rdf":{"type":"http://dendro.fe.up.pt/ontology/0.1/ExternalRepository"},"nie":{},"nfo":{},"research":{},"dcb":{},"achem":{},"bdv":{},"biocn":{},"grav":{},"hdg":{},"tsim":{},"cep":{},"social":{},"cfd":{}},{"uri":"http://127.0.0.1:3001/external_repository/nelsonpereira1991/b2share-training-export","dcterms":{"modified":"2017-03-09T14:44:17.833Z","title":"b2share training export","creator":"http://127.0.0.1:3001/user/nelsonpereira1991"},"foaf":{},"ddr":{"hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/b2share","dcterms":{"title":"EUDAT B2Share","description":"A EUDAT B2Share deposition"},"foaf":{"nick":"b2share","homepage":"https://b2share.eudat.eu/"}},"hasExternalUri":"trng-b2share.eudat.eu","hasAccessToken":"MmGKBzjpdlT382lag38zxhsKttZDw9e7u6zZmzucVFUu1aYM5i55WpeUSgFE"},"rdf":{"type":"http://dendro.fe.up.pt/ontology/0.1/ExternalRepository"},"nie":{},"nfo":{},"research":{},"dcb":{},"achem":{},"bdv":{},"biocn":{},"grav":{},"hdg":{},"tsim":{},"cep":{},"social":{},"cfd":{}},{"uri":"http://127.0.0.1:3001/external_repository/nelsonpereira1991/zenodo-export-config-1","dcterms":{"modified":"2017-03-14T14:12:14.789Z","title":"zenodo export config 1","creator":"http://127.0.0.1:3001/user/nelsonpereira1991"},"foaf":{},"ddr":{"hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/zenodo","dcterms":{"title":"Zenodo"},"foaf":{"nick":"zenodo","homepage":"http://www.zenodo.org/"}},"hasExternalUri":"http://www.zenodo.org/","hasAccessToken":"dgOQrI0zzx5tZ1zSTSaBCtmik3SbJmxaJKW1GZV9ZUe7b7EV9Rr4XSTWMcTs"},"rdf":{"type":"http://dendro.fe.up.pt/ontology/0.1/ExternalRepository"},"nie":{},"nfo":{},"research":{},"dcb":{},"achem":{},"bdv":{},"biocn":{},"grav":{},"hdg":{},"tsim":{},"cep":{},"social":{},"cfd":{}},{"uri":"http://127.0.0.1:3001/external_repository/nelsonpereira1991/eprints-export-config-1","dcterms":{"modified":"2017-03-14T14:36:57.386Z","title":"eprints export config 1","creator":"http://127.0.0.1:3001/user/nelsonpereira1991"},"foaf":{},"ddr":{"hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/eprints","dcterms":{"title":"EPrints"},"foaf":{"nick":"eprints","homepage":"http://www.eprints.org/"}},"hasExternalUri":"http://demoprints.eprints.org","hasUsername":"nelsonpereira1991","hasSwordCollectionUri":"http://demoprints.eprints.org/id/contents","hasSwordCollectionLabel":"EPrints"},"rdf":{"type":"http://dendro.fe.up.pt/ontology/0.1/ExternalRepository"},"nie":{},"nfo":{},"research":{},"dcb":{},"achem":{},"bdv":{},"biocn":{},"grav":{},"hdg":{},"tsim":{},"cep":{},"social":{},"cfd":{}},{"uri":"http://127.0.0.1:3001/external_repository/nelsonpereira1991/figshare-export-config","dcterms":{"modified":"2017-03-14T14:54:42.366Z","title":"figshare export config","creator":"http://127.0.0.1:3001/user/nelsonpereira1991"},"foaf":{},"ddr":{"hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/figshare","dcterms":{"title":"Figshare"},"foaf":{"nick":"figshare","homepage":"http://www.figshare.com/"}},"hasExternalUri":"http://www.figshare.com/","hasAccessToken":"7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125","hasConsumerKey":"5b20a02208d83301ae8dd5d6ddb868b75f5de2b4","hasConsumerSecret":"98c1bb7bbb4cd465d44023a4baedc1e898bca485a5d5ea1803fbad8a2221621344e54aec481cbdcfb3f8902af161d58c859619bf020ba796c687e54cb4518d93","hasAccessTokenSecret":"7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125"},"rdf":{"type":"http://dendro.fe.up.pt/ontology/0.1/ExternalRepository"},"nie":{},"nfo":{},"research":{},"dcb":{},"achem":{},"bdv":{},"biocn":{},"grav":{},"hdg":{},"tsim":{},"cep":{},"social":{},"cfd":{}},{"uri":"http://127.0.0.1:3001/external_repository/nelsonpereira1991/b2share-config-2","dcterms":{"modified":"2017-03-14T11:38:16.461Z","title":"b2share config 2","creator":"http://127.0.0.1:3001/user/nelsonpereira1991"},"foaf":{},"ddr":{"hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/b2share","dcterms":{"title":"EUDAT B2Share","description":"A EUDAT B2Share deposition"},"foaf":{"nick":"b2share","homepage":"https://b2share.eudat.eu/"}},"hasExternalUri":"trng-b2share.eudat.eu","hasAccessToken":"MmGKBzjpdlT382lag38zxhsKttZDw9e7u6zZmzucVFUu1aYM5i55WpeUSgFE"},"rdf":{"type":"http://dendro.fe.up.pt/ontology/0.1/ExternalRepository"},"nie":{},"nfo":{},"research":{},"dcb":{},"achem":{},"bdv":{},"biocn":{},"grav":{},"hdg":{},"tsim":{},"cep":{},"social":{},"cfd":{}}]
    it("Should get an error when the user is unauthenticated", function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        datasetUtils.getMyExternalRepositories(true, agent, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("Should get all the external repositories configs for the demouser1 when the authenticated user is demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.getMyExternalRepositories(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.length.should.equal(5);//TODO change this after dspace is working to 6
                b2shareData = _.find(res.body, function (externalRepo) {return externalRepo.ddr.hasPlatform.foaf.nick == "b2share"});
                ckanData = _.find(res.body, function (externalRepo) {return externalRepo.ddr.hasPlatform.foaf.nick == "ckan"});
                zenodoData = _.find(res.body, function (externalRepo) {return externalRepo.ddr.hasPlatform.foaf.nick == "zenodo"});
                //TODO add the line bellow when dspace is working
                //dspaceData = _.find(res.body, function (externalRepo) {return externalRepo.ddr.hasPlatform.foaf.nick == "dspace"});
                eprintsData = _.find(res.body, function (externalRepo) {return externalRepo.ddr.hasPlatform.foaf.nick == "eprints"});
                figshareData = _.find(res.body, function (externalRepo) {return externalRepo.ddr.hasPlatform.foaf.nick == "figshare"});
                done();
            });
        });
    });
});


describe("[POST] [B2SHARE] /project/:handle?export_to_repository", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request

    it("Should give an error when the target repository is invalid[not b2share zenodo etc]", function (done) {
        done(1);
        //TODO this is not implemented i think
    });

    it("Should give an error when the user is unauthenticated", function (done) {
        done(1);
        //TODO this is not implemented i think
    });

    it("Should give an error when the user is logged in as demouser2(nor creator nor collaborator of the project)", function (done) {
        done(1);
        //TODO this is not implemented i think
    });

    it("Should give an error when there is an invalid access token for deposit although a creator or collaborator is logged in", function (done) {
        done(1);
        //TODO this is not implemented i think
    });

    it("Should give an error when there is an invalid external url for deposit although a creator or collaborator is logged in", function (done) {
        done(1);
        //TODO this is not implemented i think
    });

    it("Should give an error when the project to export does not exist although a creator or collaborator is logged in", function (done) {
        done(1);
        //TODO this is not implemented i think
    });

    it("Should give a success message when the project to export exists and a creator or collaborator is logged in", function (done) {
        /*
        this.timeout(10000);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            datasetUtils.exportToRepository(true, publicProject.handle, agent, {repository: b2shareData}, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });*/
        done(1);
        //TODO this is not implemented i think
    });
});


describe("[POST] [B2SHARE] /project/:handle/data/:foldername?export_to_repository", function () {

    it("Should give an error when the target repository is invalid[not b2share zenodo etc]", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, projectHandle, folderPath, agent, exportData, cb
            datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, createdUnknownRepo, function (err, res) {
                console.log(res);
                res.statusCode.should.equal(500);
                res.body.message.should.equal("Invalid target repository");
                done();
            });
        });
    });

    it("Should give an error when the user is unauthenticated", function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: b2shareData}, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Permission denied : cannot export resource because you do not have permissions to edit this project.");
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser2(nor creator nor collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(401);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: b2shareData}, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    it("Should give an error when there is an invalid access token for deposit although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(200);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: createdB2shareConfigInvalidToken}, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error when there is an invalid external url for deposit although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(200);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: createdB2shareConfigInvalidUrl}, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error when the project does not exist although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, "unknownProjectHandle", mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(401);//TODO aqui devia ser 404 certo ?
                datasetUtils.exportFolderToRepository(true, "unknownProjectHandle", mockFolder.pathInProject + mockFolder.name, agent, {repository: b2shareData}, function (err, res) {
                    res.statusCode.should.equal(401);//TODO aqui devia ser 404 certo ?
                    done();
                });
            });
        });
    });

    it("Should give an error when the folder to export does not exist although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, "randomfoldername", mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(404);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, "randomfoldername", agent, {repository: b2shareData}, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });
    });

    it("Should give a success message when the folder to export exists and a creator or collaborator is logged in", function (done) {
        this.timeout(10000);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(200);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: b2shareData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });
});

describe("[POST] [ZENODO] /project/:handle/data/:foldername?export_to_repository", function () {

    it("Should give an error when the target repository is invalid[not b2share zenodo etc]", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, projectHandle, folderPath, agent, exportData, cb
            datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, createdUnknownRepo, function (err, res) {
                console.log(res);
                res.statusCode.should.equal(500);
                res.body.message.should.equal("Invalid target repository");
                done();
            });
        });
    });

    it("Should give an error when the user is unauthenticated", function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: zenodoData}, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Permission denied : cannot export resource because you do not have permissions to edit this project.");
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser2(nor creator nor collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(401);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: zenodoData}, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });


    it("Should give an error when there is an invalid access token for deposit although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(200);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: createdZenodoConfigInvalidToken}, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error when the project does not exist although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, "unknownProjectHandle", mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(401);//TODO aqui devia ser 404 certo ?
                datasetUtils.exportFolderToRepository(true, "unknownProjectHandle", mockFolder.pathInProject + mockFolder.name, agent, {repository: zenodoData}, function (err, res) {
                    res.statusCode.should.equal(401);//TODO aqui devia ser 404 certo ?
                    done();
                });
            });
        });
    });

    it("Should give an error when the folder to export does not exist although a creator or collaborator is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, "randomfoldername", mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(404);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, "randomfoldername", agent, {repository: zenodoData}, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });
    });

    it("Should give a success message when the folder to export exists and a creator or collaborator is logged in", function (done) {
        this.timeout(10000);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.updateMetadataCorrectRoute(true, agent, publicProject.handle, mockFolder.pathInProject + mockFolder.name, mockFolder.metadata, function (error, response) {
                response.statusCode.should.equal(200);
                datasetUtils.exportFolderToRepository(true, publicProject.handle, mockFolder.pathInProject + mockFolder.name, agent, {repository: zenodoData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });
});
