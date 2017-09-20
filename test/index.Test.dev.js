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
'/posts/all' -> done route and file
'/posts/post' -> done route and file
'/posts/posts' -> done route and file
'/posts/new' -> done route and file
'/posts/like' -> done route and file
'/posts/like/liked' -> done route and file
'/posts/post/likesInfo' -> done route and file
'/posts/comment' -> done route and file
'/posts/comments' -> done route and file
'/posts/share' -> done route and file
'/posts/shares' -> done route and file
'/posts/countNum' -> done route and file
'/posts/:uri' -> done route and file
'/shares/:uri' -> done route and file
'/notifications/all' -> done route and file
'/notifications/notification' -> done route and file
'/notifications/notification' -> done route and file
*/



