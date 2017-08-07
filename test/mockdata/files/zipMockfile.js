const path = require("path");
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

module.exports = {
    md5 : "eb82ed62ea27ae2a079b323a47b03187",
    name : "labtablet.png.zip",
    location : Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/labtablet.png.zip")
};

