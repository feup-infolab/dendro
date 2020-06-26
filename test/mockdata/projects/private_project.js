const privateProjectHandle = "privateprojectcreatedbydemouser1";
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const projectData = {
    creator: "http://" + Config.hostAndPort + "/user/demouser1",
    title: "This is a private test project with handle " + privateProjectHandle + " and created by demouser1",
    description: "This is a test project description for a private project type",
    publisher: "UP",
    contact_address: "Universidade do Porto, Praça dos Leões 31",
    contact_name: "João Rocha da Silva",
    contact_phone: "+351 930000000",
    contact_email: "teste@teste.com",
    language: "En",
    coverage: "Porto",
    handle: privateProjectHandle,
    privacy: "private",
    storageConfig: {
        hasStorageType: "local"
    },
    uri: "http://" + Config.hostAndPort + "/" + privateProjectHandle,
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/privateprojectcreatedbydemouser1.zip"),
    searchTerms: privateProjectHandle
};

module.exports = projectData;
