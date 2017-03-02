process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();

var agent = null;

var demouser1 = require("../mockdata/users/demouser1.js");
var demouser2 = require("../mockdata/users/demouser1.js");

var folder = require('../mockdata/folders/folder.js');

var metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
var publicProject = require("../mockdata/projects/public_project.js");
var privateProject= require("../mockdata/projects/private_project.js");

describe('/project/' + publicProject.handle + "/data/" + folder.pathInProject + folder.name + "?download", function ()
{
    it('should download folder from a public project, user unauthenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Please sign in');
            done();
        });
    });
});
