const publicProject = require("../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const privateProject= require("../mockdata/projects/private_project.js");

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

describe('project/' + publicProject.handle + '?administer', function () {
    it("[HTML] access project's info GET", function (done) {

    });

    it("[HTML] access project without admin rights", function (done) {

    });

    it("[HTML] access non-existent project", function (done) {

    });


    it("[HTML] change project's privacy status", function (done) {

    });

    it("[HTML] remove contributors", function (done) {

    });

    it("[HTML] add non-existent contributors", function (done) {

    });

    it("[HTML] add contributors", function (done) {

    });
});