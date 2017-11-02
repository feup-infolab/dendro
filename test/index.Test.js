process.env.NODE_ENV = "test";

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;


if(process.env.RUNNING_IN_JENKINS) {
    Config.testsTimeout = 1200000;
}
else
{
    Config.testsTimeout = 600000;
}


console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

require(Pathfinder.absPathInTestsFolder("/init/loadOntologiesCache.Test.js"));

//administer projects
require(Pathfinder.absPathInTestsFolder("routes/project/public_project/__administer/routes.project.publicProject.__administerTest.js"));

//USERS
require(Pathfinder.absPathInTestsFolder("/routes/users/loggedUser/route.users.loggedUser.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/users/route.users.Test.js"));

//USER
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser1/route.user.demouser1.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser2/route.user.demouser2.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser3/route.user.demouser3.Test.js"));

//EDIT USERS
require(Pathfinder.absPathInTestsFolder("/routes/user/edit/routes.user.edit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user_avatar/routes.user_avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser1/avatar/routes.user.demouser1.avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser2/avatar/routes.user.demouser2.avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser3/avatar/routes.user.demouser3.avatar.Test.js"));


require(Pathfinder.absPathInTestsFolder("/routes/projects/route.projects.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/projects/my/route.projects.my.Test.js"));
/*require(Pathfinder.absPathInTestsFolder("/routes/projects/new/route.projects.new.Test.js"));*/

/*require(Pathfinder.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.dcterms.Test.js"));
 require(Pathfinder.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.foaf.Test.js"));*/
require(Pathfinder.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.Test.js"));

/*require(Pathfinder.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));*/

//PUBLIC PROJECT
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/request_access/route.projects.publicProject.__request_access.Test.js"));*/
/*require(Pathfinder.absPathInTestsFolder("/routes/project/metadataonly_project/request_access/route.projects.metadataonlyProject.__request_access.Test.js"));*/
/*require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/request_access/route.projects.privateProject.__request_access.Test.js"));*/

//PROJECT VERSION PUBLIC PROJECT THIS TEST SHOULD BE DELETED BECAUSE THE FEATURE DOES NOT EXIST
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__version/routes.project.publicProject.__version.Test.js"));*/

//PUBLIC PROJECT ROOT MKDIR TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js"));
//PRIVATE PROJECT ROOT MKDIR TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__mkdir/routes.project.privateProject.__mkdir.Test.js"));
//METADATA ONLY PROJECT ROOT MKDIR TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__mkdir/routes.project.metadataonlyProject.__mkdir.Test.js"));

//EXPORT PUBLIC PROJECT TO REPOSITORIES TESTS
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__export_to_repository/routes.project.publicProject.__export_to_repository.Test"));
 //EXPORT PRIVATE PROJECT TO REPOSITORIES TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__export_to_repository/routes.project.privateProject.__export_to_repository.Test"));
 //EXPORT METADATA ONLY PROJECT TO REPOSITORIES TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__export_to_repository/routes.project.metadataonlyProject.__export_to_repository.Test"));*/

//PUBLIC PROJECT FOLDER LEVEL ?MKDIR
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__mkdir/routes.project.publicProject.data.testFolder1.__mkdir.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__mkdir/routes.project.publicProject.data.testFolder2.__mkdir.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?MKDIR
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__mkdir/routes.project.privateProject.data.testFolder1.__mkdir.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__mkdir/routes.project.privateProject.data.testFolder2.__mkdir.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?MKDIR
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__mkdir/routes.project.metadataonlyProject.data.testFolder1.__mkdir.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__mkdir/routes.project.metadataonlyProject.data.testFolder2.__mkdir.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL ?export_to_repository
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__export_to_repository/routes.project.publicProject.data.testFolder1.__export_to_repository.Test.js"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__export_to_repository/routes.project.publicProject.data.testFolder2.__export_to_repository.Test.js"));

 //PRIVATE PROJECT FOLDER LEVEL ?export_to_repository
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__export_to_repository/routes.project.privateProject.data.testFolder1.__export_to_repository.Test.js"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__export_to_repository/routes.project.privateProject.data.testFolder2.__export_to_repository.Test.js"));

 //METADATA ONLY PROJECT FOLDER LEVEL ?export_to_repository
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__export_to_repository/routes.project.metadataonlyProject.data.testFolder1.__export_to_repository.Test.js"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__export_to_repository/routes.project.metadataonlyProject.data.testFolder2.__export_to_repository.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?update_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__update_metadata/routes.project.publicProject.data.testFolder1.__update_metadata.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__update_metadata/routes.project.publicProject.data.testFolder2.__update_metadata.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?update_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__update_metadata/routes.project.privateProject.data.testFolder1.__update_metadata.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__update_metadata/routes.project.privateProject.data.testFolder2.__update_metadata.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?update_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__update_metadata/routes.project.metadataonlyProject.data.testFolder1.__update_metadata.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__update_metadata/routes.project.metadataonlyProject.data.testFolder2.__update_metadata.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL ?restore_metadata_version
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__restore_metadata_version/routes.project.publicProject.data.testFolder1.__restore_metadata_version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__restore_metadata_version/routes.project.publicProject.data.testFolder2.__restore_metadata_version.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?restore_metadata_version
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__restore_metadata_version/routes.project.privateProject.data.testFolder1.__restore_metadata_version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__restore_metadata_version/routes.project.privateProject.data.testFolder2.__restore_metadata_version.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?restore_metadata_version
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__restore_metadata_version/routes.project.metadataonlyProject.data.testFolder1.__restore_metadata_version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__restore_metadata_version/routes.project.metadataonlyProject.data.testFolder2.__restore_metadata_version.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL ?undelete
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__undelete/routes.project.publicProject.data.testFolder1.__undelete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__undelete/routes.project.publicProject.data.testFolder2.__undelete.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?undelete
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__undelete/routes.project.privateProject.data.testFolder1.__undelete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__undelete/routes.project.privateProject.data.testFolder2.__undelete.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?undelete
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__undelete/routes.project.metadataonlyProject.data.testFolder1.__undelete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__undelete/routes.project.metadataonlyProject.data.testFolder2.__undelete.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL soft ?delete
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__delete/routes.project.publicProject.data.testFolder1.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__delete/routes.project.publicProject.data.testFolder2.__delete.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL soft ?delete
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__delete/routes.project.privateProject.data.testFolder1.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__delete/routes.project.privateProject.data.testFolder2.__delete.Test.js"));

