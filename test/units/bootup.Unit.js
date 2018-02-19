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

class BootupUnit extends TestUnit
{
    static init (callback)
    {
        const self = this;
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
        self.startLoad(path.basename(__filename));
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

                            self.endLoad(path.basename(__filename));
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
