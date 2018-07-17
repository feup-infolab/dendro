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

// PUBLIC PROJECT FOLDER LEVEL ?metadata_recommendations
/* rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__metadata_recommendations/routes.project.publicProject.data.testFolder1.__metadata_recommendations.Test");
 rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__metadata_recommendations/routes.project.publicProject.data.testFolder2.__metadata_recommendations.Test");

 //PRIVATE PROJECT FOLDER LEVEL ?metadata_recommendations
 rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__metadata_recommendations/routes.project.privateProject.data.testFolder1.__metadata_recommendations.Test");
 rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__metadata_recommendations/routes.project.privateProject.data.testFolder2.__metadata_recommendations.Test");

 //METADATA ONLY PROJECT FOLDER LEVEL ?metadata_recommendations
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__metadata_recommendations/routes.project.metadataonlyProject.data.testFolder1.__metadata_recommendations.Test");
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__metadata_recommendations/routes.project.metadataonlyProject.data.testFolder2.__metadata_recommendations.Test"); */

// PUBLIC PROJECT FOLDER LEVEL ?recommendation_ontologies
/* rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__recommendation_ontologies/routes.project.publicProject.data.testFolder1.__recommendation_ontologies.Test");
 rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__recommendation_ontologies/routes.project.publicProject.data.testFolder2.__recommendation_ontologies.Test");

 //PRIVATE PROJECT FOLDER LEVEL ?recommendation_ontologies
 rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__recommendation_ontologies/routes.project.privateProject.data.testFolder1.__recommendation_ontologies.Test");
 rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__recommendation_ontologies/routes.project.privateProject.data.testFolder2.__recommendation_ontologies.Test");

 //METADATA ONLY PROJECT FOLDER LEVEL ?recommendation_ontologies
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__recommendation_ontologies/routes.project.metadataonlyProject.data.testFolder1.__recommendation_ontologies.Test");
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__recommendation_ontologies/routes.project.metadataonlyProject.data.testFolder2.__recommendation_ontologies.Test"); */

// PUBLIC PROJECT FOLDER LEVEL ?metadata
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__metadata/routes.project.publicProject.data.testFolder1.__metadata.Test");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__metadata/routes.project.publicProject.data.testFolder2.__metadata.Test");

// PRIVATE PROJECT FOLDER LEVEL ?metadata
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__metadata/routes.project.privateProject.data.testFolder1.__metadata.Test");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__metadata/routes.project.privateProject.data.testFolder2.__metadata.Test");

// METADATA ONLY PROJECT FOLDER LEVEL ?metadata
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__metadata/routes.project.metadataonlyProject.data.testFolder1.__metadata.Test");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__metadata/routes.project.metadataonlyProject.data.testFolder2.__metadata.Test");

// PUBLIC PROJECT FOLDER LEVEL ?metadata&deep
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__metadata&deep/routes.project.publicProject.data.testFolder1.__metadata&deep.Test");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__metadata&deep/routes.project.publicProject.data.testFolder2.__metadata&deep.Test");

// PRIVATE PROJECT FOLDER LEVEL ?metadata&deep
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__metadata&deep/routes.project.privateProject.data.testFolder1.__metadata&deep.Test");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__metadata&deep/routes.project.privateProject.data.testFolder2.__metadata&deep.Test");

// METADATA ONLY PROJECT FOLDER LEVEL ?metadata&deep
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__metadata&deep/routes.project.metadataonlyProject.data.testFolder1.__metadata&deep.Test");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__metadata&deep/routes.project.metadataonlyProject.data.testFolder2.__metadata&deep.Test");

// PUBLIC PROJECT FOLDER LEVEL ?parent_metadata
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__parent_metadata/routes.project.publicProject.data.testFolder1.__parent_metadata.Test");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__parent_metadata/routes.project.publicProject.data.testFolder2.__parent_metadata.Test");

// PRIVATE PROJECT FOLDER LEVEL ?parent_metadata
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__parent_metadata/routes.project.privateProject.data.testFolder1.__parent_metadata.Test");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__parent_metadata/routes.project.privateProject.data.testFolder2.__parent_metadata.Test");

// METADATA ONLY PROJECT FOLDER LEVEL ?parent_metadata
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__parent_metadata/routes.project.metadataonlyProject.data.testFolder1.__parent_metadata.Test");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__parent_metadata/routes.project.metadataonlyProject.data.testFolder2.__parent_metadata.Test");

