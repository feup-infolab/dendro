process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();

let agent = null;

const demouser1 = require("../mockdata/users/demouser1.js");
const demouser2 = require("../mockdata/users/demouser2.js");
const demouser3 = require("../mockdata/users/demouser3.js");
const publicProject = require("../mockdata/projects/public_project.js");
const folder = require("../mockdata/folders/folder.js");
const pdfMockFile= require("../mockdata/files/pdfMockfile.js");

const userUtils =  require("../utils/user/userUtils.js");
const fileUtils =  require("../utils/file/fileUtils.js");
const itemUtils = require("../utils/item/itemUtils.js");

//UPLOAD FILE TESTS
describe('/project/' + publicProject.handle + "/data/" + folder.pathInProject + folder.name + "?upload", function ()
{
    it('should upload the mock files into a folder inside public project, user authenticated as ' + demouser1.username + " (creator) ", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, newAgent) {
            done();
        });
    });

    it('should upload the mock files into aa folder inside public project, user authenticated as ' + demouser2.username  + " (contributor) ", function (done)
    {
        //TODO
        done();
    });

    it('should NOT upload the mock files into a folder inside public project, user authenticated as ' + demouser3.username  + " (NOT RELATED TO THE PROJECT) ", function (done)
    {
        //TODO
        done();
    });
    
    it('should NOT upload the mock files into a folder inside public project, user unauthenticated', function (done)
    {
        //TODO
        done();
    });
});

