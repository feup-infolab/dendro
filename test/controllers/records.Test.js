process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

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

const publicProjectFolderUrl = "/project/"+ publicProject.handle +"/data"+folder.pathInProject+"/"+folder.name;
const privateProjectFolderUrl = "/project/"+ privateProject.handle +"/data"+folder.pathInProject+"/"+folder.name;
const metadataOnlyProjectFolderUrl = "/project/"+ metadataOnlyProject.handle +"/data"+folder.pathInProject+"/"+folder.name;
const nonExistentFolderUrl = "/project/"+ publicProject.handle +"/data"+folder.pathInProject+"/"+folder.name +"I_DO_NOT_EXIST";
const folderInsideNonExistingProjectUrl = "/project/I_DO_NOT_EXIST/data"+folder.pathInProject+"/"+folder.name;

const publicProjectUrl = "/project/"+ publicProject.handle;
const privateProjectUrl = "/project/"+ privateProject.handle;
const metadataOnlyProjectUrl = "/project/"+ metadataOnlyProject.handle;
const nonExistentProjectUri = "/project/I_DO_NOT_EXIST";


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
describe(publicProjectUrl+"?metadata (public project)", function ()
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

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser1.username  +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser2.username  +' (not creator nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a metadata-only project
 */
describe(metadataOnlyProjectUrl+"?metadata (public project)", function ()
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

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser1.username  +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser2.username  +' (not creator nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a private project
 */

describe(privateProjectUrl+"?metadata (private project)", function ()
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

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser1.username  +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should NOT fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser2.username  +' (not creator nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser3.username  +' (contributor)', function (done)
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
describe("/project/"+publicProject.handle+"?metadata&deep (public project)", function ()
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

    it('[JSON] should fetch metadata recursively of the ' + publicProject.handle + ' project, authenticated as '+ demouser1.username +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata recursively of the ' + publicProject.handle + ' project, authenticated as '+ demouser2.username +' (not user nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + publicProject.handle + ' project, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a metadata-only project
 */
describe("/project/"+metadataOnlyProject.handle+"?metadata&deep (public project)", function ()
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

    it('[JSON] should fetch metadata recursively of the ' + metadataOnlyProject.handle + ' project, authenticated as '+ demouser1.username +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should NOT fetch metadata recursively of the ' + metadataOnlyProject.handle + ' project, authenticated as '+ demouser2.username +' (not user nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata recursively of the ' + metadataOnlyProject.handle + ' project, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a private project
 */

describe(privateProjectUrl+"?metadata&deep (private project)", function ()
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
    it('[JSON] should NOT fetch metadata recursively of the' + privateProject.handle + ' project without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata recursively of the ' + privateProject.handle + ' project, authenticated as '+ demouser1.username +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should NOT fetch metadata recursively of the ' + privateProject.handle + ' project, authenticated as '+ demouser2.username +' (not user nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch metadata of the ' + privateProject.handle + ' project, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});


/***
 *
 *
 * Parent metadata for projects
 * Shows all the metadata for the parent of the supplied uri (should FAIL always in case of projects)
 *
 *
 */

describe(nonExistentProjectUri+"?parent_metadata (non-existant project)", function ()
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
describe(publicProjectUrl + "?parent_metadata (public project)", function ()
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
    it('[JSON] should refuse to fetch metadata because ' + publicProject.handle + ' does not have a parent, since it is a project and not a folder', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a metadata-only project
 */
describe(metadataOnlyProjectUrl + "?parent_metadata (metadata-only project)", function ()
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
    it('[JSON] should refuse to fetch metadata because ' + metadataOnlyProject.handle + ' does not have a parent, since it is a project and not a folder', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a private project
 */

describe(privateProjectUrl+"?parent_metadata (private project)", function ()
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
    it('[JSON] should refuse to fetch metadata because ' + privateProject.handle + ' does not have a parent, since it is a project and not a folder', function (done)
    {
        //TODO
        done();
    });
});

/***
 *
 *
 * Parent metadata for folders
 * Shows all the metadata for the parent of the supplied uri (should success in case of folders and files)
 *
 */

describe(nonExistentFolderUrl + "?parent_metadata (non-existent folder)", function ()
{
    it('[HTML] should give a 404 because the folder '+nonExistentFolderUrl+' does not exist', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should give a 404 because the project that should contain '+folderInsideNonExistingProjectUrl+' does not exist', function (done)
    {
        //TODO
        done();
    });
});


/**
 * Getting metadata on a public project
 */
describe(publicProjectFolderUrl + "?parent_metadata (public project)", function ()
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
    it('[JSON] should fetch parent metadata of the ' + publicProjectFolderUrl + ' folder without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + publicProjectFolderUrl + ' folder, authenticated as '+ demouser1.username  +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + publicProjectFolderUrl + ' folder, authenticated as '+ demouser2.username  +' (not creator nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + publicProjectFolderUrl + ' folder, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a metadata-only project
 */
describe(metadataOnlyProjectFolderUrl + "?parent_metadata (metadata-only project)", function ()
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
    it('[JSON] should not fetch parent metadata of the ' + metadataOnlyProjectFolderUrl + ' folder without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + metadataOnlyProjectFolderUrl + ' folder, authenticated as '+ demouser1.username  +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should not fetch parent metadata of the ' + metadataOnlyProjectFolderUrl + ' folder, authenticated as '+ demouser2.username  +' (not creator nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + metadataOnlyProjectFolderUrl + ' folder, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Getting metadata on a private project
 */

describe(privateProjectFolderUrl + "?parent_metadata (private project)", function ()
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
    it('[JSON] should not fetch parent metadata of the ' + privateProjectFolderUrl + ' folder without authenticating', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + privateProjectFolderUrl + ' folder, authenticated as '+ demouser1.username  +' (creator)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should not fetch parent metadata of the ' + privateProjectFolderUrl + ' folder, authenticated as '+ demouser2.username  +' (not creator nor contributor)', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should fetch parent metadata of the ' + privateProjectFolderUrl + ' folder, authenticated as '+ demouser3.username  +' (contributor)', function (done)
    {
        //TODO
        done();
    });
});
