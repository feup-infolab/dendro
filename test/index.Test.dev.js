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

// PROJECT WITH B2DROP STORAGE
// require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/__upload/routes.project.b2dropProject.data.testFolder1.__upload.Test.js"));
// require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/a_filename/__rename/routes.project.b2dropProject.data.testFolder1.a_filename.__rename.Test.js"));
// require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/a_filename/__cut/routes.project.b2dropProject.data.testFolder1.a_filename.__cut.Test.js"));
// require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/__bagit/routes.project.b2dropProject.__bagit.Test.js"));

// PROJECT WITH LOCAL STORAGE
// test file uploads
// require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__upload/routes.project.privateProject.data.testFolder1.__upload.Test.js"));

// test file renaming
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/a_filename/__rename/routes.project.privateProject.data.testFolder1.a_filename.__rename.Test.js"));

// test file moving
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/a_filename/__cut/routes.project.privateProject.data.testFolder1.a_filename.__cut.Test.js"));

// Test project backups in BagIt 0.97 Format
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__bagit/routes.project.privateProject.__bagit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__bagit/routes.project.publicProject.__bagit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__bagit/routes.project.metadataOnlyProject.__bagit.Test.js"));

// Delete a project
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__delete/routes.project.publicProject.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__delete/routes.project.metadataOnlyProject.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__delete/routes.project.privateProject.__delete.Test.js"));
