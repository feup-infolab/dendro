const publicProjectHandle = 'publicprojectcreatedbydemouser1';

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    contributors: ["http://" + Config.host + "/user/demouser3"],
    title: 'This is a public test project with handle ' + publicProjectHandle + " and created by demouser1",
    description : 'This is a test project description for a public project type',
    publisher: 'UP',
    language: 'En',
    coverage: 'Porto',
    handle: publicProjectHandle,
    privacy: 'public',
    uri: "http://" + Config.host + "/" + publicProjectHandle
};

module.exports = projectData;