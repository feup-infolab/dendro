GLOBAL.tests = {};

require("./homepage.Test.js");

//test login
require("./controllers/auth.Test.js");

//test projects
/*
require("./controllers/projects.Test.js");
*/

//test file uploads
/*
require("./controllers/files.Test.js");
*/

//test folders
/*
require("./controllers/folders.Test.js");
*/

//test users
/*
require("./controllers/users.Test.js");
*/

//test descriptors
/*
require("./controllers/descriptors.Test.js");
*/

//test ontologies
require("./controllers/ontologies.Test");

//destroy graphs
require('./models/kb/db.Test.js');

