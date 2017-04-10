process.env.NODE_ENV = 'test';

GLOBAL.tests = {};

let Config = GLOBAL.Config = Object.create(require("../src/models/meta/config.js").Config);
Config.initGlobals();

GLOBAL.tests = {};


//require(Config.absPathInTestsFolder("/routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js"));

require(Config.absPathInTestsFolder("/routes/descriptors/from_ontology/route.descriptors.from_ontology.dcterms.Test.js"));


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