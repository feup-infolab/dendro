process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const colors = require("colors");
const path = require("path");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/snapshot_manager.js")).DockerCheckpointManager;

const should = chai.should();
function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    unitUtils.start(path.basename(__filename));

    unitUtils.loadCheckpointAndRun(
        path.basename(__filename),
        function (callback)
        {
            requireUncached(Pathfinder.absPathInSrcFolder("app.js"))
                .connectionsEstablished.then(function (appInfo)
                {
                    requireUncached(Pathfinder.absPathInSrcFolder("app.js"))
                        .seedDatabases(function(err, results)
                        {
                            if(!err)
                            {
                                callback(null, appInfo);
                            }
                            else
                            {
                                callback(err, results);
                            }
                        });
                })
                .catch(function (error)
                {
                    unitUtils.end(path.basename(__filename));
                    callback(null, error);
                    finish(error);
                });
        },
        function (err)
        {
            // do not load databases because the state was loaded from docker snapshot
            requireUncached(Pathfinder.absPathInSrcFolder("app.js"))
                .serverListening.then(function (appInfo)
                {
                    chai.request(appInfo.app)
                        .get("/")
                        .end((err, res) =>
                        {
                            global.tests.app = appInfo.app;
                            global.tests.server = appInfo.server;
                            unitUtils.start(__filename);
                            should.not.exist(err);

                            finish(err, res);
                        });
                })
                .catch(function (error)
                {
                    unitUtils.end(path.basename(__filename));
                    finish(error);
                });
        });
};
