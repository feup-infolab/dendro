GLOBAL.tests = {};

require("./homepage.Test.js");

//test login
//require("./controllers/auth.Test.js");

//test projects
require("./controllers/projects.Test.js");

//test folders
require("./controllers/folders.Test.js");

//test file uploads
//require("./controllers/files.Test.js");

//test users
//require("./controllers/users.Test.js");

//test descriptors
//require("./controllers/descriptors.Test.js");

//SOCIAL DENDRO
//test Social Dendro Posts
//require("./controllers/social/posts.Test.js");

//test Social Dendro File Versions
//require("./controllers/social/fileVersions.Test.js");

//test Social Dendro Notifications
//require("./controllers/social/notifications.Test.js");

//test external repository exports
//require("./controllers/datasets.Test");

//destroy graphs
require('./models/kb/db.Test.js');
