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

// uncomment the first time you run the tests after installing dendro
// require(Pathfinder.absPathInTestsFolder("/init/loadOntologiesCache.Test.js"));

// ERROS
/*require(Pathfinder.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));*/

require(Pathfinder.absPathInTestsFolder("/routes/projects/route.projects.Test.js"));

// Update metadata tests
// PUBLIC PROJECT FOLDER LEVEL ?update_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__update_metadata/routes.project.publicProject.data.testFolder1.__update_metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__update_metadata/routes.project.publicProject.data.testFolder2.__update_metadata.Test"));

// METADATA ONLY PROJECT FOLDER LEVEL ?update_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__update_metadata/routes.project.metadataonlyProject.data.testFolder1.__update_metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__update_metadata/routes.project.metadataonlyProject.data.testFolder2.__update_metadata.Test"));

// PRIVATE PROJECT FOLDER LEVEL ?update_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__update_metadata/routes.project.privateProject.data.testFolder1.__update_metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__update_metadata/routes.project.privateProject.data.testFolder2.__update_metadata.Test"));
