const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const publicProjectHandle = "publicprojecthtmlcreatedbydemouser1";

const projectData = {
    creator: "http://" + Config.hostAndPort + "/user/demouser1",
    title: "This is a public test project with handle " + publicProjectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: publicProjectHandle,
    privacy: "public",
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/publicprojecthtmlcreatedbydemouser1.zip"),
    searchTerms: publicProjectHandle,
    storageConfig: {
        hasStorageType: "local"
    }
};

module.exports = projectData;
