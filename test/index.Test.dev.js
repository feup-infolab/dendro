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
require(Pathfinder.absPathInTestsFolder("/init/loadOntologiesCache.Test.js"));

// PROJECT ?metadata&deep TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__metadata&deep/routes.project.publicProject.__metadata&deep.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__metadata&deep/routes.project.privateProject.__metadata&deep.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__metadata&deep/routes.project.metadataonlyProject.__metadata&deep.Test"));

// PROJECT ?metadata TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__metadata/routes.project.publicProject.__metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__metadata/routes.project.privateProject.__metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__metadata/routes.project.metadataonlyProject.__metadata.Test"));

// PROJECT ROOT TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/routes.project.publicProject.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/routes.project.privateProject.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/routes.project.metadataonlyProject.Test"));
