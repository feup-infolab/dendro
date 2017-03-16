const publicProject = require("../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const privateProject= require("../mockdata/projects/private_project.js");

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

describe('project/' + publicProject.handle + '?bagit', function () {

    it("[HTML] bag it without being creator", function (done) {

    });

    it("[HTML] bag it without being contributor", function (done) {

    });

    it("[JSON] getting non-existing project", function (done) {

    });

    it("[JSON] error deleting project", function (done) {

    });

    it("[JSON] error creating backup", function (done) {

    });

    it("[HTML] getting non-existing project", function (done) {

    });

    it("[HTML] delete folder on local fileSystem", function (done) {

    });


    //TODO not implemented for filepath yet
    it("[HTML] bagging a project with filepath", function (done) {

    });
});