process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let should = chai.should();
const bootup = require('../src/app.js').bootup;

describe('/', function () {
    it('returns the homepage', function (done) {
        this.timeout(20000);
        bootup.then(function(app){
            chai.request(app)
                .get('/')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.contain('<h2>Welcome to Dendro Beta</h2>');

                    GLOBAL.tests.app = app;

                    done();
                });
        });
    });
});



