GLOBAL.tests = {};

require('./homepage.Test.js');

//test login
require('./controllers/auth.Test.js');

//test projects
require('./controllers/projects.Test.js');


//destroy graphs
require('./models/kb/db.Test.js');