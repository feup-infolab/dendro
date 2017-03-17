var publicProjectHandle = 'publicprojectcreatedbydemouser1';

var projectData = {
    creator : "http://" + Config.host + "/user/demouser1",
    contributor: ["http://" + Config.host + "/user/demouser2"],
    title : 'This is a public test project with handle ' + publicProjectHandle + " and created by demouser1",
    description : 'This is a test project description',
    publisher: 'UP',
    language: 'En',
    coverage: 'Porto',
    handle : publicProjectHandle,
    privacy: 'public'
};

module.exports = projectData;