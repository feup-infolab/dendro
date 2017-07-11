process.env.NODE_ENV = 'test';

GLOBAL.tests = {};

let Config = Object.create(require("../src/models/meta/config.js").Config);
GLOBAL.Config = Config;
Config.initGlobals();

//Config.cache.active = false;

GLOBAL.tests = {};

/*
 require(Config.absPathInTestsFolder("/routes/search/routes.search.Test.js"));
 */

require(Config.absPathInTestsFolder("/cleanEverything.Test.js"));


require(Config.absPathInTestsFolder("/routes/user/edit/routes.user.edit.Test.js"));
require(Config.absPathInTestsFolder("/routes/user/avatar/routes.user.avatar.Test.js"));
require(Config.absPathInTestsFolder("/routes/user/avatar/routes.user.avatar.Test.js"));
require(Config.absPathInTestsFolder("/routes/user/demouser1/avatar/routes.user.demouser1.avatar.Test.js"));
require(Config.absPathInTestsFolder("/routes/user/demouser2/avatar/routes.user.demouser2.avatar.Test.js"));
require(Config.absPathInTestsFolder("/routes/user/demouser3/avatar/routes.user.demouser3.avatar.Test.js"));