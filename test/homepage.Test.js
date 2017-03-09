process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();
var bootup = require('../src/app.js').bootup;

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

describe('/analytics_tracking_code', function() {
    it('[JSON] returns analytics_tracking_code', function (done) {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .get('/analytics_tracking_code')
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('ANALYTICS_TRACKING_CODE');
                done();
            });
    });

    it('[HTML] fails analytics_tracking_code', function (done) {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .get('/analytics_tracking_code')
            .end((err, res) => {
            res.should.have.status(405);
            done();
        });
    });
});

