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

// TODO get proper order of posts and fix tests (join timeline, timeline_posts
// TODO and posts query and see the place in the timeline where each post we need is. Update positions in these tests!

// rlequire("dendro", "test/routes/posts/_uri/routes.posts._uri.Test.js");

// rlequire("dendro", "test/routes/shares/_uri/routes.shares._uri.Test.js");

// Import projects tests
rlequire("dendro", "test/routes/keywords/route.keywords.Test");

