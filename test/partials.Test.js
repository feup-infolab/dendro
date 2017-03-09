process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();
var bootup = require('../src/app.js').bootup;

describe('/app/views/*', function () {
    it('[HTML] it should render an html for the public/app/views/projects/show/partials/manual_descriptor.ejs EJS file', function (done) {
        
    });

    it('[HTML] it should not render html inexistent for the public/app/views/projects/show/partials/manual_descriptor_MISSING.ejs EJS file', function (done) {

    });
});



