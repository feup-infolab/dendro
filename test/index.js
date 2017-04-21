process.env.NODE_ENV = 'test';

let Config = GLOBAL.Config = Object.create(require("../src/models/meta/config.js").Config);
Config.initGlobals();

GLOBAL.tests = {};

require(Config.absPathInTestsFolder("routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js"));

/*
//test login
require("./controllers/auth.Test.js");
//test projects

require("./controllers/projects.Test.js");

//test project file operations
require("./controllers/project.fileOperations/administer.Test.js");

//test file uploads
require("./controllers/files.Test.js");

//test folders
/*
require("./controllers/folders.Test.js");
*/

//test users
require("./controllers/users.Test.js");

//test descriptors
require("./controllers/descriptors.Test.js");

//test ontologies
/*
require("./controllers/ontologies.Test");
*/

/*
//SOCIAL DENDRO
//test social Dendro Posts
/*
require("./controllers/social/posts.Test.js");

//test social Dendro File Versions
require("./controllers/social/fileVersions.Test.js");

//test social Dendro Notifications
require("./controllers/social/notifications.Test.js");
*/

//destroy graphs
require('./models/kb/db.Test.js');
