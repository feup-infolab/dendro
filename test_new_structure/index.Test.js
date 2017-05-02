process.env.NODE_ENV = 'test';

GLOBAL.tests = {};

let Config = GLOBAL.Config = Object.create(require("../src/models/meta/config.js").Config);
Config.initGlobals();

GLOBAL.tests = {};

/*
require(Config.absPathInTestsFolder("/routes/search/routes.search.Test.js"));
*/

/*
require(Config.absPathInTestsFolder("/routes/projects/route.projects.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/my/route.projects.my.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/new/route.projects.new.Test.js"));
*/

/*require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.dcterms.Test.js"));
require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.foaf.Test.js"));
require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.Test.js"));*/

//require(Config.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));

//PUBLIC PROJECT
/*
require(Config.absPathInTestsFolder("/routes/projects/public_project/request_access/route.projects.PublicProject.requestAccess.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/public_project/delete/route.projects.PublicProject.delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/public_project/undelete/route.projects.PublicProject.undelete.Test.js"));
*/

//METADATA PROJECT
/*
require(Config.absPathInTestsFolder("/routes/projects/metadataonly_project/request_access/route.projects.metadataonlyProject.requestAccess.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/metadataonly_project/delete/route.projects.metadataonlyProject.delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/metadataonly_project/undelete/route.projects.metadataonlyProject.undelete.Test.js"));
*/

//PRIVATE PROJECT
/*
require(Config.absPathInTestsFolder("/routes/projects/private_project/request_access/route.projects.privateProject.requestAccess.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/private_project/delete/route.projects.privateProject.delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/projects/private_project/undelete/route.projects.privateProject.undelete.Test.js"));
*/


//PROJECT CHANGES PUBLIC PROJECT
/*require(Config.absPathInTestsFolder("/routes/project/public_project/__recent_changes/routes.project.publicProject.__recent_changes.Test.js"));
//PROJECT CHANGES PRIVATE PROJECT
require(Config.absPathInTestsFolder("/routes/project/private_project/__recent_changes/routes.project.privateProject.__recent_changes.Test.js"));
//PROJECT CHANGES METADADATA ONlY PROJECT
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/__recent_changes/routes.project.metadataonlyProject.__recent_changes.Test.js"));*/

//PROJECT VERSION PUBLIC PROJECT THIS TEST SHOULD BE DELETED BECAUSE THE FEATURE DOES NOT EXIST
//require(Config.absPathInTestsFolder("/routes/project/public_project/__version/routes.project.publicProject.__version.Test.js"));

//PUBLIC PROJECT ROOT MKDIR TESTS
/*
require(Config.absPathInTestsFolder("/routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js"));
//PRIVATE PROJECT ROOT MKDIR TESTS
require(Config.absPathInTestsFolder("/routes/project/private_project/__mkdir/routes.project.privateProject.__mkdir.Test.js"));
//METADATA ONLY PROJECT ROOT MKDIR TESTS
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/__mkdir/routes.project.metadataonlyProject.__mkdir.Test.js"));
*/

/*
//EXPORT PUBLIC PROJECT TO REPOSITORIES TESTS
require(Config.absPathInTestsFolder("/routes/project/public_project/__export_to_repository/routes.project.publicProject.__export_to_repository.Test"));
//EXPORT PRIVATE PROJECT TO REPOSITORIES TESTS
require(Config.absPathInTestsFolder("/routes/project/private_project/__export_to_repository/routes.project.privateProject.__export_to_repository.Test"));
//EXPORT METADATA ONLY PROJECT TO REPOSITORIES TESTS
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/__export_to_repository/routes.project.metadataonlyProject.__export_to_repository.Test"));
*/

//PUBLIC PROJECT FOLDER LEVEL RECENT CHANGES
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__recent_changes/routes.project.publicProject.data.testFolder1.__recent_changes.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__recent_changes/routes.project.publicProject.data.testFolder2.__recent_changes.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL RECENT CHANGES
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__recent_changes/routes.project.privateProject.data.testFolder1.__recent_changes.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__recent_changes/routes.project.privateProject.data.testFolder2.__recent_changes.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL RECENT CHANGES
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__recent_changes/routes.project.metadataonlyProject.data.testFolder1.__recent_changes.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__recent_changes/routes.project.metadataonlyProject.data.testFolder2.__recent_changes.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?VERSION
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__version/routes.project.publicProject.data.testFolder1.__version.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__version/routes.project.publicProject.data.testFolder2.__version.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?VERSION
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__version/routes.project.privateProject.data.testFolder1.__version.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__version/routes.project.privateProject.data.testFolder2.__version.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?VERSION
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__version/routes.project.metadataonlyProject.data.testFolder1.__version.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__version/routes.project.metadataonlyProject.data.testFolder2.__version.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?CHANGE_LOG
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__change_log/routes.project.publicProject.data.testFolder1.__change_log.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__change_log/routes.project.publicProject.data.testFolder2.__change_log.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__change_log/routes.project.privateProject.data.testFolder1.__change_log.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__change_log/routes.project.privateProject.data.testFolder2.__change_log.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?CHANGE_LOG
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__change_log/routes.project.metadataonlyProject.data.testFolder1.__change_log.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__change_log/routes.project.metadataonlyProject.data.testFolder2.__change_log.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?MKDIR
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__mkdir/routes.project.publicProject.data.testFolder1.__mkdir.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__mkdir/routes.project.publicProject.data.testFolder2.__mkdir.Test.js"));*/

