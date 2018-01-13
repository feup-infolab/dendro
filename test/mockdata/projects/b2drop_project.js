const b2dropProjectHandle = "b2droproject";
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: "This is a project with b2drop storage , with handle " + b2dropProjectHandle + " and created by demouser1",
    description: "A b2drop-backed project with a single folder and a file inside it",
    publisher: "Universidade do Porto",
    contact_address: "Casa do João Numero 1",
    contact_name: "Joãozinho Autor",
    contact_phone: "910000000",
    contact_email: "joao@casa.com",
    language: "en",
    coverage: "Porto",
    handle: b2dropProjectHandle,
    privacy: "public",
    storageConfig : {
        hasStorageType: "b2drop",
        username: "joaorosilva@gmail.com",
        password: "bxf8f-4P8WP-HbCiT-eDX5t-LfGZb"
    },
    uri: "http://" + Config.host + "/" + b2dropProjectHandle
};

module.exports = projectData;
