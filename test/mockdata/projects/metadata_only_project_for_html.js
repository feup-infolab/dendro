const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const metadataProjectHandle = "metadataonlyhtmlprojectcreatedbydemouser1";

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: "This is a metadata only test project with handle " + metadataProjectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: metadataProjectHandle,
    privacy: "metadata_only",
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/metadataonlyhtmlprojectcreatedbydemouser1.zip")
};

module.exports = projectData;
