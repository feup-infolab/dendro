process.env.NODE_ENV = "test";

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
Config.testsTimeout = 1800000;
console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

// require(Pathfinder.absPathInTestsFolder("/routes/posts/count/routes.posts.count.Test.js"));
//
// require(Pathfinder.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification.Test.js"));
//
// require(Pathfinder.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification[DELETE].Test.js"));

// END OF SOCIAL DENDRO TESTS

// PROJECT WITH B2DROP STORAGE
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/data/testFolder1/a_filename/__cut/routes.project.b2dropProject.data.testFolder1.a_filename.__cut.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/__bagit/routes.project.b2dropProject.__bagit.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/project/b2drop_project/__delete/routes.project.b2dropProject.__delete.Test.js"));

