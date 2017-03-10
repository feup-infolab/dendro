const publicProject = require("../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const privateProject= require("../mockdata/projects/private_project.js");



describe('project/' + publicProject.handle + '?download', function () {

    it("[HTML] downloading without logging in", function (done) {

    });

    it("[HTML] downloading without being creator", function (done) {

    });

    it("[HTML] downloading without being contributor", function (done) {

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
});

describe('project/' + publicProject.handle + '?thumbnail', function () {

    it("[HTML] operating without being creator", function (done) {

    });

    it("[HTML] operating without being contributor", function (done) {

    });

    it("[HTML] requested extension is null", function (done) {

    });

    it("[HTML] requested extension is null", function (done) {

    });

    it("[HTML] requested extension is folder", function (done) {

    });

    it("[HTML] extension is iconable", function (done) {

    });
});

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