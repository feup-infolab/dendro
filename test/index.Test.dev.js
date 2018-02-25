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

// Import projects tests
require(Pathfinder.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));

// Restore a folder Tests
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__restore/routes.project.publicProject.data.testFolder1.__restore.Test.js"));

// PROJECT WITH B2DROP STORAGE
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/__upload/routes.project.b2dropProject.data.testFolder1.__upload.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/a_filename/__rename/routes.project.b2dropProject.data.testFolder1.a_filename.__rename.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/a_filename/__cut/routes.project.b2dropProject.data.testFolder1.a_filename.__cut.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/__bagit/routes.project.b2dropProject.__bagit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/__delete/routes.project.b2dropProject.__delete.Test.js"));

// PROJECT WITH LOCAL STORAGE
// test file uploads
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__upload/routes.project.privateProject.data.testFolder1.__upload.Test.js"));

// list orphan resources tests /admin/list_orphan_resources
require(Pathfinder.absPathInTestsFolder("/routes/admin/list_orphan_resources/routes.admin.listOrphanResources.Test.js"));

// nuke orphan resources tests /admin/nuke_orphan_resources
require(Pathfinder.absPathInTestsFolder("/routes/admin/nuke_orphan_resources/routes.admin.nukeOrphanResources.Test.js"));

// test ls_by_name
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__ls_by_name/routes.project.publicProject.data.testFolder1.__ls_by_name.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__ls_by_name/routes.project.privateProject.data.testFolder1.__ls_by_name.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__ls_by_name/routes.project.metadataOnlyProject.data.testFolder1.__ls_by_name.Test.js"));

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

// SOCIAL DENDRO TESTS

require(Pathfinder.absPathInTestsFolder("/routes/socialDendro/my/routes.socialDendro.my.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/all/routes.posts.all.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/post/routes.posts.post.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/posts/routes.posts.posts.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/new/routes.posts.new.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/like/routes.posts.like.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/post/likes/routes.posts.post.likes.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/comment/routes.posts.comment.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/comments/routes.posts.comments.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/share/routes.posts.share.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/shares/routes.posts.shares.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/count/routes.posts.count.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/_uri/routes.posts._uri.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/shares/_uri/routes.shares._uri.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/notifications/all/routes.notifications.all.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification[DELETE].Test.js"));

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

// Dendro Administration page
require(Pathfinder.absPathInTestsFolder("/routes/admin/routes.admin.Test.js"));

