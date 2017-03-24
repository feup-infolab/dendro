process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

const db = function() { return GLOBAL.db.default; }();
const db_social = function() { return GLOBAL.db.social; }();
const db_notifications = function () { return GLOBAL.db.notifications;}();
const async = require('async');
const projectUtils = require('./../utils/project/projectUtils.js');
const userUtils = require('./../utils/user/userUtils.js');
const folderUtils = require('./../utils/folder/folderUtils.js');
const httpUtils = require('./../utils/http/httpUtils.js');

const should = chai.should();

const ecologyFolder = require("../mockdata/folders/ecology_folder");

describe("[GET] /search", function () {
    //TODO
    it("[HTML] Should find the " +ecologyFolder.name+ " folder, because it exists.", function (done) {
        done(1);
    });

    it("[JSON] Should find the " +ecologyFolder.name+ " folder, because it exists.", function (done) {
        done(1);
    });
});
