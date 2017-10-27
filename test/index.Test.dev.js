process.env.NODE_ENV = "test";

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
Config.testsTimeout = 120000;
console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

require(Pathfinder.absPathInTestsFolder("/init/loadOntologiesCache.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL ?MKDIR
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__mkdir/routes.project.publicProject.data.testFolder1.__mkdir.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__mkdir/routes.project.publicProject.data.testFolder2.__mkdir.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?MKDIR
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__mkdir/routes.project.privateProject.data.testFolder1.__mkdir.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__mkdir/routes.project.privateProject.data.testFolder2.__mkdir.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?MKDIR
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__mkdir/routes.project.metadataonlyProject.data.testFolder1.__mkdir.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__mkdir/routes.project.metadataonlyProject.data.testFolder2.__mkdir.Test.js"));


return;
