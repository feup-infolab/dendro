process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const path = require("path");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const should = chai.should();

const TestUnit = require(Pathfinder.absPathInTestsFolder("units/testUnit.js"));
const app = require(Pathfinder.absPathInSrcFolder("app.js"));

const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

class BootupUnit extends TestUnit
{
    static init (callback)
    {
        const self = this;
        unitUtils.start(self.name, "Initializing unit...");

        DockerCheckpointManager.deleteAll(true);
        DockerCheckpointManager.restartAllContainers(true);

        super.init(function (err, result)
        {
            app.serverListening.then(function (appInfo)
            {
                chai.request(appInfo.app)
                    .get("/")
                    .end((err, res) =>
                    {
                        global.tests.app = appInfo.app;
                        global.tests.server = appInfo.server;
                        should.not.exist(err);
                        callback(err, res);
                        unitUtils.end(self.name, "Initialization complete.");
                    });
            })
                .catch(function (error)
                {
                    Logger.log("error", "Error seeding databases!");
                    Logger.log("error", JSON.stringify(error));
                    callback(error);
                });
        });
    }

    static load (callback)
    {
        const self = this;
        unitUtils.start(self.name, "Seeding database...");
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                app.connectionsEstablished
                    .then(function (appInfo)
                    {
                        app.seedDatabases(function (err, results)
                        {
                            if (!err)
                            {
                                callback(null, appInfo);
                            }
                            else
                            {
                                callback(err, results);
                            }

                            unitUtils.end(self.name, "Database seeding complete.");
                        });
                    })
                    .catch(function (error)
                    {
                        Logger.log("error", "Error seeding databases!");
                        Logger.log("error", JSON.stringify(error));
                        callback(error);
                    });
            }
        });
    }
}

module.exports = BootupUnit;
