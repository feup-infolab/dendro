const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const metadataProjectHandle = "metadataonlyhtmlprojectcreatedbydemouser1";

const projectData = {
    creator: "http://" + Config.hostAndPort + "/user/demouser1",
    title: "This is a metadata only test project with handle " + metadataProjectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: metadataProjectHandle,
    privacy: "metadata_only",
    storageConfig: {
        hasStorageType: "local"
    },
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/metadataonlyhtmlprojectcreatedbydemouser1.zip"),
    searchTerms: metadataProjectHandle
};

module.exports = projectData;
