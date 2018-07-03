process.env.NODE_ENV = "test";

const path = require("path");
const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
Config.testsTimeout = 1800000;
console.log("Running in test mode and the app directory is : " + rlequire.getRootFolder("dendro"));

global.Config = Config;

global.tests = {};

// SOCIAL DENDRO TESTS

rlequire("dendro", "test//routes/socialDendro/my/routes.socialDendro.my.Test.js");

rlequire("dendro", "test//routes/posts/all/routes.posts.all.Test.js");

rlequire("dendro", "test//routes/posts/post/routes.posts.post.Test.js");

rlequire("dendro", "test//routes/posts/posts/routes.posts.posts.Test.js");

rlequire("dendro", "test//routes/posts/new/routes.posts.new.Test.js");

rlequire("dendro", "test//routes/posts/like/routes.posts.like.Test.js");

rlequire("dendro", "test//routes/posts/post/likes/routes.posts.post.likes.Test.js");

rlequire("dendro", "test//routes/posts/comment/routes.posts.comment.Test.js");

rlequire("dendro", "test//routes/posts/comments/routes.posts.comments.Test.js");

rlequire("dendro", "test//routes/posts/share/routes.posts.share.Test.js");

rlequire("dendro", "test//routes/posts/shares/routes.posts.shares.Test.js");

rlequire("dendro", "test//routes/posts/count/routes.posts.count.Test.js");

rlequire("dendro", "test//routes/posts/_uri/routes.posts._uri.Test.js");

rlequire("dendro", "test//routes/shares/_uri/routes.shares._uri.Test.js");

rlequire("dendro", "test//routes/notifications/all/routes.notifications.all.Test.js");

rlequire("dendro", "test//routes/notifications/notification/routes.notifications.notification.Test.js");

rlequire("dendro", "test//routes/notifications/notification/routes.notifications.notification[DELETE].Test.js");

// END OF SOCIAL DENDRO TESTS

