const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

module.exports = function (agenda) {
    agenda.define("test job", function (job, done) {
        Logger.log("info", "This is a test job, Hello!!!");
        done();
    });
};