process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const path = require("path");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const should = chai.should();
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js"));
class BootupUnit extends TestUnit
{
    init (callback)
    {
        super.init(function (err, result)
        {
            // do not load databases because the state was loaded from docker snapshot
            app.serverListening
                .then(function (appInfo)
                {
                    chai.request(appInfo.app)
                        .get("/")
                        .end((err, res) =>
                        {
                            global.tests.app = appInfo.app;
                            global.tests.server = appInfo.server;
                            should.not.exist(err);
                            callback(err, res);
                            unitUtils.end(path.basename(__filename));
                        });
                })
                .catch(function (error)
                {
                    unitUtils.end(path.basename(__filename));
                    callback(error);
                });
        });
    }

    load (callback)
    {
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                const app = appUtils.requireUncached(Pathfinder.absPathInSrcFolder("app.js"));
                appUtils.requireUncached(Pathfinder.absPathInSrcFolder("app.js")).connectionsEstablished
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

                            unitUtils.end(path.basename(__filename));
                        });
                    })
                    .catch(function (error)
                    {
                        unitUtils.end(path.basename(__filename));
                        callback(error);
                    });
            }
        });
    }
}

module.exports = BootupUnit;
