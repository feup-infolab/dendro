process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let should = chai.should();
let bootup = require('../../src/app.js').bootup;

describe('/app/views/*', function () {
    it('[HTML] it should render an html for the public/app/views/projects/show/partials/manual_descriptor.ejs EJS file', function (done) {
        //TODO
        done();
    });

    it('[HTML] it should not render html inexistent for the public/app/views/projects/show/partials/manual_descriptor_MISSING.ejs EJS file', function (done) {
        //TODO
        done();
    });
});



