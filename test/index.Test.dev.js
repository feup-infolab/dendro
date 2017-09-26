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

/*require(Pathfinder.absPathInTestsFolder("/routes/socialDendro/my/routes.socialDendro.my.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/all/routes.posts.all.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/post/routes.posts.post.Test.js"));
require(Pathfinder.absPathInTestsFolder("/routes/posts/posts/routes.posts.posts.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/posts/new/routes.posts.new.Test.js"));*/

/*require(Pathfinder.absPathInTestsFolder("/routes/posts/like/routes.posts.like.Test.js"));*/

/*require(Pathfinder.absPathInTestsFolder("/routes/posts/post/likes/routes.posts.post.likes.Test.js"));*/

/*require(Pathfinder.absPathInTestsFolder("/routes/posts/comment/routes.posts.comment.Test.js"));*/

/*require(Pathfinder.absPathInTestsFolder("/routes/posts/comments/routes.posts.comments.Test.js"));*/

/*require(Pathfinder.absPathInTestsFolder("/routes/posts/share/routes.posts.share.Test.js"));*/

require(Pathfinder.absPathInTestsFolder("/routes/posts/shares/routes.posts.shares.Test.js"));
return;

//PUBLIC PROJECT ROOT MKDIR TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__mkdir/routes.project.publicProject.__mkdir.Test.js"));
//PRIVATE PROJECT ROOT MKDIR TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/private_project/__mkdir/routes.project.privateProject.__mkdir.Test.js"));
//METADATA ONLY PROJECT ROOT MKDIR TESTS
require(Pathfinder.absPathInTestsFolder("/routes/project/metadata_only_project/__mkdir/routes.project.metadataonlyProject.__mkdir.Test.js"));
return;

require(Pathfinder.absPathInTestsFolder("/routes/project/public_project/__recent_changes/routes.project.publicProject.__recent_changes.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/archived_resource/routes.archivedResource.Test.js"));

require(Pathfinder.absPathInTestsFolder("/routes/socialDendro/my/routes.socialDendro.my.Test.js"));
/*require(Pathfinder.absPathInTestsFolder("/routes/socialDendro/my/routes.socialDendro.my.Test.js"));*/

require(Pathfinder.absPathInTestsFolder("/routes/posts/all/routes.posts.all.Test.js"));

/*'/socialDendro/my' -> done route and file and stubs
 '/posts/all' -> done route and file and stubs
 '/posts/post' -> done route and file and stubs
 '/posts/posts' -> done route and file and stubs
 '/posts/new' -> done route and file and stubs
 '/posts/like' -> done route and file and stubs
 '/posts/post/likes' -> done route and file and stubs
 '/posts/comment' -> done route and file and stubs
 '/posts/comments' -> done route and file and stubs
 '/posts/share' -> done route and file and stubs
 '/posts/shares' -> done route and file and stubs
 '/posts/countNum' -> done route and file and stubs
 '/posts/:uri' -> done route and file and stubs
 '/shares/:uri' -> done route and file and stubs
 '/notifications/all' -> done route and file and stubs
 '/notifications/notification' -> done route and file and stubs
 '/notifications/notification' -> done route and file and stubs
 */



