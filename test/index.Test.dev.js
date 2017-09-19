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

/*
require(Pathfinder.absPathInTestsFolder("/routes/archived_resource/routes.archivedResource.Test.js"));*/

/*'/socialDendro/my'
'/posts/all'
'/posts/post'
'/posts/posts'
'/posts/new'
'/posts/like'
'/posts/like/liked'
'/posts/post/likesInfo'
'/posts/comment'
'/posts/comments'
'/posts/share'
'/posts/shares'
'/posts/countNum'
'/posts/:uri'
'/shares/:uri'
'/notifications/all'
'/notifications/notification'
'/notifications/notification'*/



