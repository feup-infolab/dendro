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
const pdfMockFile= require("../mockdata/folders/folder.js");

const userUtils =  require("../utils/user/userUtils.js");
const fileUtils =  require("../utils/file/fileUtils.js");

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

describe("[POST] /project/:handle/data/:filename?delete", function () {
    //TODO HTML AND API
    //TODO test all three types of project accesses (public, private, metadata only)

    it("Should give an error message when the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the file does not exist", function (done) {
        done(1);
    });

    it("Should give an error when the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a file created by demouser1", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the file", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the file", function (done) {
        done(1);
    })
});


describe("[POST] /project/:handle/data/:filename?undelete", function() {
    //TODO HTML AND API
    //TODO test all three types of project accesses (public, private, metadata only)
    
    it("Should give an error message when a project does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the file does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the file is not deleted", function (done) {
        done(1);
    });

    it("Should give an error when the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a file that is currently deleted", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete a file that is currently deleted", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete a file that is currently deleted", function (done) {
        done(1);
    })
});

describe("[POST] /project/:handle/data/:filename?update_metadata", function() {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    
    it("Should give an error message when a project does not exist", function (done) {
        done(1);
    });

    it("Should give an error message when the filename does not exist", function (done) {
        done(1);
    });

    it("Should give an error when the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give an error when an invalid descriptor is used to update the metadata of a filename", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to update a metadata of a filename with a valid descriptor", function (done) {
        done(1);
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to update a metadata of a filename with a valid descriptor", function (done) {
        done(1);
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to update a metadata of a filename with a valid descriptor", function (done) {
        done(1);
    })
});


describe("[GET] /project/:handle/data/filename?recent_changes", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the file does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2 (not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the file changes if the user is logged in as demouser1 (the creator of the project)", function (done) {
        done(1);
    });

    it("Should give the file changes if the user is logged in as demouser3 (a collaborator on the project)", function (done) {
        done(1);
    });
});

describe("[GET] /project/:handle/data/filename?version", function () {
    
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the file identified by filename does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the file versions if the file exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        done(1);
    });

    it("Should give the file versions if the file exists and if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });

    it("Should give an error if the descriptors of the file version are locked for alterations", function (done) {
        done(1);
    })
});

describe("[GET] /project/:handle/data/filename?change_log", function () {

    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the file identified by filename does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the file versions if the file exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        done(1);
    });

    it("Should give the file versions if the file exists and if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });

    it("Should give an error if the descriptors of the file version are locked for alterations", function (done) {
        done(1);
    })
});

describe("[GET] /project/:handle/data/filename?change_log", function () {
    //TODO API AND HTML 
    //TODO test all three types of project accesses (public, private, metadata only)

    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the file identified by filename does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the change log related to the file if the file exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        done(1);
    });

    it("Should give the change log related to the file if the file exists and if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });
    
    it("Should show in the change log the edited descriptors made by demouser1 to the file if demouser1 is authenticated", function (done) {
        done(1);
    });
});

describe("[POST] /project/:handle/data/filename?restore_metadata_version", function () {
    
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the file identified by filename does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the metadata_version sent in the body is in an invalid format", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should restore the metadata version related to the file if the file exists and if the user is logged in as demouser1(the creator of the project) and if the version sent in the body is a valid one", function (done) {
        done(1);
    });

    it("Should restore the metadata version related to the file if the file exists and if the user is logged in as demouser3(a collaborator on the project) and if the version sent in the body is a valid one", function (done) {
        done(1);
    });
});