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

// SOCIAL DENDRO TESTS

require(Pathfinder.absPathInTestsFolder("/routes/socialDendro/my/routes.socialDendro.my.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/all/routes.posts.all.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/post/routes.posts.post.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/posts/routes.posts.posts.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/new/routes.posts.new.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/like/routes.posts.like.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/post/likes/routes.posts.post.likes.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/comment/routes.posts.comment.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/comments/routes.posts.comments.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/share/routes.posts.share.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/shares/routes.posts.shares.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/count/routes.posts.count.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/_uri/routes.posts._uri.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/shares/_uri/routes.shares._uri.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/notifications/all/routes.notifications.all.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification[DELETE].Test.js"));

// END OF SOCIAL DENDRO TESTS

