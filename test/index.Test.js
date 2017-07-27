process.env.NODE_ENV = 'test';

const path = require('path');
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);

global.Pathfinder = Pathfinder;
global.Config = Config;
global.Config.testsTimeout = 30000;

global.tests = {};

/*
 require(Pathfinder.absPathInTestsFolder("/routes/search/routes.search.Test.js"));
 */

require(Pathfinder.absPathInTestsFolder("/cleanEverything.Test.js"));

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
/*require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__metadata/routes.project.publicProject.__metadata.Test"));

 //PRIVATE PROJECT ?metadata TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__metadata/routes.project.privateProject.__metadata.Test"));

 //METADATA ONLY PROJECT ?metadata TESTS
 require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__metadata/routes.project.metadataonlyProject.__metadata.Test"));*/

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

require(Pathfinder.absPathInTestsFolder("/routes/user/edit/routes.user.edit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/avatar/routes.user.avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/avatar/routes.user.avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser1/avatar/routes.user.demouser1.avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser2/avatar/routes.user.demouser2.avatar.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/user/demouser3/avatar/routes.user.demouser3.avatar.Test.js"));

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