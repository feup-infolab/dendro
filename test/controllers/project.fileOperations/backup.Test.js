const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");

describe('project/' + publicProject.handle + '?backup', function () {

    it("[HTML] creating backup without logging in", function (done) {

    });

    it("[HTML] creating backup without being creator", function (done) {

    });

    it("[HTML] creating backup without being contributor", function (done) {

    });

    it("[HTML] getting non-existing project", function (done) {

    });

    it("[HTML] getting already deleted project", function (done) {

    });

    it("[HTML] unable to produce zip to download", function (done) {

    });

    it("[HTML] download project without filepath", function (done) {

    });

    it("[HTML] download project with filepath", function (done) {

    });

    it("[HTML] getting non-existent folder with filepath", function (done) {

    });
});