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

rlequire("dendro", "test/routes/posts/all/routes.posts.all.Test.js");

rlequire("dendro", "test/routes/posts/all/routes.posts.all.ranked.Test.js");

return;

// PROJECTS
// Create projects of different visibilities and storage types
rlequire("dendro", "test/routes/projects/new/route.projects.new.Test.js");
// users project listings
rlequire("dendro", "test/routes/projects/route.projects.Test.js");
// users project listings
rlequire("dendro", "test/routes/projects/my/route.projects.my.Test.js");

/* rlequire("dendro", "test/routes/descriptors/from_ontology/route.descriptors.from_ontology.dcterms.Test.js");
 rlequire("dendro", "test/routes/descriptors/from_ontology/route.descriptors.from_ontology.foaf.Test.js"); */
rlequire("dendro", "test/routes/descriptors/from_ontology/route.descriptors.from_ontology.Test.js");

// PUBLIC PROJECT
/* rlequire("dendro", "test/routes/project/public_project/request_access/route.projects.publicProject.__request_access.Test.js"); */
/* rlequire("dendro", "test/routes/project/metadataonly_project/request_access/route.projects.metadataonlyProject.__request_access.Test.js"); */
/* rlequire("dendro", "test/routes/project/private_project/request_access/route.projects.privateProject.__request_access.Test.js"); */

// PROJECT VERSION PUBLIC PROJECT THIS TEST SHOULD BE DELETED BECAUSE THE FEATURE DOES NOT EXIST
/* rlequire("dendro", "test/routes/project/public_project/__version/routes.project.publicProject.__version.Test.js"); */

// PUBLIC PROJECT ROOT MKDIR TESTS
rlequire("dendro", "test/routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js");
// PRIVATE PROJECT ROOT MKDIR TESTS
rlequire("dendro", "test/routes/project/private_project/__mkdir/routes.project.privateProject.__mkdir.Test.js");
// METADATA ONLY PROJECT ROOT MKDIR TESTS
rlequire("dendro", "test/routes/project/metadata_only_project/__mkdir/routes.project.metadataonlyProject.__mkdir.Test.js");

// EXPORT PUBLIC PROJECT TO REPOSITORIES TESTS
/* rlequire("dendro", "test/routes/project/public_project/__export_to_repository/routes.project.publicProject.__export_to_repository.Test");
 //EXPORT PRIVATE PROJECT TO REPOSITORIES TESTS
 rlequire("dendro", "test/routes/project/private_project/__export_to_repository/routes.project.privateProject.__export_to_repository.Test");
 //EXPORT METADATA ONLY PROJECT TO REPOSITORIES TESTS
 rlequire("dendro", "test/routes/project/metadata_only_project/__export_to_repository/routes.project.metadataonlyProject.__export_to_repository.Test"); */

// PUBLIC PROJECT FOLDER LEVEL ?MKDIR
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__mkdir/routes.project.publicProject.data.testFolder1.__mkdir.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__mkdir/routes.project.publicProject.data.testFolder2.__mkdir.Test.js");

// PRIVATE PROJECT FOLDER LEVEL ?MKDIR
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__mkdir/routes.project.privateProject.data.testFolder1.__mkdir.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__mkdir/routes.project.privateProject.data.testFolder2.__mkdir.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL ?MKDIR
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__mkdir/routes.project.metadataonlyProject.data.testFolder1.__mkdir.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__mkdir/routes.project.metadataonlyProject.data.testFolder2.__mkdir.Test.js");

// PUBLIC PROJECT FOLDER LEVEL ?export_to_repository
/* rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__export_to_repository/routes.project.publicProject.data.testFolder1.__export_to_repository.Test.js");
 rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__export_to_repository/routes.project.publicProject.data.testFolder2.__export_to_repository.Test.js");

 //PRIVATE PROJECT FOLDER LEVEL ?export_to_repository
 rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__export_to_repository/routes.project.privateProject.data.testFolder1.__export_to_repository.Test.js");
 rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__export_to_repository/routes.project.privateProject.data.testFolder2.__export_to_repository.Test.js");

 //METADATA ONLY PROJECT FOLDER LEVEL ?export_to_repository
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__export_to_repository/routes.project.metadataonlyProject.data.testFolder1.__export_to_repository.Test.js");
 rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__export_to_repository/routes.project.metadataonlyProject.data.testFolder2.__export_to_repository.Test.js"); */

// PUBLIC PROJECT FOLDER LEVEL ?update_metadata
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__update_metadata/routes.project.publicProject.data.testFolder1.__update_metadata.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__update_metadata/routes.project.publicProject.data.testFolder2.__update_metadata.Test.js");

// PRIVATE PROJECT FOLDER LEVEL ?update_metadata
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__update_metadata/routes.project.privateProject.data.testFolder1.__update_metadata.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__update_metadata/routes.project.privateProject.data.testFolder2.__update_metadata.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL ?update_metadata
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__update_metadata/routes.project.metadataonlyProject.data.testFolder1.__update_metadata.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__update_metadata/routes.project.metadataonlyProject.data.testFolder2.__update_metadata.Test.js");

// PUBLIC PROJECT FOLDER LEVEL ?undelete
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__undelete/routes.project.publicProject.data.testFolder1.__undelete.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__undelete/routes.project.publicProject.data.testFolder2.__undelete.Test.js");

// PRIVATE PROJECT FOLDER LEVEL ?undelete
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__undelete/routes.project.privateProject.data.testFolder1.__undelete.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__undelete/routes.project.privateProject.data.testFolder2.__undelete.Test.js");

