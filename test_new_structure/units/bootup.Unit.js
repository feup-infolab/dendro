process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();
let bootup = require(Config.absPathInSrcFolder("app.js")).bootup;

module.exports.setup = function(finish)
{
    describe('app bootup', function () {

        it('should boot up the app', function (done) {
            this.timeout(20000);
            bootup.then(function(app) {
                chai.request(app)
                    .get('/')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.text.should.contain('<h2>Welcome to Dendro Beta</h2>');

                        GLOBAL.tests.app = app;

                        done();
                        finish();
                    });
            });
        });
    });

    after(function(done){
        done();
        finish();
    });
};