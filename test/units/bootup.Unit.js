process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const colors = require('colors');
chai.use(chaiHttp);

const should = chai.should();
function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

const start = function()
{
    if(Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".green);
        console.log("[Boot up Unit] Booting Dendro test instance...".green);
        console.log("**********************************************".green);
    }
};

const end = function()
{
    if(Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".blue);
        console.log("[Boot up Unit] Complete".blue);
        console.log("**********************************************".blue);
    }
};

module.exports.setup = function(finish)
{
    start();
    let connectionsInitalized = requireUncached(Pathfinder.absPathInSrcFolder("app.js")).connectionsInitialized;

    connectionsInitalized.then(function(){
        const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

        appUtils.clearAllData(function (err, data) {
            should.equal(err, null);

            let bootup = requireUncached(Pathfinder.absPathInSrcFolder("app.js")).bootup;
            bootup.then(function(appInfo) {
                chai.request(appInfo.app)
                    .get('/')
                    .end((err, res) => {
                        global.tests.app = appInfo.app;
                        global.tests.server = appInfo.server;
                        end();
                        finish(err, res);
                    });
            });
        });
    });
};