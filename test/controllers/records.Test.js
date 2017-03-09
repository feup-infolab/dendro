process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

let db = function ()
{
    return GLOBAL.db.default;
}();
let db_social = function ()
{
    return GLOBAL.db.social;
}();
let db_notifications = function ()
{
    return GLOBAL.db.notifications;
}();
let async = require('async');
let projectUtils = require('./../utils/project/projectUtils.js');
let userUtils = require('./../utils/user/userUtils.js');
let folderUtils = require('./../utils/folder/folderUtils.js');
let httpUtils = require('./../utils/http/httpUtils.js');

let should = chai.should();

let demouser1 = require("../mockdata/users/demouser1");
let demouser2 = require("../mockdata/users/demouser2");
let demouser3 = require("../mockdata/users/demouser3");

let folder = require("../mockdata/folders/folder");
const publicProject = require("../mockdata/projects/public_project");
let metadataOnlyProject = require("../mockdata/projects/metadata_only_project");
let privateProject = require("../mockdata/projects/private_project");


/**
 * Test for fetching metadata on a missing project
 */
describe("/project/NON_EXISTENT_PROJECT?metadata (non-existant project)", function ()
{
    it('[HTML] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
    {
        //TODO
        done();
    });
    
    it('[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a public project
 */
describe("/project/"+publicProject.handle+"?metadata (public project)", function ()
{
    /**
     * Invalid request type
     */
    it('[HTML] should refuse request if Accept application/json was not specified', function (done)
    {
        //TODO
        done();
    });

    /**
     * Valid request type
     */
    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as demouser1 (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as demouser2 (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a metadata-only project
 */
describe("/project/"+metadataOnlyProject.handle+"?metadata (public project)", function ()
{
    /**
     * Invalid request type
     */
    it('[HTML] should refuse request if Accept application/json was not specified', function (done)
    {
        //TODO
        done();
    });

    /**
     * Valid request type
     */
    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser1 (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser2 (contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser3 (not contributor nor creator of the project - outside element)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a private project
 */

describe("/project/"+privateProject.handle+"?metadata (private project)", function ()
{
    /**
     * Invalid request type
     */
    it('[HTML] should refuse request if Accept application/json was not specified', function (done)
    {
        //TODO
        done();
    });

    /**
     * Valid request type
     */
    it('[JSON] should NOT fetch metadata of the ' + metadataOnlyProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser1 (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser2 (contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should NOT fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser3 (not contributor nor creator of the project - outside element)', function (done)
    {
        //TODO
        done();
    });
});


/***
 *
 *
 * Metadata (recursive).
 * Shows all the metadata for the project, including folders and files within
 * 
 *
 */

/**
 * Test for fetching metadata on a missing project
 */
describe("/project/NON_EXISTENT_PROJECT?metadata (non-existant project)", function ()
{
    it('[HTML] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a public project
 */
describe("/project/"+publicProject.handle+"?metadata (public project)", function ()
{
    /**
     * Invalid request type
     */
    it('[HTML] should refuse request if Accept application/json was not specified', function (done)
    {
        //TODO
        done();
    });

    /**
     * Valid request type
     */
    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata recursively of the ' + publicProject.handle + ' project, authenticated as demouser1 (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata recursively of the ' + publicProject.handle + ' project, authenticated as demouser2 (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a metadata-only project
 */
describe("/project/"+metadataOnlyProject.handle+"?metadata (public project)", function ()
{
    /**
     * Invalid request type
     */
    it('[HTML] should refuse request if Accept application/json was not specified', function (done)
    {
        //TODO
        done();
    });

    /**
     * Valid request type
     */
    it('[JSON] should NOT fetch metadata recursively of the' + metadataOnlyProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser1 (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser2 (contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should NOT fetch metadata recursively of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser3 (not contributor nor creator of the project - outside element)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a private project
 */

describe("/project/"+privateProject.handle+"?metadata (private project)", function ()
{
    /**
     * Invalid request type
     */
    it('[HTML] should refuse request if Accept application/json was not specified', function (done)
    {
        //TODO
        done();
    });

    /**
     * Valid request type
     */
    it('[JSON] should NOT fetch metadata of the ' + metadataOnlyProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser1 (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser2 (contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should NOT fetch metadata of the ' + metadataOnlyProject.handle + ' project, authenticated as demouser3 (not contributor nor creator of the project - outside element)', function (done)
    {
        //TODO
        done();
    });
});

