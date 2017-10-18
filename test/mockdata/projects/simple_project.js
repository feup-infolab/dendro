const simpleProjectHandle = 'simpleproject';
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: 'This is a simple project for testing restore operations, with handle ' + simpleProjectHandle + " and created by demouser1",
    description : 'A Simple Project with a single folder and a file inside it',
    publisher: 'Universidade do Porto',
    contact_address : "Casa do João Numero 1",
    contact_name : "Joãozinho Autor",
    contact_phone: "910000000",
    contact_email: "joao@casa.com",
    language: 'en',
    coverage: 'Porto',
    handle: simpleProjectHandle,
    privacy: 'public',
    uri: "http://" + Config.host + "/" + simpleProjectHandle
};

module.exports = projectData;