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