const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

module.exports = {
    md5 : "7709f77e25380bd048d2594c083360fb",
    name : "ipres2014.pdf",
    location : Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/ipres2014.pdf")
};