const privateProjectHandle = "privateprojectcreatedbydemouser3";
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const projectData = {
    creator: "http://" + Config.host + "/user/demouser3",
    title: "This is a private test project with handle " + privateProjectHandle + " and created by demouser3",
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
    uri: "http://" + Config.host + "/" + privateProjectHandle,
    backup_path: fileUtils.getFilePath("/mockdata/projects/projectBackups/privateprojectcreatedbydemouser3.zip")
};

module.exports = projectData;
