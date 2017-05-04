var Config = require("../../../src/models/meta/config").Config;
var db = require(Config.absPathInTestsFolder("utils/db/db.Test.js"));
var chai = require('chai');
const should = chai.should();

exports.requireUncached = function(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
};


exports.clearAppState = function (cb) {
    //var db = exports.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
    db.deleteGraphs(function (err, data) {
        should.equal(err, null);
        GLOBAL.tests.server.close();
        cb(err, data);
    });
};
