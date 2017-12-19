const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);
const md5 = require("md5");
const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const keywordsUtils = require(Pathfinder.absPathInTestsFolder("utils/keywords/keywordsUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));
const BusPerformance = require(Pathfinder.absPathInTestsFolder("mockdata/files/BusPerformance.js"));
const SimulatingVehicle = require(Pathfinder.absPathInTestsFolder("mockdata/files/SimulatingVehicle.js"));
const driverattitude = require(Pathfinder.absPathInTestsFolder("mockdata/files/driverattitude.js"));
const RegenerativeBraking = require(Pathfinder.absPathInTestsFolder("mockdata/files/RegenerativeBraking.js"));
const RoutePlanning = require(Pathfinder.absPathInTestsFolder("mockdata/files/RoutePlanning.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const addContributorsToProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

const csvResultMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInCSV.csv"), "utf-8"));
const jsonResultMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInJSON.json"), "utf-8"));

const csvResultMD5WithPageAndSkip = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInCSV_200_to_250.csv"), "utf-8"));
const jsonResultMD5WithPageAndSkip = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInJSON_200_to_250.json"), "utf-8"));
const emptyCSVMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/emptyCSVResult.csv"), "utf-8"));

// Dendro Keywords
describe("Searches DBpedia for important terms", function (done)
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    var artigo;

    describe("[POST] [PRIVATE PROJECT] [Valid Cases] /project/" + privateProject.handle + "/data/:foldername?upload", function ()
    {
        it("Should upload a PDF file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, BusPerformance, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    const newResourceUri = res.body[0].uri;

                    itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.descriptors.should.be.instanceof(Array);
                        artigo = JSON.parse(res.text).descriptors[7].value;
                        descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);

                        descriptorUtils.containsAllMetadata(
                            BusPerformance.metadata,
                            JSON.parse(res.text).descriptors
                        );

                        done();
                    });
                });
            });
        });
    });

    describe("[GET] /keywords/conceptextraction", function ()
    {
        it("[HTML] Simple test to extract POS and lemma", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.preprocessing("a really Interesting string with some words", agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    // console.log(res.text);
                    res.text.should.contain("interesting");
                    res.text.should.contain("string");
                    res.text.should.contain("word");
                    done();
                });
            });
        });
        it("[GET] single term extraction", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // console.log(artigo.toString());
                keywordsUtils.preprocessing(artigo, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("introduction");
                    // console.log(res.text);
                    // res.text.should.contain("science");
                    keywordsUtils.termextraction([res.text], [artigo.toString()], agent, function (err, te)
                    {
                        te.statusCode.should.equal(200);
                        // te.text.should.contain("google");
                        // te.text.should.contain("kaggle");
                        // te.text.should.contain("3.068528194400547");
                        // te.text.should.contain("3.068528194400547");

                        done();
                    });
                });
            });
        });
        it("[Get] DBpedia lookup higher frequency items", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // console.log(artigo.toString());
                keywordsUtils.preprocessing(artigo, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("introduction");
                    // console.log(res.text);
                    // res.text.should.contain("science");
                    keywordsUtils.termextraction([res.text], [artigo.toString()], agent, function (err, te)
                    {
                        te.statusCode.should.equal(200);
                        // console.log(te.text);
                        // te.text.should.contain("google");
                        // te.text.should.contain("kaggle");
                        // te.text.should.contain("3.068528194400547");
                        // te.text.should.contain("3.068528194400547");

                        keywordsUtils.dbpedialookup(te.text, agent, function (err, db)
                        {
                            db.statusCode.should.equal(200);
                            console.log(db.body.dbpediauri.result);
                            // db.text.should.contain("Google");
                            // db.text.should.contain("Kaggle");
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("[GET] Complete path using all 4 files", function ()
    {
        var artigos = [];
        var textprocessado = [];
        it("Should load every pdf and extract their content", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, BusPerformance, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    const newResourceUri = res.body[0].uri;
                    itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.descriptors.should.be.instanceof(Array);
                        artigos.push(JSON.parse(res.text).descriptors[7].value);
                        fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, SimulatingVehicle, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.should.be.instanceof(Object);
                            res.body.should.be.instanceof(Array);
                            res.body.length.should.equal(1);
                            const newResourceUri = res.body[0].uri;
                            itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                            {
                                res.statusCode.should.equal(200);
                                res.body.descriptors.should.be.instanceof(Array);
                                artigos.push(JSON.parse(res.text).descriptors[7].value);
                                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, driverattitude, function (err, res)
                                {
                                    res.statusCode.should.equal(200);
                                    res.body.should.be.instanceof(Object);
                                    res.body.should.be.instanceof(Array);
                                    res.body.length.should.equal(1);
                                    const newResourceUri = res.body[0].uri;
                                    itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        res.body.descriptors.should.be.instanceof(Array);
                                        artigos.push(JSON.parse(res.text).descriptors[7].value);
                                        fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, RegenerativeBraking, function (err, res)
                                        {
                                            res.statusCode.should.equal(200);
                                            res.body.should.be.instanceof(Object);
                                            res.body.should.be.instanceof(Array);
                                            res.body.length.should.equal(1);
                                            const newResourceUri = res.body[0].uri;
                                            itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                                            {
                                                res.statusCode.should.equal(200);
                                                res.body.descriptors.should.be.instanceof(Array);
                                                artigos.push(JSON.parse(res.text).descriptors[7].value);
                                                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, RoutePlanning, function (err, res)
                                                {
                                                    res.statusCode.should.equal(200);
                                                    res.body.should.be.instanceof(Object);
                                                    res.body.should.be.instanceof(Array);
                                                    res.body.length.should.equal(1);
                                                    const newResourceUri = res.body[0].uri;
                                                    itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                                                    {
                                                        res.statusCode.should.equal(200);
                                                        res.body.descriptors.should.be.instanceof(Array);
                                                        artigos.push(JSON.parse(res.text).descriptors[7].value);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        it("Should pre process text", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.preprocessing(artigos[0], agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("introduction");
                    console.log(artigos[0]);
                    console.log(res.text);
                    textprocessado.push(res.text);
                    keywordsUtils.preprocessing(artigos[1], agent, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        res.text.should.contain("introduction");
                        console.log(artigos[1]);
                        console.log(res.text);
                        textprocessado.push(res.text);
                        keywordsUtils.preprocessing(artigos[2], agent, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.text.should.contain("introduction");
                            console.log(artigos[2]);
                            console.log(res.text);
                            textprocessado.push(res.text);
                            keywordsUtils.preprocessing(artigos[3], agent, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                res.text.should.contain("introduction");
                                console.log(artigos[3]);
                                console.log(res.text);
                                textprocessado.push(res.text);

                                keywordsUtils.preprocessing(artigos[4], agent, function (err, res)
                                {
                                    res.statusCode.should.equal(200);
                                    res.text.should.contain("introduction");
                                    console.log(artigos[4]);
                                    console.log(res.text);
                                    textprocessado.push(res.text);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
        it("Should extract keywords", function (done)
        {
            keywordsUtils.termextraction(textprocessado, artigos, agent, function (err, te)
            {
                te.statusCode.should.equal(200);
                // te.text.should.contain("google");
                // te.text.should.contain("kaggle");
                // te.text.should.contain("3.068528194400547");
                // te.text.should.contain("3.068528194400547");

                done();
            });
        });
    });

    after(function (done)
    {
    // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
