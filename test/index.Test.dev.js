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

// Search
// require(Pathfinder.absPathInTestsFolder("/routes/search/routes.search.Test.js"));
// Import projects tests
// require(Pathfinder.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/keywords/route.keywords.TestTPDL.js"));

// ERROS
// Delete a project
// require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__delete/routes.project.publicProject.__delete.Test.js"));
// require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__delete/routes.project.metadataOnlyProject.__delete.Test.js"));
// require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__delete/routes.project.privateProject.__delete.Test.js"));
// Restore a folder Tests
// require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__restore/routes.project.publicProject.data.testFolder1.__restore.Test.js"));

