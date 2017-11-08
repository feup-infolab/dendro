const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const privateProjectHandle = "privateprojecthtmlcreatedbydemouser1";

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: "This is a private test project with handle " + privateProjectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: privateProjectHandle,
    privacy: "private",
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/privateprojecthtmlcreatedbydemouser1.zip")
};

module.exports = projectData;
