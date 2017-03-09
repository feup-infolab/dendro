const privateProjectHandle = 'privateprojectcreatedbydemouser1';

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    title: 'This is a private test project with handle ' + privateProjectHandle + " and created by demouser1",
    description: 'This is a test project description',
    publisher: 'UP',
    language: 'En',
    coverage: 'Porto',
    handle: privateProjectHandle,
    privacy: 'private',
    uri: "http://" + Config.host + "/" + privateProjectHandle
};

module.exports = projectData;