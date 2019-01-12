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

