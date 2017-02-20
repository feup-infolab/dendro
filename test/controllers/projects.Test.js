process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();

describe('/projects', function () {
    it('lists all projects', function (done) {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .get('/projects')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('Projects');
                done();
            });
    });
});
