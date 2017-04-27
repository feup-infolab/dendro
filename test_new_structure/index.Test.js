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

//require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.dcterms.Test.js"));
//require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.foaf.Test.js"));
//require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.Test.js"));

//require(Config.absPathInTestsFolder("/routes/projects/import/route.projects.import.Test.js"));

//PUBLIC PROJECT
//require(Config.absPathInTestsFolder("/routes/projects/public_project/request_access/route.projects.PublicProject.requestAccess.Test.js"));
//require(Config.absPathInTestsFolder("/routes/projects/public_project/delete/route.projects.PublicProject.delete.Test.js"));
//require(Config.absPathInTestsFolder("/routes/projects/public_project/undelete/route.projects.PublicProject.undelete.Test.js"));

//METADATA PROJECT
//require(Config.absPathInTestsFolder("/routes/projects/metadataonly_project/request_access/route.projects.metadataonlyProject.requestAccess.Test.js"));
//require(Config.absPathInTestsFolder("/routes/projects/metadataonly_project/delete/route.projects.metadataonlyProject.delete.Test.js"));
//require(Config.absPathInTestsFolder("/routes/projects/metadataonly_project/undelete/route.projects.metadataonlyProject.undelete.Test.js"));

//PRIVATE PROJECT
//require(Config.absPathInTestsFolder("/routes/projects/private_project/request_access/route.projects.privateProject.requestAccess.Test.js"));
//require(Config.absPathInTestsFolder("/routes/projects/private_project/delete/route.projects.privateProject.delete.Test.js"));
//require(Config.absPathInTestsFolder("/routes/projects/private_project/undelete/route.projects.privateProject.undelete.Test.js"));


/*
//PROJECT CHANGES PUBLIC PROJECT
require(Config.absPathInTestsFolder("/routes/project/public_project/__recent_changes/routes.project.publicProject.__recent_changes.Test.js"));
//PROJECT CHANGES PRIVATE PROJECT
require(Config.absPathInTestsFolder("/routes/project/private_project/__recent_changes/routes.project.privateProject.__recent_changes.Test.js"));
//PROJECT CHANGES METADADATA ONlY PROJECT
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/__recent_changes/routes.project.metadataonlyProject.__recent_changes.Test.js"));
*/

//PROJECT VERSION PUBLIC PROJECT THIS TEST SHOULD BE DELETED BECAUSE THE FEATURE DOES NOT EXIST
//require(Config.absPathInTestsFolder("/routes/project/public_project/__version/routes.project.publicProject.__version.Test.js"));

//PUBLIC PROJECT ROOT MKDIR TESTS
require(Config.absPathInTestsFolder("/routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js"));
//PRIVATE PROJECT ROOT MKDIR TESTS
require(Config.absPathInTestsFolder("/routes/project/private_project/__mkdir/routes.project.privateProject.__mkdir.Test.js"));
//METADATA ONLY PROJECT ROOT MKDIR TESTS
require(Config.absPathInTestsFolder("/routes/project/metadata_only_project/__mkdir/routes.project.metadataonlyProject.__mkdir.Test.js"));

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