process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();

var agent = null;

var demouser1 = require("../mockdata/users/demouser1.js");
var folder = require("../mockdata/folders.js");

describe('/download folder', function ()
{
    it('should download the folder', function (done)
    {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .get('/login')
            .end((err, res) =>
            {
                res.should.have.status(200);
                res.text.should.contain('Please sign in');
                done();
            });
    });
});