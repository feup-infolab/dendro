"use strict";

process.env.NODE_ENV = "test";

let chai = require("chai");
let chaiHttp = require("chai-http");
const md5 = require("md5");
chai.use(chaiHttp);

const should = chai.should();

let agent = null;

const demouser1 = require("../mockdata/users/demouser1.js");
const demouser2 = require("../mockdata/users/demouser2.js");
const demouser3 = require("../mockdata/users/demouser3.js");

const folder = require("../mockdata/folders/folder.js");

const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const publicProject = require("../mockdata/projects/public_project.js");
const privateProject= require("../mockdata/projects/private_project.js");

const fileUtils= require("../utils/file/fileUtils.js");
const folderUtils= require("../utils/folder/folderUtils.js");
const userUtils = require("../utils/user/userUtils.js");


const publicProjectFolderUrl = "/project/"+ publicProject.handle +"/data"+folder.pathInProject+"/"+folder.name;
const privateProjectFolderUrl = "/project/"+ privateProject.handle +"/data"+folder.pathInProject+"/"+folder.name;
const metadataOnlyProjectFolderUrl = "/project/"+ metadataOnlyProject.handle +"/data"+folder.pathInProject+"/"+folder.name;

const publicProjectUrl = "/project/"+ publicProject.handle;
const privateProjectUrl = "/project/"+ privateProject.handle;
const metadataOnlyProjectUrl = "/project/"+ metadataOnlyProject.handle;

/**
 * Project-level recommendation of descriptors
 */

describe(publicProjectUrl +"?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ publicProject.handle +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ publicProject.handle +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ publicProject.handle +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ publicProject.handle +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(metadataOnlyProjectUrl+"?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ metadataOnlyProject.handle +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ metadataOnlyProject.handle +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ metadataOnlyProject.handle +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ metadataOnlyProject.handle +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(privateProjectUrl +"?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ privateProject.handle +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ privateProject.handle +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ privateProject.handle +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ privateProject.handle +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});


/**
 * Folder-level recommendation of descriptors
 */


describe(publicProjectFolderUrl, function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ publicProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(metadataOnlyProjectFolderUrl+"?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(privateProjectFolderUrl+"?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in in folder '+ privateProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user' + demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' + demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' + demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});


/**
 * Project-level ontology autocomplete functions
 */


describe(publicProjectUrl + "?ontology_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid autocomplete requests for ontologies in project '+ publicProjectUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow autocomplete requests for ontologies in project '+ publicProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ publicProjectUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ publicProjectUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(metadataOnlyProjectUrl + "?ontology_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid autocomplete requests for ontologies in project '+ metadataOnlyProjectUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow autocomplete requests for ontologies in project '+ metadataOnlyProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ metadataOnlyProjectUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ metadataOnlyProjectUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(privateProjectUrl + "?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ privateProjectUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ privateProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ privateProjectUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ privateProjectUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Folder-level ontology autocomplete functions
 */


describe(publicProjectFolderUrl + "?ontology_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid ontology autocomplete requests for ontologies in folder '+ publicProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow ontology autocomplete requests for ontologies in folder '+ publicProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(metadataOnlyProjectFolderUrl+"?ontology_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid ontology autocomplete requests for ontologies in folder '+ metadataOnlyProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow ontology autocomplete requests for ontologies in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(privateProjectFolderUrl+"?metadata_recommendations", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ privateProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Project-level descriptor autocomplete functions
 */


describe(publicProjectUrl + "?descriptor_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid descriptor autocomplete requests for ontologies in project '+ publicProjectUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow descriptor autocomplete requests for ontologies in project '+ publicProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ publicProjectUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ publicProjectUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(metadataOnlyProjectUrl + "?descriptor_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid descriptor autocomplete requests for ontologies in project '+ metadataOnlyProjectUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow descriptor autocomplete requests for ontologies in project '+ metadataOnlyProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in project '+ metadataOnlyProjectUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in project '+ metadataOnlyProjectUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(privateProjectUrl + "?descriptor_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid descriptor autocomplete requests in project '+ privateProjectUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow descriptor autocomplete requests in project '+ privateProjectUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid descriptor autocomplete requests in project '+ privateProjectUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow descriptor autocomplete requests in project '+ privateProjectUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

/**
 * Folder-level descriptor descriptor autocomplete functions
 */


describe(publicProjectFolderUrl + "?descriptor_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid descriptor autocomplete requests for ontologies in folder '+ publicProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow descriptor autocomplete requests for ontologies in folder '+ publicProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ publicProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(metadataOnlyProjectFolderUrl+"?descriptor_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid descriptor autocomplete requests for ontologies in folder '+ metadataOnlyProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow descriptor autocomplete requests for ontologies in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ metadataOnlyProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});

describe(privateProjectFolderUrl+"?descriptor_autocomplete", function ()
{
    it('[HTML] should refuse the request if "application/json" Accept header is absent', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ privateProjectFolderUrl +' if no user is authenticated.', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' +demouser1.username+ ' is authenticated (creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should forbid requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' +demouser2.username+ ' is authenticated (not contributor nor creator).', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should allow requests for recommendations in folder '+ privateProjectFolderUrl +' if user ' +demouser3.username+ ' is authenticated (contributor).', function (done)
    {
        //TODO
        done();
    });
});