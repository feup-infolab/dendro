const publicProjectHandle = "publicprojectcreatedbydemouser2";
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const projectData = {
    creator: "http://" + Config.hostAndPort + "/user/demouser2",
    title: "This is a public test project with handle " + publicProjectHandle + " and created by demouser2",
    description: "This is a test project description for a public project type",
    publisher: "UP",
    contact_address: "Universidade do Porto, Praça dos Leões 31",
    contact_name: "João Rocha da Silva",
    contact_phone: "+351 930000000",
    contact_email: "teste@teste.com",
    language: "En",
    coverage: "Porto",
    handle: publicProjectHandle,
    privacy: "public",
    uri: "http://" + Config.hostAndPort + "/" + publicProjectHandle,
    // backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/publicprojectcreatedbydemouser2.zip"),
    searchTerms: publicProjectHandle,
    storageConfig: {
        hasStorageType: "local"
    }
};

module.exports = projectData;
