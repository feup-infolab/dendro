const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const privateProjectHandle = "privateprojecthtmlcreatedbydemouser1";

const projectData = {
    creator: "http://" + Config.hostAndPort + "/user/demouser1",
    title: "This is a private test project with handle " + privateProjectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: privateProjectHandle,
    privacy: "private",
    storageConfig: {
        hasStorageType: "local"
    },
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/privateprojecthtmlcreatedbydemouser1.zip"),
    searchTerms: privateProjectHandle
};

module.exports = projectData;
