"use strict";

process.env.NODE_ENV = "test";

let chai = require("chai");
let chaiHttp = require("chai-http");
const md5 = require("md5");
chai.use(chaiHttp);

const should = chai.should();
const expect = chai.expect();

let agent = null;

const demouser1 = require("../mockdata/users/demouser1.js");
const demouser2 = require("../mockdata/users/demouser2.js");
const demouser3 = require("../mockdata/users/demouser3.js");

const folder = require("../mockdata/folders/folder.js");

const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const publicProject = require("../mockdata/projects/public_project.js");
const privateProject= require("../mockdata/projects/private_project.js");

const projectUtils = require("../utils/project/projectUtils.js");
const fileUtils= require("../utils/file/fileUtils.js");
const folderUtils= require("../utils/folder/folderUtils.js");
const userUtils = require("../utils/user/userUtils.js");
const itemUtils = require("../utils/item/itemUtils");

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
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
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

    //TODO @silvae86: improve descriptions of these tests
    it("Should create a folder at the root of a public project while authenticated as its creator", function (done) {
        done(1);
    });

    it("Should create a folder at the root of a public project while authenticated as a contributor", function (done) {
        done(1);
    });

    it("Should NOT create a folder at the root of a public project if not authenticated as its creator or contributor", function (done) {
        done(1);
    });

    it("Should NOT create a folder at the root of a private project if not authenticated as its creator or contributor", function (done) {
        done(1);
    });

    it("Should NOT create a folder at the root of a metadata only project if not authenticated as its creator or contributor", function (done) {
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
    //TODO HTML AND API
    //TODO test all three types of project accesses (public, private, metadata only)

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
    //TODO make a request to HTML, should return invalid request
    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, "randomProjectHandle", folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, "randomProjectHandle", folder.name, function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, "randomFolderName", folder.metadata, function (err, res) {
                res.statusCode.should.equal(404);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, publicProject.handle, "randomFolderName", function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        itemUtils.updateItemMetadata(true, agent, publicProject.handle, folder.name, folder.metadata, function (err, res) {
            res.statusCode.should.equal(401);
            //Because the project is public, the unauthenticated user can see metadata
            itemUtils.getItemMetadata(true, agent, publicProject.handle, folder.name, function (error, response) {
                response.statusCode.should.equal(200);
                JSON.parse(response.text).descriptors.length.should.equal(0);
                done();
            });
        });
    });

    it("Should give an error when an invalid descriptor is used to update the metadata of a folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, folder.name, folder.invalidMetadata, function (err, res) {
                res.statusCode.should.equal(400);
                itemUtils.getItemMetadata(true, agent, publicProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(0);
                    done();
                });
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        //TODO find a way to add demouser2 as collaborator
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, publicProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folder.metadata.length);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, publicProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(0);
                    done();
                });
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, publicProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folder.metadata.length);
                    done();
                });
            });
        });
    })
});

describe("[GET] /project/:handle/data/foldername?recent_changes", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
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
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.getItemRecentChanges(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
    });

    it("Should give the folder changes if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });
});

describe("[GET] /project/:handle/data/foldername?version", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        done(1);
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //Todo if no version is specified dendro crashes
            itemUtils.getItemVersion(true, agent, publicProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    //TODO @silvae86: is this correct? I don't think it is needed...
    it("Should give an error if the descriptors of the folder version are locked for alterations", function (done) {
        done(1);
    })
});


describe("[GET] /project/:handle/data/foldername?change_log", function () {
    //TODO API AND HTML
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        //jsonOnly, agent, projectHandle, itemPath, cb
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
    });

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });

    it("Should show in the change log the edited descriptors made by demouser1 to the folder if demouser1 is authenticated", function (done) {
        done(1);
    });
});

describe("[POST] /project/:handle/data/foldername?restore_metadata_version", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)

    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the metadata_version sent in the body is in an invalid format", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project) and if the version sent in the body is a valid one", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, publicProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("succesfully restored to version " + 0);
                done();
            });
        });
    });

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser3(a collaborator on the project) and if the version sent in the body is a valid one", function (done) {
        done(1);
    });
});

describe("[DELETE] /project/:handle/data/:foldername", function () {
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
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                done();
            });
        });
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
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully undeleted");
                done();
            });
        });
    })
});

describe("[DELETE] HARD DELETE /project/:handle/data/:foldername", function () {
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

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to hard delete a folder created by demouser1", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to hard delete the folder", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to hard delete the folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, response) {
                    response.statusCode.should.equal(200);
                    response.text.should.not.contain("\"title\":" + "\"" + folder.name + "\"");
                    done();
                });
            }, true);
        });
    })
});