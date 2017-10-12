const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const publicProjectHandle = 'publicprojecthtmlcreatedbydemouser1';

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: 'This is a public test project with handle ' + publicProjectHandle + " and created by demouser1",
    description: 'This is a test project description',
    publisher: 'UP',
    language: 'En',
    coverage: 'Porto',
    handle: publicProjectHandle,
    privacy: 'public',
    backup_path: Pathfinder.absPathInTestsFolder("/mockdata/projects/projectBackups/publicprojecthtmlcreatedbydemouser1.zip")
};

module.exports = projectData;