/*
//DELETE TESTS
describe("[DELETE] [DELETE FILE] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/:filename?delete", function () {
    //API only
    it("Should give an error when the request is of type HTML for this route", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(false, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });

    it("Should give an error message when the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, publicProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource");
                done();
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a folder created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, publicProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the folder", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    })
});

describe("[DELETE] [DELETE FOLDER LEVEL] [METADATA ONLY PROJECT] /project/" + metadataOnlyProject.handle + "/data/:foldername?delete", function () {
    //API only

    it("Should give an error when the request is of type HTML for this route", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(false, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });

    it("Should give an error message when the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource");
                done();
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        //done(1);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a folder created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the folder", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    })
});

describe("[DELETE] [DELETE FOLDER LEVEL] [PRIVATE PROJECT] /project/" + privateProject.handle + "/data/:foldername?delete", function () {
    //API only
    it("Should give an error when the request is of type HTML for this route", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(false, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });

    it("Should give an error message when the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource");
                done();
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        itemUtils.deleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a folder created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the folder", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    })
});

//UNDELETE TESTS
describe("[POST] [PUBLIC PROJECT] /project/" + publicProject.handle+ "/data/:foldername?undelete", function() {
    //API only
    it("Should give an error when the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(false, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, publicProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource with uri");
                done();
            });
        });
    });

    it("Should give an error message when the folder is not deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicProject.handle, doNotDeleteFolderMockup.name, function (err, res) {
                res.statusCode.should.equal(200);
                itemUtils.undeleteItem(true, agent, publicProject.handle, doNotDeleteFolderMockup.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.undeleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, publicProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    })
});

describe("[POST] [METADATA ONLY PROJECT] /project/" + metadataOnlyProject.handle + "/data/:foldername?undelete", function() {
    //API only
    it("Should give an error when the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(false, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, metadataOnlyProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource with uri");
                done();
            });
        });
    });

    it("Should give an error message when the folder is not deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, metadataOnlyProject.handle, doNotDeleteFolderMockup.name, function (err, res) {
                res.statusCode.should.equal(200);
                itemUtils.undeleteItem(true, agent, metadataOnlyProject.handle, doNotDeleteFolderMockup.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.undeleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    })
});

describe("[POST] [Private PROJECT] /project/" + privateProject.handle + "/data/:foldername?undelete", function() {
    //API only
    it("Should give an error when the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(false, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource with uri");
                done();
            });
        });
    });

    it("Should give an error message when the folder is not deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, doNotDeleteFolderMockup.name, function (err, res) {
                res.statusCode.should.equal(200);
                itemUtils.undeleteItem(true, agent, privateProject.handle, doNotDeleteFolderMockup.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.undeleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.undeleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    })
});

//UPDATE_METADATA TESTS
describe("[POST] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/:foldername?update_metadata", function() {
    //API ONLY

    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(false, agent, publicProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, invalidProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, invalidProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, notFoundFolder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(404);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, publicProject.handle, notFoundFolder.name, function (error, response) {
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
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, folderForDemouser2.name, folderForDemouser2.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, publicProject.handle, folderForDemouser2.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folderForDemouser2.metadata.length);
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

describe("[POST] [METADATA ONLY PROJECT] /project/" + metadataOnlyProject.handle + "/data/:foldername?update_metadata", function() {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(false, agent, metadataOnlyProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, invalidProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, invalidProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, notFoundFolder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(404);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, metadataOnlyProject.handle, notFoundFolder.name, function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, folder.metadata, function (err, res) {
            res.statusCode.should.equal(401);
            itemUtils.getItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, function (error, response) {
                response.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error when an invalid descriptor is used to update the metadata of a folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, folder.invalidMetadata, function (err, res) {
                res.statusCode.should.equal(400);
                itemUtils.getItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(0);
                    done();
                });
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, folderForDemouser2.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folderForDemouser2.metadata.length);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, metadataOnlyProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folder.metadata.length);
                    done();
                });
            });
        });
    })
});

describe("[POST] [PRIVATE PROJECT] /project/" + privateProject.handle + "/data/:foldername?update_metadata", function() {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(false, agent, privateProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, invalidProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, invalidProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, privateProject.handle, notFoundFolder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(404);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, privateProject.handle, notFoundFolder.name, function (error, response) {
                    response.statusCode.should.equal(500);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        itemUtils.updateItemMetadata(true, agent, privateProject.handle, folder.name, folder.metadata, function (err, res) {
            res.statusCode.should.equal(401);
            itemUtils.getItemMetadata(true, agent, privateProject.handle, folder.name, function (error, response) {
                response.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error when an invalid descriptor is used to update the metadata of a folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, privateProject.handle, folder.name, folder.invalidMetadata, function (err, res) {
                res.statusCode.should.equal(400);
                itemUtils.getItemMetadata(true, agent, privateProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(0);
                    done();
                });
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, privateProject.handle, folderForDemouser2.name, folderForDemouser2.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, privateProject.handle, folderForDemouser2.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folderForDemouser2.metadata.length);
                    done();
                });
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, privateProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, privateProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, privateProject.handle, folder.name, folder.metadata, function (err, res) {
                res.statusCode.should.equal(200);
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemMetadata(true, agent, privateProject.handle, folder.name, function (error, response) {
                    response.statusCode.should.equal(200);
                    JSON.parse(response.text).descriptors.length.should.equal(folder.metadata.length);
                    done();
                });
            });
        });
    })
});


//GET ITEM RECENT CHANGES TESTS
describe("[GET] [PUBLIC PROJECT] /project/"+ publicProject.handle + "/data/foldername?recent_changes", function () {
    //API ONLY
    it("Should give an error if the request is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(false, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give the item changes if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        agent = chai.request.agent(app);

        itemUtils.getItemRecentChanges(true, agent, publicProject.handle, folder.name, function (err, res) {
            //because it is a public project
            res.statusCode.should.equal(200);
            res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it("Should give an error if the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, publicProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);//because it is a public project
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
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

    it("Should give the folder changes if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.getItemRecentChanges(true, agent, publicProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
    });
});

describe("[GET] [METADATA ONLY PROJECT] /project/"+ metadataOnlyProject.handle + "/data/foldername?recent_changes", function () {
    //API ONLY
    it("Should give an error if the request is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(false, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        agent = chai.request.agent(app);

        itemUtils.getItemRecentChanges(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
            //because it is a metadata only project
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it("Should give an error if the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, metadataOnlyProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give the folder changes if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.getItemRecentChanges(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
    });

    it("Should give the folder changes if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.getItemRecentChanges(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
    });
});

describe("[GET] [PRIVATE PROJECT] /project/"+ privateProject.handle + "/data/foldername?recent_changes", function () {
    //API ONLY
    it("Should give an error if the request is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(false, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        agent = chai.request.agent(app);

        itemUtils.getItemRecentChanges(true, agent, privateProject.handle, folder.name, function (err, res) {
            //because it is a private project
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it("Should give an error if the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemRecentChanges(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give the folder changes if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.getItemRecentChanges(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
    });

    it("Should give the folder changes if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.getItemRecentChanges(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);//The title and creator that were added to the folder
                done();
            });
        });
    });
});

//FILE VERSION TESTS
describe("[GET] [PUBLIC PROJECT] /project/" + publicProject.handle  + "/data/foldername?version", function () {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(false, agent, publicProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should the version information if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.getItemVersion(true, agent, publicProject.handle, folder.name, folder.version, function (err, res) {
            res.statusCode.should.equal(200);//because it is a public project
            res.body.descriptors.length.should.equal(5);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, invalidProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, publicProject.handle, notFoundFolder.name, notFoundFolder.version, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    });

    it("Should give the version info if the user is logged in as demouser2(collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, publicProject.handle, folderForDemouser2.name, folderForDemouser2.version, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, publicProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser3(not a creator or  collaborator on the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, publicProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(200);//because this is a public project
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give an error if no version is specified", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, publicProject.handle, folder.name, null, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    })
});

describe("[GET] [METADATA ONLY PROJECT] /project/" + metadataOnlyProject.handle  + "/data/foldername?version", function () {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(false, agent, metadataOnlyProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.getItemVersion(true, agent, metadataOnlyProject.handle, folder.name, folder.version, function (err, res) {
            res.statusCode.should.equal(401);//because it is a metadata only project
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, invalidProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, metadataOnlyProject.handle, notFoundFolder.name, notFoundFolder.version, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, metadataOnlyProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(401);//because the project is of type metadata_only
                done();
            });
        });
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, metadataOnlyProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, folderForDemouser2.version, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give an error if no version is specified", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, metadataOnlyProject.handle, folder.name, null, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    })
});

describe("[GET] [PRIVATE PROJECT] /project/" + privateProject.handle  + "/data/foldername?version", function () {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(false, agent, privateProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.getItemVersion(true, agent, privateProject.handle, folder.name, folder.version, function (err, res) {
            res.statusCode.should.equal(401);//because it is a private project
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, invalidProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, privateProject.handle, notFoundFolder.name, notFoundFolder.version, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, privateProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(401);//because it is a private project
                done();
            });
        });
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, privateProject.handle, folder.name, folder.version, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give the folder versions if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, privateProject.handle, folderForDemouser2.name, folderForDemouser2.version, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.length.should.equal(5);
                done();
            });
        });
    });

    it("Should give an error if no version is specified", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemVersion(true, agent, privateProject.handle, folder.name, null, function (err, res) {
                res.statusCode.should.equal(500);
                done();
            });
        });
    })
});

//FILE CHANGE LOG TESTS
describe("[GET] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/foldername?change_log", function () {
    it("Should give the change log if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.getItemChangeLog(true, agent, publicProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(200);//because it is a public project
            res.body[0].changes.length.should.equal(2);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.redirects.length.should.equal(1);//this is an error case but the error response is sent as an html as a redirect with the flash message which is not accessible by the html response
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, publicProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.redirects.length.should.equal(1);//this is an error case but the error response is sent as an html as a redirect with the flash message which is not accessible by the html response
                done();
            });
        });
    });

    it("Should give the change log if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);//because the project is public
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
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

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
    });
});

describe("[GET] [METADATA ONLY PROJECT] /project/" + metadataOnlyProject.handle + "/data/foldername?change_log", function () {
    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.getItemChangeLog(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.redirects.length.should.equal(1);//this is an error case but the error response is sent as an html as a redirect with the flash message which is not accessible by the html response
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, metadataOnlyProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.redirects.length.should.equal(1);//this is an error case but the error response is sent as an html as a redirect with the flash message which is not accessible by the html response
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        //jsonOnly, agent, projectHandle, itemPath, cb
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
    });

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
    });
});

describe("[GET] [PRIVATE PROJECT] /project/" + privateProject.handle + "/data/foldername?change_log", function () {
    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.getItemChangeLog(true, agent, privateProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.redirects.length.should.equal(1);//this is an error case but the error response is sent as an html as a redirect with the flash message which is not accessible by the html response
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.redirects.length.should.equal(1);//this is an error case but the error response is sent as an html as a redirect with the flash message which is not accessible by the html response
                done();
            });
        });
    });

    it("Should an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        //jsonOnly, agent, projectHandle, itemPath, cb
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
    });

    it("Should give the change log related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.getItemChangeLog(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body[0].changes.length.should.equal(2);
                done();
            });
        });
    });
});

//RESTORE FILE METADATA TESTS
describe("[POST] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/foldername?restore_metadata_version", function () {
    //API ONLY
    it("Should give an error of the request type for this route is html", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(false, agent, publicProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.itemRestoreMetadataVersion(true, agent, publicProject.handle, folder.name, 0, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, invalidProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, publicProject.handle, notFoundFolder.name, 0, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve version");
                done();
            });
        });
    });

    it("Should give an error if the metadata_version sent in the body is in an invalid format", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, publicProject.handle, folder.name, "thisisaninvalidversion", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve version");
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, publicProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
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

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project) and if the version sent in the body is a valid one", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, publicProject.handle, folderForDemouser2.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("succesfully restored to version " + 0);
                done();
            });
        });
    });
});

describe("[POST] [METADATA ONLY PROJECT] /project/" + metadataOnlyProject.handle + "/data/foldername?restore_metadata_version", function () {
    //API ONLY
    it("Should give an error of the request type for this route is html", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(false, agent, metadataOnlyProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.itemRestoreMetadataVersion(true, agent, metadataOnlyProject.handle, folder.name, 0, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, invalidProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, metadataOnlyProject.handle, notFoundFolder.name, 0, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve version");
                done();
            });
        });
    });

    it("Should give an error if the metadata_version sent in the body is in an invalid format", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, metadataOnlyProject.handle, folder.name, "thisisaninvalidversion", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve version");
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, metadataOnlyProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project) and if the version sent in the body is a valid one", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, metadataOnlyProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("succesfully restored to version " + 0);
                done();
            });
        });
    });

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project) and if the version sent in the body is a valid one", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("succesfully restored to version " + 0);
                done();
            });
        });
    });
});

describe("[POST] [PRIVATE PROJECT] /project/" + privateProject.handle + "/data/foldername?restore_metadata_version", function () {
    //API ONLY
    it("Should give an error of the request type for this route is html", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(false, agent, privateProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        itemUtils.itemRestoreMetadataVersion(true, agent, privateProject.handle, folder.name, 0, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error if the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, invalidProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the folder identified by foldername does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, privateProject.handle, notFoundFolder.name, 0, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve version");
                done();
            });
        });
    });

    it("Should give an error if the metadata_version sent in the body is in an invalid format", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, privateProject.handle, folder.name, "thisisaninvalidversion", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve version");
                done();
            });
        });
    });

    it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, privateProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project) and if the version sent in the body is a valid one", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, privateProject.handle, folder.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("succesfully restored to version " + 0);
                done();
            });
        });
    });

    it("Should restore the metadata version related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project) and if the version sent in the body is a valid one", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            itemUtils.itemRestoreMetadataVersion(true, agent, privateProject.handle, folderForDemouser2.name, 0, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("succesfully restored to version " + 0);
                done();
            });
        });
    });
});

//HARD DELETE FILE TESTS
describe("[DELETE] [PUBLIC PROJECT] HARD DELETE /project/" + publicProject.handle + "/data/:foldername", function () {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(false, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            }, true);
        });
    });

    it("Should give an error message when the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, publicProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource");
                done();
            }, true);
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        //jsonOnly, agent, projectHandle, itemPath, cb
        itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        }, true);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to hard delete a folder created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, publicProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, response) {
                    response.statusCode.should.equal(200);
                    response.text.should.not.contain("\"title\":" + "\"" + folderForDemouser2.name + "\"");
                    done();
                });
            }, true);
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to hard delete the folder", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, publicProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });
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

describe("[DELETE] [METADATA ONLY PROJECT] HARD DELETE /project/" + metadataOnlyProject.handle + "/data/:foldername", function () {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(false, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            }, true);
        });
    });

    it("Should give an error message when the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource");
                done();
            }, true);
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        //jsonOnly, agent, projectHandle, itemPath, cb
        itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        }, true);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to hard delete a folder created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                projectUtils.getProjectRootContent(true, agent, metadataOnlyProject.handle, function (err, response) {
                    response.statusCode.should.equal(200);
                    response.text.should.not.contain("\"title\":" + "\"" + folderForDemouser2.name + "\"");
                    done();
                });
            }, true);
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to hard delete the folder", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to hard delete the folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, metadataOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                projectUtils.getProjectRootContent(true, agent, metadataOnlyProject.handle, function (err, response) {
                    response.statusCode.should.equal(200);
                    response.text.should.not.contain("\"title\":" + "\"" + folder.name + "\"");
                    done();
                });
            }, true);
        });
    })
});

describe("[DELETE] [PRIVATE PROJECT] HARD DELETE /project/" + privateProject.handle + "/data/:foldername", function () {
    //API ONLY
    it("Should give an error if the request type for this route is HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            itemUtils.deleteItem(false, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            }, true);
        });
    });

    it("Should give an error message when the project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, invalidProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });
    });

    it("Should give an error message when the folder does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.contain("Unable to retrieve resource");
                done();
            }, true);
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        //jsonOnly, agent, projectHandle, itemPath, cb
        itemUtils.deleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        }, true);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to hard delete a folder created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                projectUtils.getProjectRootContent(true, agent, privateProject.handle, function (err, response) {
                    response.statusCode.should.equal(200);
                    response.text.should.not.contain("\"title\":" + "\"" + folderForDemouser2.name + "\"");
                    done();
                });
            }, true);
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to hard delete the folder", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to hard delete the folder", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message.should.contain("Successfully deleted");
                projectUtils.getProjectRootContent(true, agent, privateProject.handle, function (err, response) {
                    response.statusCode.should.equal(200);
                    response.text.should.not.contain("\"title\":" + "\"" + folder.name + "\"");
                    done();
                });
            }, true);
        });
    })
});
*/