//METADATA  ONLY PROJECT FOLDER LEVEL soft ?delete
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__delete/routes.project.metadataonlyProject.data.testFolder1.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__delete/routes.project.metadataonlyProject.data.testFolder2.__delete.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL hard ?delete
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__hard_delete/routes.project.publicProject.data.testFolder1.__hard_delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__hard_delete/routes.project.publicProject.data.testFolder2.__hard_delete.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL hard ?delete
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__hard_delete/routes.project.privateProject.data.testFolder1.__hard_delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__hard_delete/routes.project.privateProject.data.testFolder2.__hard_delete.Test.js"));

//METADATA  ONLY PROJECT FOLDER LEVEL hard ?delete
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__hard_delete/routes.project.metadataonlyProject.data.testFolder1.__hard_delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__hard_delete/routes.project.metadataonlyProject.data.testFolder2.__hard_delete.Test.js"));

//external_repositories TESTS
/*require(Pathfinder.absPathInTestsFolder("/routes/external_repositories/route.externalRepositories.Test.js"));*/

//PUBLIC PROJECT ?metadata_recommendations TESTS
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__metadata_recommendations/routes.project.publicProject.__metadata_recommendations.Test"));

 //PRIVATE PROJECT ?metadata_recommendations TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__metadata_recommendations/routes.project.privateProject.__metadata_recommendations.Test"));

 //METADATA ONLY PROJECT ?metadata_recommendations TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__metadata_recommendations/routes.project.metadataonlyProject.__metadata_recommendations.Test"));*/

//PUBLIC PROJECT ?recommendation_ontologies TESTS
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__recommendation_ontologies/routes.project.publicProject.__recommendation_ontologies.Test"));

 //PRIVATE PROJECT ?recommendation_ontologies TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__recommendation_ontologies/routes.project.privateProject.__recommendation_ontologies.Test"));

 //METADATA PROJECT ?recommendation_ontologies TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__recommendation_ontologies/routes.project.metadataonlyProject.__recommendation_ontologies.Test"));*/

//PUBLIC PROJECT ?metadata TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__metadata/routes.project.publicProject.__metadata.Test"));

//PRIVATE PROJECT ?metadata TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__metadata/routes.project.privateProject.__metadata.Test"));

//METADATA ONLY PROJECT ?metadata TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__metadata/routes.project.metadataonlyProject.__metadata.Test"));

