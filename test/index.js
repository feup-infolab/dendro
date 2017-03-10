GLOBAL.tests = {};

require("./homepage.Test.js");

//test login
require("./controllers/auth.Test.js");

//test projects
require("./controllers/projects.Test.js");

//test file uploads
require("./controllers/files.Test.js");

//test folders
require("./controllers/folders.Test.js");

//test metadata-related operations
require("./controllers/records.Test.js");

//test interactions recording operations
require("./controllers/interactions.Test.js");

//test recommendation operations
require("./controllers/recommendation.Test.js");

//test repository bookmarks management operations
require("./controllers/repo_bookmarks.Test.js");

//test users
require("./controllers/users.Test.js");

//test descriptors
require("./controllers/descriptors.Test.js");

//destroy graphs
require('./models/kb/db.Test.js');
