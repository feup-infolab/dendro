const simpleProjectHandle = "simpleproject";
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: "This is a simple project for testing restore operations, with handle " + simpleProjectHandle + " and created by demouser1",
    description: "A Simple Project with a single folder and a file inside it",
    publisher: "Universidade do Porto",
    contact_address: "Casa do João Numero 1",
    contact_name: "Joãozinho Autor",
    contact_phone: "910000000",
    contact_email: "joao@casa.com",
    language: "en",
    coverage: "Porto",
    handle: simpleProjectHandle,
    privacy: "public",
    searchTerms: simpleProjectHandle,
    storageConfig: {
        hasStorageType: "local"
    },
    uri: "http://" + Config.host + "/" + simpleProjectHandle
};

module.exports = projectData;