// PUBLIC PROJECT FOLDER LEVEL /project/:handle/data/:folderHandle(default case)
/* rlequire("dendro", "test/routes/project/public_project/data/testFolder1/routes.project.publicProject.data.testFolder1.Test");
 rlequire("dendro", "test/routes/project/public_project/data/testFolder2/routes.project.publicProject.data.testFolder2.Test");

 //PRIVATE PROJECT FOLDER LEVEL /project/:handle/data/:folderHandle(default case)
 rlequire("dendro", "test/routes/project/private_project/data/testFolder1/routes.project.privateProject.data.testFolder1.Test");
 rlequire("dendro", "test/routes/project/private_project/data/testFolder2/routes.project.privateProject.data.testFolder2.Test");

 //METADATA ONLY PROJECT FOLDER LEVEL /project/:handle/data/:folderHandle(default case)
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/routes.project.metadataonlyProject.data.testFolder1.Test");
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/routes.project.metadataonlyProject.data.testFolder2.Test"); */

/*
 //test login
 require("./controllers/auth.Test.js");

 //test projects
 require("./controllers/projects.Test.js");

 //test file uploads
 require("./controllers/files.Test.js");

 //test folders
 require("./controllers/folders.Test.js");
 */
/*
 //test descriptors
 require("./controllers/descriptors.Test.js");

 //SOCIAL DENDRO
 //test Social Dendro Posts
 require("./controllers/social/posts.Test.js");

 //test Social Dendro File Versions
 require("./controllers/social/fileVersions.Test.js");

 //test Social Dendro Notifications
 require("./controllers/social/notifications.Test.js");

 //destroy graphs
 require('./models/kb/db.Test.js');
 */

// PROJECT WITH B2DROP STORAGE (To revisit later!)
// rlequire("dendro", "test/routes/project/b2drop_project/data/testFolder1/__upload/routes.project.b2dropProject.data.testFolder1.__upload.Test.js");
// rlequire("dendro", "test/routes/project/b2drop_project/data/testFolder1/a_filename/__rename/routes.project.b2dropProject.data.testFolder1.a_filename.__rename.Test.js");
// rlequire("dendro", "test/routes/project/b2drop_project/data/testFolder1/a_filename/__cut/routes.project.b2dropProject.data.testFolder1.a_filename.__cut.Test.js");
// rlequire("dendro", "test/routes/project/b2drop_project/__bagit/routes.project.b2dropProject.__bagit.Test.js");
// rlequire("dendro", "test/routes/project/b2drop_project/__delete/routes.project.b2dropProject.__delete.Test.js");

// PROJECT WITH LOCAL STORAGE
// test file uploads
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__upload/routes.project.privateProject.data.testFolder1.__upload.Test.js");

// test file renaming
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/a_filename/__rename/routes.project.privateProject.data.testFolder1.a_filename.__rename.Test.js");

// test file moving
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/a_filename/__cut/routes.project.privateProject.data.testFolder1.a_filename.__cut.Test.js");

// Test project backups in BagIt 0.97 Format
rlequire("dendro", "test/routes/project/private_project/__bagit/routes.project.privateProject.__bagit.Test.js");
rlequire("dendro", "test/routes/project/public_project/__bagit/routes.project.publicProject.__bagit.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/__bagit/routes.project.metadataOnlyProject.__bagit.Test.js");

// Delete a project
rlequire("dendro", "test/routes/project/public_project/__delete/routes.project.publicProject.__delete.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/__delete/routes.project.metadataOnlyProject.__delete.Test.js");
rlequire("dendro", "test/routes/project/private_project/__delete/routes.project.privateProject.__delete.Test.js");

// SOCIAL DENDRO TESTS

rlequire("dendro", "test/routes/socialDendro/my/routes.socialDendro.my.Test.js");

rlequire("dendro", "test/routes/posts/all/routes.posts.all.Test.js");

rlequire("dendro", "test/routes/posts/post/routes.posts.post.Test.js");

rlequire("dendro", "test/routes/posts/posts/routes.posts.posts.Test.js");

rlequire("dendro", "test/routes/posts/new/routes.posts.new.Test.js");

rlequire("dendro", "test/routes/posts/like/routes.posts.like.Test.js");

rlequire("dendro", "test/routes/posts/post/likes/routes.posts.post.likes.Test.js");

rlequire("dendro", "test/routes/posts/comment/routes.posts.comment.Test.js");

rlequire("dendro", "test/routes/posts/comments/routes.posts.comments.Test.js");

rlequire("dendro", "test/routes/posts/share/routes.posts.share.Test.js");

rlequire("dendro", "test/routes/posts/shares/routes.posts.shares.Test.js");

rlequire("dendro", "test/routes/posts/count/routes.posts.count.Test.js");

rlequire("dendro", "test/routes/posts/_uri/routes.posts._uri.Test.js");

rlequire("dendro", "test/routes/shares/_uri/routes.shares._uri.Test.js");

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

