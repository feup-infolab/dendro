const path = require("path");
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

module.exports = {
    md5 : "8a1fb73260a39d067997e287c9571085",
    name : "text.xls",
    location : Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/test.xlsx")
};

