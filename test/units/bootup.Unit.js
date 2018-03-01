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
let dendroInstance;

class BootupUnit extends TestUnit
{
    static init (callback)
    {
        super.init(function (err, result)
        {
            if(!dendroInstance)
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
            dendroInstance.freeResources(function (err, result)
            {
                Logger.log("debug", "Server shutdown complete at bootup Unit");
                callback(err);
            });
        });
    }

    static load (callback)
    {
        const self = this;
        self.startLoad(path.basename(__filename));
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
                        dendroInstance.seedDatabases(function (err, results)
                        {
                            if (!err)
                            {
                                callback(null, appInfo);
                            }
                            else
                            {
                                callback(err, results);
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