//PUBLIC PROJECT ?metadata&deep TESTS
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__metadata&deep/routes.project.publicProject.__metadata&deep.Test"));

 //PRIVATE PROJECT ?metadata&deep TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__metadata&deep/routes.project.privateProject.__metadata&deep.Test"));

 //METADATA ONLY PROJECT ?metadata&deep TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__metadata&deep/routes.project.metadataonlyProject.__metadata&deep.Test"));*/

//PUBLIC PROJECT ROOT TESTS
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/routes.project.publicProject.Test"));

 //PRIVATE PROJECT ROOT TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/routes.project.privateProject.Test"));

 //METADATA ONLY PROJECT ROOT TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/routes.project.metadataonlyProject.Test"));*/

//PUBLIC PROJECT FOLDER LEVEL ?metadata_recommendations
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__metadata_recommendations/routes.project.publicProject.data.testFolder1.__metadata_recommendations.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__metadata_recommendations/routes.project.publicProject.data.testFolder2.__metadata_recommendations.Test"));

 //PRIVATE PROJECT FOLDER LEVEL ?metadata_recommendations
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__metadata_recommendations/routes.project.privateProject.data.testFolder1.__metadata_recommendations.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__metadata_recommendations/routes.project.privateProject.data.testFolder2.__metadata_recommendations.Test"));

 //METADATA ONLY PROJECT FOLDER LEVEL ?metadata_recommendations
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__metadata_recommendations/routes.project.metadataonlyProject.data.testFolder1.__metadata_recommendations.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__metadata_recommendations/routes.project.metadataonlyProject.data.testFolder2.__metadata_recommendations.Test"));*/

//PUBLIC PROJECT FOLDER LEVEL ?recommendation_ontologies
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__recommendation_ontologies/routes.project.publicProject.data.testFolder1.__recommendation_ontologies.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__recommendation_ontologies/routes.project.publicProject.data.testFolder2.__recommendation_ontologies.Test"));

 //PRIVATE PROJECT FOLDER LEVEL ?recommendation_ontologies
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__recommendation_ontologies/routes.project.privateProject.data.testFolder1.__recommendation_ontologies.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__recommendation_ontologies/routes.project.privateProject.data.testFolder2.__recommendation_ontologies.Test"));

 //METADATA ONLY PROJECT FOLDER LEVEL ?recommendation_ontologies
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__recommendation_ontologies/routes.project.metadataonlyProject.data.testFolder1.__recommendation_ontologies.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__recommendation_ontologies/routes.project.metadataonlyProject.data.testFolder2.__recommendation_ontologies.Test"));*/

//PUBLIC PROJECT FOLDER LEVEL ?metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__metadata/routes.project.publicProject.data.testFolder1.__metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__metadata/routes.project.publicProject.data.testFolder2.__metadata.Test"));

//PRIVATE PROJECT FOLDER LEVEL ?metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__metadata/routes.project.privateProject.data.testFolder1.__metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__metadata/routes.project.privateProject.data.testFolder2.__metadata.Test"));

//METADATA ONLY PROJECT FOLDER LEVEL ?metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__metadata/routes.project.metadataonlyProject.data.testFolder1.__metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__metadata/routes.project.metadataonlyProject.data.testFolder2.__metadata.Test"));

//PUBLIC PROJECT FOLDER LEVEL ?metadata&deep
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__metadata&deep/routes.project.publicProject.data.testFolder1.__metadata&deep.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__metadata&deep/routes.project.publicProject.data.testFolder2.__metadata&deep.Test"));

//PRIVATE PROJECT FOLDER LEVEL ?metadata&deep
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__metadata&deep/routes.project.privateProject.data.testFolder1.__metadata&deep.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__metadata&deep/routes.project.privateProject.data.testFolder2.__metadata&deep.Test"));

//METADATA ONLY PROJECT FOLDER LEVEL ?metadata&deep
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__metadata&deep/routes.project.metadataonlyProject.data.testFolder1.__metadata&deep.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__metadata&deep/routes.project.metadataonlyProject.data.testFolder2.__metadata&deep.Test"));

//PUBLIC PROJECT FOLDER LEVEL ?parent_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__parent_metadata/routes.project.publicProject.data.testFolder1.__parent_metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__parent_metadata/routes.project.publicProject.data.testFolder2.__parent_metadata.Test"));

