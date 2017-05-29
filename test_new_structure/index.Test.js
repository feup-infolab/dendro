process.env.NODE_ENV = 'test';

GLOBAL.tests = {};

let Config = GLOBAL.Config = Object.create(require("../src/models/meta/config.js").Config);
Config.initGlobals();

GLOBAL.tests = {};

require(Config.absPathInTestsFolder("/cleanEverything.Test.js"));

//SOCIAL DENDRO TESTS
/*require(Config.absPathInTestsFolder("/routes/posts/all/routes.posts.all.Test.js"));
 require(Config.absPathInTestsFolder("/routes/posts/post/routes.posts.post.Test.js"));
 require(Config.absPathInTestsFolder("/routes/posts/like/routes.posts.like.Test.js"));
 require(Config.absPathInTestsFolder("/routes/posts/like/liked/routes.posts.like.liked.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/post/likesInfo/routes.posts.post.likesInfo.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/comment/routes.posts.comment.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/comments/routes.posts.comments.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/share/routes.posts.share.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/shares/routes.posts.shares.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/countNum/routes.posts.countNum.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/posts/uri/routes.posts.uri.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/shares/uri/routes.shares.uri.Test.js"));*/

/*require(Config.absPathInTestsFolder("/routes/notifications/all/routes.notifications.all.Test.js"));*/

require(Config.absPathInTestsFolder("/routes/notifications/notification/routes.notifications.notification.Test.js"));