// METADATA ONLY PROJECT FOLDER LEVEL ?undelete
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__undelete/routes.project.metadataonlyProject.data.testFolder1.__undelete.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__undelete/routes.project.metadataonlyProject.data.testFolder2.__undelete.Test.js");

// PUBLIC PROJECT FOLDER LEVEL soft ?delete
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__delete/routes.project.publicProject.data.testFolder1.__delete.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__delete/routes.project.publicProject.data.testFolder2.__delete.Test.js");

// PRIVATE PROJECT FOLDER LEVEL soft ?delete
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__delete/routes.project.privateProject.data.testFolder1.__delete.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__delete/routes.project.privateProject.data.testFolder2.__delete.Test.js");

// METADATA  ONLY PROJECT FOLDER LEVEL soft ?delete
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__delete/routes.project.metadataonlyProject.data.testFolder1.__delete.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__delete/routes.project.metadataonlyProject.data.testFolder2.__delete.Test.js");

// PUBLIC PROJECT FOLDER LEVEL hard ?delete
rlequire("dendro", "test/routes/project/public_project/data/testFolder1/__hard_delete/routes.project.publicProject.data.testFolder1.__hard_delete.Test.js");
rlequire("dendro", "test/routes/project/public_project/data/testFolder2/__hard_delete/routes.project.publicProject.data.testFolder2.__hard_delete.Test.js");

// PRIVATE PROJECT FOLDER LEVEL hard ?delete
rlequire("dendro", "test/routes/project/private_project/data/testFolder1/__hard_delete/routes.project.privateProject.data.testFolder1.__hard_delete.Test.js");
rlequire("dendro", "test/routes/project/private_project/data/testFolder2/__hard_delete/routes.project.privateProject.data.testFolder2.__hard_delete.Test.js");

// METADATA  ONLY PROJECT FOLDER LEVEL hard ?delete
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder1/__hard_delete/routes.project.metadataonlyProject.data.testFolder1.__hard_delete.Test.js");
rlequire("dendro", "test/routes/project/metadata_only_project/data/testFolder2/__hard_delete/routes.project.metadataonlyProject.data.testFolder2.__hard_delete.Test.js");

// external_repositories TESTS
/* rlequire("dendro", "test/routes/external_repositories/route.externalRepositories.Test.js"); */

// PUBLIC PROJECT ?metadata_recommendations TESTS
/* rlequire("dendro", "test/routes/project/public_project/__metadata_recommendations/routes.project.publicProject.__metadata_recommendations.Test");

 //PRIVATE PROJECT ?metadata_recommendations TESTS
 rlequire("dendro", "test/routes/project/private_project/__metadata_recommendations/routes.project.privateProject.__metadata_recommendations.Test");

 //METADATA ONLY PROJECT ?metadata_recommendations TESTS
 rlequire("dendro", "test/routes/project/metadata_only_project/__metadata_recommendations/routes.project.metadataonlyProject.__metadata_recommendations.Test"); */

// PUBLIC PROJECT ?recommendation_ontologies TESTS
/* rlequire("dendro", "test/routes/project/public_project/__recommendation_ontologies/routes.project.publicProject.__recommendation_ontologies.Test");

 //PRIVATE PROJECT ?recommendation_ontologies TESTS
 rlequire("dendro", "test/routes/project/private_project/__recommendation_ontologies/routes.project.privateProject.__recommendation_ontologies.Test");

 //METADATA PROJECT ?recommendation_ontologies TESTS
 rlequire("dendro", "test/routes/project/metadata_only_project/__recommendation_ontologies/routes.project.metadataonlyProject.__recommendation_ontologies.Test"); */

// PUBLIC PROJECT ?metadata TESTS
rlequire("dendro", "test/routes/project/public_project/__metadata/routes.project.publicProject.__metadata.Test");

// PRIVATE PROJECT ?metadata TESTS
rlequire("dendro", "test/routes/project/private_project/__metadata/routes.project.privateProject.__metadata.Test");

// METADATA ONLY PROJECT ?metadata TESTS
rlequire("dendro", "test/routes/project/metadata_only_project/__metadata/routes.project.metadataonlyProject.__metadata.Test");

// PUBLIC PROJECT ?metadata&deep TESTS
rlequire("dendro", "test/routes/project/public_project/__metadata&deep/routes.project.publicProject.__metadata&deep.Test");

// PRIVATE PROJECT ?metadata&deep TESTS
rlequire("dendro", "test/routes/project/private_project/__metadata&deep/routes.project.privateProject.__metadata&deep.Test");

// METADATA ONLY PROJECT ?metadata&deep TESTS
rlequire("dendro", "test/routes/project/metadata_only_project/__metadata&deep/routes.project.metadataonlyProject.__metadata&deep.Test");

// PUBLIC PROJECT ROOT TESTS
rlequire("dendro", "test/routes/project/public_project/routes.project.publicProject.Test");

// PRIVATE PROJECT ROOT TESTS
rlequire("dendro", "test/routes/project/private_project/routes.project.privateProject.Test");

// METADATA ONLY PROJECT ROOT TESTS
rlequire("dendro", "test/routes/project/metadata_only_project/routes.project.metadataonlyProject.Test");

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

rlequire("dendro", "test/routes/social/my/routes.social.my.Test.js");

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

// TODO get proper order of posts and fix tests (join timeline, timeline_posts
// TODO and posts query and see the place in the timeline where each post we need is. Update positions in these tests!

// rlequire("dendro", "test/routes/posts/_uri/routes.posts._uri.Test.js");

// rlequire("dendro", "test/routes/shares/_uri/routes.shares._uri.Test.js");

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

