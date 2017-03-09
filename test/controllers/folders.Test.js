"use strict";

process.env.NODE_ENV = "test";

let chai = require("chai");
let chaiHttp = require("chai-http");
const md5 = require("md5");
chai.use(chaiHttp);

const should = chai.should();

let agent = null;

const demouser1 = require("../mockdata/users/demouser1.js");
const demouser2 = require("../mockdata/users/demouser1.js");
const demouser3 = require("../mockdata/users/demouser1.js");

const folder = require("../mockdata/folders/folder.js");

const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const publicProject = require("../mockdata/projects/public_project.js");
const privateProject= require("../mockdata/projects/private_project.js");

const fileUtils= require("../utils/file/fileUtils.js");
const folderUtils= require("../utils/folder/folderUtils.js");
const userUtils = require("../utils/user/userUtils.js");

describe("/project/" + publicProject.handle + "/data/" + folder.pathInProject + folder.name + "?download", function ()
{
    //TODO
    it("should download folder from a public project, user unauthenticated", function (done) {
        let app = GLOBAL.tests.app;
        agent = chai.request.agent(app);
        folderUtils.downloadFolder(false, agent, folder.pathInProject, folder.name, publicProject.handle, function (err, res) {
                if (err)
                {
                    done(err);
                }

                res.should.have.status(200);
                done();
            });
    });

    //TODO
    it("should download folder from a public project, user authenticated as " + demouser1 + " (creator) ", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.downloadFolder(false, agent, folder.pathInProject, folder.name, publicProject.handle, function (err, res) {
                if (err)
                {
                    done(err);
                }

                res.should.have.status(200);
                done();
            });
        });
    });

    //TODO
    it("should download folder from a public project, user authenticated as " + demouser2.username + " (contributor) ", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            folderUtils.downloadFolder(false, agent, folder.pathInProject, folder.name, publicProject.handle, function (err, res) {
                if (err)
                {
                    done(err);
                }

                res.should.have.status(200);
                done();
            });
        });
    });

    //TODO
    it("should download folder from a public project, user authenticated as " + demouser3.username + " (not related to the project) ", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            folderUtils.downloadFolder(false, agent, folder.pathInProject, folder.name, publicProject.handle, function (err, res) {
                if (err)
                {
                    done(err);
                }

                res.should.have.status(200);
                done();
            });
        });
    });
});


describe("[POST] /project/:handle/data/:foldername?mkdir", function () {
    //TODO API ONLY
    it("Should give an error when the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser2(not a collaborador nor creator in a project by demouser1)", function (done) {
        done(1);
    });

    it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done) {
        done(1);
    });

    it("Should create the folder with success if the user is logged in as demouser3(a collaborator of the project)", function (done) {
        done(1);
    });

    it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        done(1);
    });

    it("Should give an error if an invalid folder parent is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        done(1);
    });

    it("Should give an error if an invalid project is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        done(1);
    });
});

describe("[POST] /project/:handle/data/:foldername?delete", function () {
    //TODO HTML AND API

    it("Should give an error message when the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the folder does not exist", function (done) {
        done(1);
    });

    it("Should give an error when the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a folder created by demouser1", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the folder", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the folder", function (done) {
        done(1);
    })
});

describe("[POST] /project/:handle/data/:foldername?undelete", function() {
    it("Should give an error message when a project does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the folder does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the folder is not deleted", function (done) {
        done(1);
    });

    it("Should give an error when the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a folder that is currently deleted", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        done(1);
    })
});

describe("[POST] /project/:handle/data/:foldername?update_metadata", function() {
    //TODO API ONLY
    it("Should give an error message when a project does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the folder does not exist", function (done) {
        done(1);
    });

    it("Should give an error when the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give an error when an invalid descriptor is used to update the metadata of a folder", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        done(1);
    })
});

describe("[GET] /project/:handle/data/foldername?recent_changes", function () {
    //TODO API ONLY
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the folder does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the folder changes if the user is logged in as demouser1(the creator of the project)", function (done) {
        done(1);
    });

    it("Should give the folder changes if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });
});