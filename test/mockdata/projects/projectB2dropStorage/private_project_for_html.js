const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const privateProjectHandle = "privateprojecthtmlcreatedbydemouser1";

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: "This is a private test project with handle " + privateProjectHandle + " and created by demouser1",
    description: "This is a test project description",
    publisher: "UP",
    language: "En",
    coverage: "Porto",
    handle: privateProjectHandle,
    privacy: "private",
    storage: "b2drop"
};

module.exports = projectData;
