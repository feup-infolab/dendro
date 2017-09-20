process.env.NODE_ENV = "test";

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
Config.testsTimeout = 20000;
Config.longTestsTimeout = 60000;
console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

require(Pathfinder.absPathInTestsFolder("/routes/archived_resource/routes.archivedResource.Test.js"));

/*'/socialDendro/my' -> done route and file and stubs
'/posts/all' -> done route and file and stubs
'/posts/post' -> done route and file and stubs
'/posts/posts' -> done route and file and stubs
'/posts/new' -> done route and file and stubs
'/posts/like' -> done route and file and stubs
'/posts/like/liked' -> done route and file and stubs
'/posts/post/likesInfo' -> done route and file and stubs
'/posts/comment' -> done route and file and stubs
'/posts/comments' -> done route and file and stubs
'/posts/share' -> done route and file and stubs
'/posts/shares' -> done route and file and stubs
'/posts/countNum' -> done route and file and stubs
'/posts/:uri' -> done route and file and stubs
'/shares/:uri' -> done route and file
'/notifications/all' -> done route and file
'/notifications/notification' -> done route and file
'/notifications/notification' -> done route and file
*/



