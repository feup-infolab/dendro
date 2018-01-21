process.env.NODE_ENV = "test";

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
Config.testsTimeout = 1800000;
console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

// uncomment the first time you run the tests after installing dendro
// require(Pathfinder.absPathInTestsFolder("/init/loadOntologiesCache.Test.js"));

// PROJECT WITH LOCAL STORAGE
// test file uploads
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__upload/routes.project.privateProject.data.testFolder1.__upload.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/__upload/routes.project.b2dropProject.data.testFolder1.__upload.Test.js"));