//PRIVATE PROJECT FOLDER LEVEL ?MKDIR
/*require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__mkdir/routes.project.privateProject.data.testFolder1.__mkdir.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__mkdir/routes.project.privateProject.data.testFolder2.__mkdir.Test.js"));*/

//METADATA ONLY PROJECT FOLDER LEVEL ?MKDIR
/*require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__mkdir/routes.project.metadataonlyProject.data.testFolder1.__mkdir.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__mkdir/routes.project.metadataonlyProject.data.testFolder2.__mkdir.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?export_to_repository
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__export_to_repository/routes.project.publicProject.data.testFolder1.__export_to_repository.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__export_to_repository/routes.project.publicProject.data.testFolder2.__export_to_repository.Test.js"));

//PRIVATE PROJECT FOLDER LEVEL ?export_to_repository
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__export_to_repository/routes.project.privateProject.data.testFolder1.__export_to_repository.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__export_to_repository/routes.project.privateProject.data.testFolder2.__export_to_repository.Test.js"));

//METADATA ONLY PROJECT FOLDER LEVEL ?export_to_repository
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__export_to_repository/routes.project.metadataonlyProject.data.testFolder1.__export_to_repository.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__export_to_repository/routes.project.metadataonlyProject.data.testFolder2.__export_to_repository.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?update_metadata
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__update_metadata/routes.project.publicProject.data.testFolder1.__update_metadata.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__update_metadata/routes.project.publicProject.data.testFolder2.__update_metadata.Test.js"));*/

//PRIVATE PROJECT FOLDER LEVEL ?update_metadata
/*require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__update_metadata/routes.project.privateProject.data.testFolder1.__update_metadata.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__update_metadata/routes.project.privateProject.data.testFolder2.__update_metadata.Test.js"));*/

//METADATA ONLY PROJECT FOLDER LEVEL ?update_metadata
/*require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__update_metadata/routes.project.metadataonlyProject.data.testFolder1.__update_metadata.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__update_metadata/routes.project.metadataonlyProject.data.testFolder2.__update_metadata.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?restore_metadata_version
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__restore_metadata_version/routes.project.publicProject.data.testFolder1.__restore_metadata_version.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__restore_metadata_version/routes.project.publicProject.data.testFolder2.__restore_metadata_version.Test.js"));*/

//PRIVATE PROJECT FOLDER LEVEL ?restore_metadata_version
/*require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__restore_metadata_version/routes.project.privateProject.data.testFolder1.__restore_metadata_version.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__restore_metadata_version/routes.project.privateProject.data.testFolder2.__restore_metadata_version.Test.js"));*/

//METADATA ONLY PROJECT FOLDER LEVEL ?restore_metadata_version
/*require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__restore_metadata_version/routes.project.metadataonlyProject.data.testFolder1.__restore_metadata_version.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__restore_metadata_version/routes.project.metadataonlyProject.data.testFolder2.__restore_metadata_version.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL ?undelete
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__undelete/routes.project.publicProject.data.testFolder1.__undelete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__undelete/routes.project.publicProject.data.testFolder2.__undelete.Test.js"));*/

//PRIVATE PROJECT FOLDER LEVEL ?undelete
/*require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__undelete/routes.project.privateProject.data.testFolder1.__undelete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__undelete/routes.project.privateProject.data.testFolder2.__undelete.Test.js"));*/

//METADATA ONLY PROJECT FOLDER LEVEL ?undelete
/*require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__undelete/routes.project.metadataonlyProject.data.testFolder1.__undelete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__undelete/routes.project.metadataonlyProject.data.testFolder2.__undelete.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL soft ?delete
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__delete/routes.project.publicProject.data.testFolder1.__delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__delete/routes.project.publicProject.data.testFolder2.__delete.Test.js"));*/

//PRIVATE PROJECT FOLDER LEVEL soft ?delete
/*require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__delete/routes.project.privateProject.data.testFolder1.__delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__delete/routes.project.privateProject.data.testFolder2.__delete.Test.js"));*/

//METADATA  ONLY PROJECT FOLDER LEVEL soft ?delete
/*require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__delete/routes.project.metadataonlyProject.data.testFolder1.__delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__delete/routes.project.metadataonlyProject.data.testFolder2.__delete.Test.js"));*/

//PUBLIC PROJECT FOLDER LEVEL hard ?delete
/*require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder1/__hard_delete/routes.project.publicProject.data.testFolder1.__hard_delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/data/testFolder2/__hard_delete/routes.project.publicProject.data.testFolder2.__hard_delete.Test.js"));*/

//PRIVATE PROJECT FOLDER LEVEL hard ?delete
/*require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder1/__hard_delete/routes.project.privateProject.data.testFolder1.__hard_delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/private_project/data/testFolder2/__hard_delete/routes.project.privateProject.data.testFolder2.__hard_delete.Test.js"));*/

//METADATA  ONLY PROJECT FOLDER LEVEL hard ?delete
/*require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder1/__hard_delete/routes.project.metadataonlyProject.data.testFolder1.__hard_delete.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/data/testFolder2/__hard_delete/routes.project.metadataonlyProject.data.testFolder2.__hard_delete.Test.js"));*/





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
//test users
//require("./controllers/users.Test.js");
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