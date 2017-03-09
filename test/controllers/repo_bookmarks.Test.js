process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);

let should = chai.should();

let agent = null;

let demouser1 = require("../mockdata/users/demouser1.js");
let demouser2 = require("../mockdata/users/demouser2.js");

describe('/external_repositories/types', function ()
{
    /**
     * Repository bookmark types
     */

    it('[JSON] should not get the list of bookmark types if there is no authenticated user', function (done)
    {
        done(); //TODO
    });

    it("[HTML] should not get the list of bookmark types if the Accept: 'application/json' header is not present, even when the " + demouser1.username + " user is authenticated", function (done)
    {
        done(); //TODO
    });


    it('[JSON] should get the list of available repository bookmark types if ' + demouser1.username + ' is authenticated', function (done)
    {
        done(); //TODO
    });
});


describe('/external_repositories/my (without any bookmarks)', function ()
{
    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present and if the user is unauthenticated", function (done)
    {
        done(); //TODO
    });

    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present, even when the " + demouser1.username + " user is authenticated", function (done)
    {
        done(); //TODO
    });

    /**
     * Repository bookmark listing 
     */
    
    it('[JSON] should not get the list of user bookmarks if there is no authenticated user', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should get an empty list of bookmarks for ' + demouser1.username + ' because we have not yet created any', function (done)
    {
        done(); //TODO
    });
});

describe('/external_repositories/new', function ()
{
    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present and if the user is unauthenticated", function (done)
    {
        done(); //TODO
    });

    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present, even when the " + demouser1.username + " user is authenticated", function (done)
    {
        done(); //TODO
    });
    
    /**
     * Repository bookmark creation
     */

    it('[JSON] should refuse to create a bookmark if the user is not authenticated', function (done)
    {
        done(); //TODO
    });

    //CKAN
    it('[JSON] should create a CKAN platform bookmark if all the necessary values are present', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse to create a CKAN platform bookmark if there are missing values', function (done)
    {
        done(); //TODO
    });

    //DSpace
    it('[JSON] should create a DSpace platform bookmark if all the necessary values are present', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse to create a DSpace platform bookmark if there are missing values', function (done)
    {
        done(); //TODO
    });

    //EPrints
    it('[JSON] should create a EPrints platform bookmark if all the necessary values are present', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse to create a EPrints platform bookmark if there are missing values', function (done)
    {
        done(); //TODO
    });

    //Figshare
    it('[JSON] should create a Figshare platform bookmark if all the necessary values are present', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse to create a Figshare platform bookmark if there are missing values', function (done)
    {
        done(); //TODO
    });

    //Zenodo
    it('[JSON] should create a Zenodo platform bookmark if all the necessary values are present', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse to create a Zenodo platform bookmark if there are missing values', function (done)
    {
        done(); //TODO
    });

    //EUDAT B2Share
    it('[JSON] should create a EUDAT B2Share platform bookmark if all the necessary values are present', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse to create a EUDAT B2Share platform bookmark if there are missing values', function (done)
    {
        done(); //TODO
    });
});

describe('/external_repositories/my (after creating bookmarks)', function ()
{

    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present and if the user is unauthenticated", function (done)
    {
        done(); //TODO
    });
    
    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present, even when the " + demouser1.username + " user is authenticated", function (done)
    {
        done(); //TODO
    });
    
    /**
     * Repository bookmark listing
     */

    it('[JSON] should not get the list of user bookmarks if there is no authenticated user', function (done)
    {
        done(); //TODO
    });

    it("[HTML] should not get the list of bookmarks if the Accept: 'application/json' header is not present, even when the " + demouser1.username + " user is authenticated", function (done)
    {
        done(); //TODO
    });


    it('[JSON] should get the list of bookmarks for ' + demouser1.username + ". It should contain a bookmark for every type of repository.", function (done)
    {
        done(); //TODO
    });

    it('[JSON] should get the list of bookmarks for ' + demouser2.username + ". It should contain a bookmark for every type of repository.", function (done)
    {
        done(); //TODO
    });
});

describe('/external_repositories', function ()
{
    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present with unauthenticated user", function (done)
    {
        done(); //TODO
    });
    
    it('[JSON] should refuse the request if the user is unauthenticated.', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse the request if the user is authenticated but is not a Dendro administrator.', function (done)
    {
        done(); //TODO
    });

    it('[JSON] should refuse the request if the user is authenticated but is not a Dendro administrator.', function (done)
    {
        done(); //TODO
    });

    it("[HTML] should refuse the request if the Accept: 'application/json' header is not present, even if the user is authenticated as ", function (done)
    {
        done(); //TODO
    });
});
