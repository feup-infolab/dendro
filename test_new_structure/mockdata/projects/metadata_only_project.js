const metadataProjectHandle = 'metadataonlyprojectcreatedbydemouser1';

const projectData = {
    creator: "http://" + Config.host + "/user/demouser1",
    contributors: ["http://" + Config.host + "/user/demouser3"],
    title: 'This is a metadata only test project with handle ' + metadataProjectHandle + " and created by demouser1",
    description: 'This is a test project description for a metadata-only project type',
    publisher: 'UP',
    language: 'En',
    coverage: 'Porto',
    handle: metadataProjectHandle,
    privacy: 'metadata_only',
    uri: "http://" + Config.host + "/" + metadataProjectHandle
};


module.exports = projectData;
