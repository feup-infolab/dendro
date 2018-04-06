process.env.NODE_ENV = "test";

global.app_startup_time = new Date();

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;

// 30 min TIMEOUT!!!!
Config.testsTimeout = 1800000;

console.log("Running in test mode with Node Version " + process.version + " and the app directory is : " + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

// END OF SOCIAL DENDRO TESTS

// PUBLIC PROJECT FOLDER LEVEL ?VERSION
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__version/routes.project.publicProject.data.testFolder1.__version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__version/routes.project.publicProject.data.testFolder2.__version.Test.js"));

// PRIVATE PROJECT FOLDER LEVEL ?VERSION
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__version/routes.project.privateProject.data.testFolder1.__version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__version/routes.project.privateProject.data.testFolder2.__version.Test.js"));

// METADATA ONLY PROJECT FOLDER LEVEL ?VERSION
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__version/routes.project.metadataonlyProject.data.testFolder1.__version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__version/routes.project.metadataonlyProject.data.testFolder2.__version.Test.js"));

// PUBLIC PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__change_log/routes.project.publicProject.data.testFolder1.__change_log.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__change_log/routes.project.publicProject.data.testFolder2.__change_log.Test.js"));

// PRIVATE PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__change_log/routes.project.privateProject.data.testFolder1.__change_log.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__change_log/routes.project.privateProject.data.testFolder2.__change_log.Test.js"));

// METADATA ONLY PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__change_log/routes.project.metadataonlyProject.data.testFolder1.__change_log.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__change_log/routes.project.metadataonlyProject.data.testFolder2.__change_log.Test.js"));

// PROJECT CHANGES PUBLIC PROJECT
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__recent_changes/routes.project.publicProject.__recent_changes.Test.js"));
// PROJECT CHANGES PRIVATE PROJECT
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__recent_changes/routes.project.privateProject.__recent_changes.Test.js"));
// PROJECT CHANGES METADADATA ONlY PROJECT
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__recent_changes/routes.project.metadataonlyProject.__recent_changes.Test.js"));

// PUBLIC PROJECT FOLDER LEVEL RECENT CHANGES
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__recent_changes/routes.project.publicProject.data.testFolder1.__recent_changes.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__recent_changes/routes.project.publicProject.data.testFolder2.__recent_changes.Test.js"));

// PRIVATE PROJECT FOLDER LEVEL RECENT CHANGES
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__recent_changes/routes.project.privateProject.data.testFolder1.__recent_changes.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__recent_changes/routes.project.privateProject.data.testFolder2.__recent_changes.Test.js"));

// METADATA ONLY PROJECT FOLDER LEVEL RECENT CHANGES
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__recent_changes/routes.project.metadataonlyProject.data.testFolder1.__recent_changes.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__recent_changes/routes.project.metadataonlyProject.data.testFolder2.__recent_changes.Test.js"));

// Archived versions test
require(Pathfinder.absPathInTestsFolder("/routes/archived_resource/routes.archivedResource.Test.js"));

// Import projects tests
require(Pathfinder.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));

// Dendro Administration page
require(Pathfinder.absPathInTestsFolder("/routes/admin/routes.admin.Test.js"));

