process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();

var agent = null;

var demouser1 = require("../mockdata/users/demouser1.js");
var demouser2 = require("../mockdata/users/demouser2.js");
var demouser3 = require("../mockdata/users/demouser3.js");

var folder = require("../mockdata/folders.js");

describe('/project/' + publicProject.handle + "/data/" + folder.pathInProject + folder.name + "?upload", function ()
{
    it('should upload the mock files into a folder inside public project, user authenticated as ' + demouser1 + " (creator) ", function (done)
    {
        //TODO
        done(1);
    });

    it('should upload the mock files into aa folder inside public project, user authenticated as ' + demouser2 + " (contributor) ", function (done)
    {
        //TODO
        done(1);
    });

    it('should NOT upload the mock files into a folder inside public project, user authenticated as ' + demouser3 + " (NOT RELATED TO THE PROJECT) ", function (done)
    {
        //TODO
        done(1);
    });
    
    it('should NOT upload the mock files into a folder inside public project, user unauthenticated', function (done)
    {
        //TODO
        done(1);
    });
});