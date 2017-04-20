process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();
function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function(finish)
{
    let bootup = requireUncached(Config.absPathInSrcFolder("app.js")).bootup;

    bootup.then(function(appInfo) {
        chai.request(appInfo.app)
        .get('/')
        .end((err, res) => {
            //res.should.have.status(200);
            //res.text.should.contain('<h2>Welcome to Dendro Beta</h2>');
            GLOBAL.tests.app = appInfo.app;
            GLOBAL.tests.server = appInfo.server;
            finish(err, res);
        });
    });
};