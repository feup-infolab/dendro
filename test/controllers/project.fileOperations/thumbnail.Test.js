const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");


describe('project/' + publicProject.handle + '?thumbnail', function () {

    it("[HTML] operating without being creator", function (done) {
        done();

    });

    it("[HTML] operating without being contributor", function (done) {
        done();

    });

    it("[HTML] requested extension is null", function (done) {
        done();

    });

    it("[HTML] requested extension is null", function (done) {
        done();

    });

    it("[HTML] requested extension is folder", function (done) {
        done();

    });

    it("[HTML] extension is iconable", function (done) {
        done();

    });
});