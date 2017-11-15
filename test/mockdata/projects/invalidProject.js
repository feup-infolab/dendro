const projectHandle = "unknownProjectHandle";
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: "This is a public test project with handle " + projectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: projectHandle,
    privacy: "public"
};

module.exports = projectData;
