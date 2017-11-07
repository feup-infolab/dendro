process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('/', function ()
{
    before(function (done)
    {
        require(Pathfinder.absPathInTestsFolder('bootup.Unit.js'));
        done();
    });

    it('returns the homepage', function (done)
    {
        chai.request(app)
            .get('/')
            .end((err, res) =>
            {
                res.should.have.status(200);
                res.text.should.contain('<h2>Welcome to Dendro Beta</h2>');

                global.tests.app = app;

                done();
            });
    });
});
