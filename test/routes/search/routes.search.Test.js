'use strict';

process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
const md5 = require('md5');
chai.use(chaiHttp);

const should = chai.should();

let agent = null;

const demouser1 = require('../../mockdata/users/demouser1.js');
const demouser2 = require('../../mockdata/users/demouser1.js');
const demouser3 = require('../../mockdata/users/demouser1.js');

const folder = require('../../mockdata/folders/folder.js');
const ecologyFolder = require('../../mockdata/folders/ecology_folder.js');
const mechanicsFolder = require('../../mockdata/folders/mechanics_folder.js');

const metadataOnlyProject = require('../../mockdata/projects/metadata_only_project.js');
const publicProject = require('../../mockdata/projects/public_project.js');
const privateProject = require('../../mockdata/projects/private_project.js');

const fileUtils = require('../../utils/file/fileUtils.js');
const folderUtils = require('../../utils/folder/folderUtils.js');
const userUtils = require('../../utils/user/userUtils.js');

describe('/search', function ()
{
    /**
     * Search effectiveness (does it find the things it should, without considering permisions for now?)
     */
    // TODO
    it('[HTML] should search and find a folder by searching for a term present in its abstract (' + ecologyFolder.search_terms + ')', function (done)
    {
        done();
    });

    // TODO
    it('[HTML] should search and not find anything if there is nothing when searching for gibberish (asjksdhfkjshdfkad)', function (done)
    {
        done();
    });

    // TODO
    it('[JSON] should search and find a folder by searching for a term present in its abstract (' + ecologyFolder.search_terms + ')', function (done)
    {
        done();
    });

    // TODO
    it('[JSON] should search and not find anything if there is nothing when searching for gibberish (asjksdhfkjshdfkad)', function (done)
    {
        done();
    });

    /**
     * Permissions and project access levels (Does it filter the private and metadataonly projects and folders adequately?)
     */

    // Folders inside different types of projects
    // TODO
    it('[HTML] should find a folder present in ' + publicProject.handle + ' project by searching for a term present in its description. Query : "public project type"', function (done)
    {
        done();
    });

    // TODO
    it('[HTML] should NOT find a folder present in the ' + metadataOnlyProject.handle + ' project by searching for a term present in its description', function (done)
    {
        done();
    });

    // TODO
    it('[HTML] should NOT find a folder present in the ' + privateProject.handle + ' project by searching for a term present in its description', function (done)
    {
        done();
    });

    // Different types of projects
    // TODO
    it('[HTML] should find the ' + publicProject.handle + ' project by searching for a term present in its description', function (done)
    {
        done();
    });

    // TODO
    it('[HTML] should find the ' + metadataOnlyProject.handle + ' project by searching for a term present in its description', function (done)
    {
        done();
    });

    // TODO
    it('[HTML] should not the ' + privateProject.handle + ' project by searching for a term present in its description', function (done)
    {
        done();
    });
});
