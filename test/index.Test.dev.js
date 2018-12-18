process.env.NODE_ENV = "test";

global.app_startup_time = new Date();

const path = require("path");
const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

// 30 min TIMEOUT!!!!
Config.testsTimeout = 1800000;

console.log("Running in test mode with Node Version " + process.version + " and the app directory is : " + rlequire.absPathInApp("dendro", "."));

global.Config = Config;

global.tests = {};

rlequire("dendro", "test/routes/keywords/route.keywords.Test.js");

// SOCIAL DENDRO TESTS

rlequire("dendro", "test/routes/social/my/routes.social.my.Test.js");

rlequire("dendro", "test/routes/posts/all/routes.posts.all.Test.js");

rlequire("dendro", "test/routes/posts/post/routes.posts.post.Test.js");

rlequire("dendro", "test/routes/posts/posts/routes.posts.posts.Test.js");

rlequire("dendro", "test/routes/posts/new/routes.posts.new.Test.js");

rlequire("dendro", "test/routes/posts/like/routes.posts.like.Test.js");

rlequire("dendro", "test/routes/posts/post/likes/routes.posts.post.likes.Test.js");

rlequire("dendro", "test/routes/posts/comment/routes.posts.comment.Test.js");

rlequire("dendro", "test/routes/posts/comments/routes.posts.comments.Test.js");

rlequire("dendro", "test/routes/posts/share/routes.posts.share.Test.js");

rlequire("dendro", "test/routes/posts/shares/routes.posts.shares.Test.js");

rlequire("dendro", "test/routes/posts/count/routes.posts.count.Test.js");

// TODO get proper order of posts and fix tests (join timeline, timeline_posts
// TODO and posts query and see the place in the timeline where each post we need is. Update positions in these tests!

// rlequire("dendro", "test/routes/posts/_uri/routes.posts._uri.Test.js");

// rlequire("dendro", "test/routes/shares/_uri/routes.shares._uri.Test.js");

rlequire("dendro", "test/routes/notifications/all/routes.notifications.all.Test.js");

rlequire("dendro", "test/routes/notifications/notification/routes.notifications.notification.Test.js");

rlequire("dendro", "test/routes/notifications/notification/routes.notifications.notification[DELETE].Test.js");

// END OF SOCIAL DENDRO TESTS