//PRIVATE PROJECT FOLDER LEVEL ?parent_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__parent_metadata/routes.project.privateProject.data.testFolder1.__parent_metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__parent_metadata/routes.project.privateProject.data.testFolder2.__parent_metadata.Test"));

//METADATA ONLY PROJECT FOLDER LEVEL ?parent_metadata
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__parent_metadata/routes.project.metadataonlyProject.data.testFolder1.__parent_metadata.Test"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__parent_metadata/routes.project.metadataonlyProject.data.testFolder2.__parent_metadata.Test"));

//PUBLIC PROJECT FOLDER LEVEL /project/:handle/data/:folderHandle(default case)
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/routes.project.publicProject.data.testFolder1.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/routes.project.publicProject.data.testFolder2.Test"));

 //PRIVATE PROJECT FOLDER LEVEL /project/:handle/data/:folderHandle(default case)
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/routes.project.privateProject.data.testFolder1.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/routes.project.privateProject.data.testFolder2.Test"));

 //METADATA ONLY PROJECT FOLDER LEVEL /project/:handle/data/:folderHandle(default case)
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/routes.project.metadataonlyProject.data.testFolder1.Test"));
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/routes.project.metadataonlyProject.data.testFolder2.Test"));*/

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

//test file uploads
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__upload/routes.project.privateProject.data.testFolder1.__upload.Test.js"));

//test file renaming
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/a_filename/__rename/routes.project.privateProject.data.testFolder1.a_filename.__rename.Test.js"));

//test file moving
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/a_filename/__cut/routes.project.privateProject.data.testFolder1.a_filename.__cut.Test.js"));

// Test project backups in BagIt 0.97 Format
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__bagit/routes.project.privateProject.__bagit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__bagit/routes.project.publicProject.__bagit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__bagit/routes.project.metadataOnlyProject.__bagit.Test.js"));

//Delete a project
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__delete/routes.project.publicProject.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__delete/routes.project.metadataOnlyProject.__delete.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__delete/routes.project.privateProject.__delete.Test.js"));


//SOCIAL DENDRO TESTS

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

//END OF SOCIAL DENDRO TESTS


//PUBLIC PROJECT FOLDER LEVEL ?VERSION
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__version/routes.project.publicProject.data.testFolder1.__version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__version/routes.project.publicProject.data.testFolder2.__version.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?VERSION
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__version/routes.project.privateProject.data.testFolder1.__version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__version/routes.project.privateProject.data.testFolder2.__version.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?VERSION
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__version/routes.project.metadataonlyProject.data.testFolder1.__version.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__version/routes.project.metadataonlyProject.data.testFolder2.__version.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__change_log/routes.project.publicProject.data.testFolder1.__change_log.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__change_log/routes.project.publicProject.data.testFolder2.__change_log.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__change_log/routes.project.privateProject.data.testFolder1.__change_log.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__change_log/routes.project.privateProject.data.testFolder2.__change_log.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__change_log/routes.project.metadataonlyProject.data.testFolder1.__change_log.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__change_log/routes.project.metadataonlyProject.data.testFolder2.__change_log.Test.js"));


//PROJECT CHANGES PUBLIC PROJECT
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__recent_changes/routes.project.publicProject.__recent_changes.Test.js"));
//PROJECT CHANGES PRIVATE PROJECT
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__recent_changes/routes.project.privateProject.__recent_changes.Test.js"));
//PROJECT CHANGES METADADATA ONlY PROJECT
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__recent_changes/routes.project.metadataonlyProject.__recent_changes.Test.js"));

//PUBLIC PROJECT FOLDER LEVEL RECENT CHANGES
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__recent_changes/routes.project.publicProject.data.testFolder1.__recent_changes.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__recent_changes/routes.project.publicProject.data.testFolder2.__recent_changes.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL RECENT CHANGES
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__recent_changes/routes.project.privateProject.data.testFolder1.__recent_changes.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__recent_changes/routes.project.privateProject.data.testFolder2.__recent_changes.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL RECENT CHANGES
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__recent_changes/routes.project.metadataonlyProject.data.testFolder1.__recent_changes.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__recent_changes/routes.project.metadataonlyProject.data.testFolder2.__recent_changes.Test.js"));

//Archived versions test
require(Pathfinder.absPathInTestsFolder("/routes/archived_resource/routes.archivedResource.Test.js"));

//Import projects tests
require(Pathfinder.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));

/*
 require(Pathfinder.absPathInTestsFolder("/routes/search/routes.search.Test.js"));
 */