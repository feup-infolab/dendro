process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const colors = require("colors");
const path = require("path");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

const should = chai.should();
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

module.exports.setup = function (finish)
{
    const app = appUtils.requireUncached(Pathfinder.absPathInSrcFolder("app.js"));
    unitUtils.loadCheckpointAndRun(
        path.basename(__filename),
        function (err, restoreMessage)
        {
            unitUtils.start(path.basename(__filename), restoreMessage);
            requireUncached(Pathfinder.absPathInSrcFolder("app.js"))
                .connectionsEstablished.then(function (appInfo)
                {
                    app.seedDatabases(function (err, results)
                    {
                        if (!err)
                        {
                            finish(null, appInfo);
                        }
                        else
                        {
                            finish(err, results);
                        }

                        unitUtils.end(path.basename(__filename));
                    });
                })
                .catch(function (error)
                {
                    unitUtils.end(path.basename(__filename));
                    finish(error);
                });
        },
        function (err)
        {
            // do not load databases because the state was loaded from docker snapshot
            app.serverListening.then(function (appInfo)
            {
                chai.request(appInfo.app)
                    .get("/")
                    .end((err, res) =>
                    {
                        global.tests.app = appInfo.app;
                        global.tests.server = appInfo.server;
                        should.not.exist(err);
                        finish(err, res);
                        unitUtils.end(path.basename(__filename));
                    });
            })
                .catch(function (error)
                {
                    unitUtils.end(path.basename(__filename));
                    finish(error);
                });
        });
};
