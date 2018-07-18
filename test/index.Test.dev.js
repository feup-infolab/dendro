process.env.NODE_ENV = "test";

global.app_startup_time = new Date();

const path = require("path");
const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

// 30 min TIMEOUT!!!!
Config.testsTimeout = 1800000;

console.log("Running in test mode with Node Version " + process.version + " and the app directory is : " + rlequire.absPathInApp("dendro", "."));

global.Config = Config;

global.tests = {};

// SOCIAL DENDRO TESTS

rlequire("dendro", "test/routes/notifications/all/routes.notifications.all.Test.js");

rlequire("dendro", "test/routes/notifications/notification/routes.notifications.notification.Test.js");

rlequire("dendro", "test/routes/notifications/notification/routes.notifications.notification[DELETE].Test.js");

// END OF SOCIAL DENDRO TESTS

// PUBLIC PROJECT FOLDER LEVEL ?VERSION
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__version/routes.project.publicProject.data.testFolder1.__version.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__version/routes.project.publicProject.data.testFolder2.__version.Test.js");

// PRIVATE PROJECT FOLDER LEVEL ?VERSION
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__version/routes.project.privateProject.data.testFolder1.__version.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__version/routes.project.privateProject.data.testFolder2.__version.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL ?VERSION
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__version/routes.project.metadataonlyProject.data.testFolder1.__version.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__version/routes.project.metadataonlyProject.data.testFolder2.__version.Test.js");

// PUBLIC PROJECT FOLDER LEVEL ?CHANGE_LOG
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__change_log/routes.project.publicProject.data.testFolder1.__change_log.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__change_log/routes.project.publicProject.data.testFolder2.__change_log.Test.js");

// PRIVATE PROJECT FOLDER LEVEL ?CHANGE_LOG
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__change_log/routes.project.privateProject.data.testFolder1.__change_log.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__change_log/routes.project.privateProject.data.testFolder2.__change_log.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL ?CHANGE_LOG
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__change_log/routes.project.metadataonlyProject.data.testFolder1.__change_log.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__change_log/routes.project.metadataonlyProject.data.testFolder2.__change_log.Test.js");

// PROJECT CHANGES PUBLIC PROJECT
rlequire("dendro", "test/routes/project/public_project/__recent_changes/routes.project.publicProject.__recent_changes.Test.js");
// PROJECT CHANGES PRIVATE PROJECT
rlequire("dendro", "test/routes/project/private_project/__recent_changes/routes.project.privateProject.__recent_changes.Test.js");
// PROJECT CHANGES METADADATA ONlY PROJECT
rlequire("dendro", "test/routes/project/metadata_only_project/__recent_changes/routes.project.metadataonlyProject.__recent_changes.Test.js");

// PUBLIC PROJECT FOLDER LEVEL RECENT CHANGES
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__recent_changes/routes.project.publicProject.data.testFolder1.__recent_changes.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__recent_changes/routes.project.publicProject.data.testFolder2.__recent_changes.Test.js");

// PRIVATE PROJECT FOLDER LEVEL RECENT CHANGES
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__recent_changes/routes.project.privateProject.data.testFolder1.__recent_changes.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__recent_changes/routes.project.privateProject.data.testFolder2.__recent_changes.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL RECENT CHANGES
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__recent_changes/routes.project.metadataonlyProject.data.testFolder1.__recent_changes.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__recent_changes/routes.project.metadataonlyProject.data.testFolder2.__recent_changes.Test.js");

// Archived versions test
rlequire("dendro", "test/routes/archived_resource/routes.archivedResource.Test.js");

// Import projects tests
rlequire("dendro", "test/routes/projects/import/route.projects.import.Test.js");

// Dendro Administration page
rlequire("dendro", "test/routes/admin/routes.admin.Test.js");

// PUBLIC PROJECT FOLDER LEVEL ?restore_metadata_version
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__restore_metadata_version/routes.project.publicProject.data.testFolder1.__restore_metadata_version.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__restore_metadata_version/routes.project.publicProject.data.testFolder2.__restore_metadata_version.Test.js");

// PRIVATE PROJECT FOLDER LEVEL ?restore_metadata_version
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__restore_metadata_version/routes.project.privateProject.data.testFolder1.__restore_metadata_version.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__restore_metadata_version/routes.project.privateProject.data.testFolder2.__restore_metadata_version.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL ?restore_metadata_version
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__restore_metadata_version/routes.project.metadataonlyProject.data.testFolder1.__restore_metadata_version.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__restore_metadata_version/routes.project.metadataonlyProject.data.testFolder2.__restore_metadata_version.Test.js");

