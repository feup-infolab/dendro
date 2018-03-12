process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const path = require("path");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const should = chai.should();

const TestUnit = require(Pathfinder.absPathInTestsFolder("units/testUnit.js"));
const App = require(Pathfinder.absPathInSrcFolder("bootup/app.js")).App;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
let dendroInstance;

class BootupUnit extends TestUnit
{
    static init (callback)
    {
        const self = this;
        Logger.log("Starting " + self.name + "...");
        super.init(function (err, result)
        {
            dendroInstance = new App();
            dendroInstance.startApp(function (err, appInfo)
            {
                if (isNull(err))
                {
                    chai.request(appInfo.app)
                        .get("/")
                        .end((err, res) =>
                        {
                            global.tests.app = appInfo.app;
                            global.tests.server = appInfo.server;
                            should.not.exist(err);
                            callback(err, res);
                        });
                }
                else
                {
                    Logger.log("error", "Error seeding databases!");
                    Logger.log("error", JSON.stringify(err));
                    callback(err);
                }
            });
        });
    }

    static shutdown (callback)
    {
        super.shutdown(function (err, result)
        {
            Logger.log("debug", "Starting server shutdown at bootup Unit");
            // TODO @silvae86 este free resources retorna antes do tempo!
            dendroInstance.freeResources(function (err, result)
            {
                global.tests.app = null;
                Logger.log("debug", "Server shutdown complete.");
                callback(err);
            });
        });
    }

    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        dendroInstance = new App();
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                dendroInstance.initConnections(function (err, appInfo)
                {
                    if (isNull(err))
                    {
                        dendroInstance.seedDatabases(function (err, result)
                        {
                            if (!err)
                            {
                                dendroInstance.startApp(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        global.tests.app = dendroInstance.app;
                                        unitUtils.endLoad(self, function (err, results)
                                        {
                                            callback(err, dendroInstance.app);
                                        });
                                    }
                                    else
                                    {
                                        Logger.log("error", "Error starting app in bootupUnit.");
                                        Logger.log("error", err);
                                        Logger.log("error", result);
                                        callback(err, result);
                                    }
                                });
                            }
                            else
                            {
                                Logger.log("error", "Error seeding databases in bootupUnit.");
                                Logger.log("error", err);
                                Logger.log("error", result);
                                callback(err, result);
                            }
                        });
                    }
                    else
                    {
                        Logger.log("error", "Error seeding databases!");
                        Logger.log("error", JSON.stringify(err));
                        callback(err);
                    }
                });
            }
        });
    }
}

module.exports = BootupUnit;
