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
const pdfMockFile2 = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile2.js"));
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
                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, pdfMockFile2, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        console.log(pdfMockFile2);
                        pdfMockFile2.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.descriptors.should.be.instanceof(Array);
                            artigo = JSON.parse(res.text).descriptors[7].value;
                            descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);

                            descriptorUtils.containsAllMetadata(
                                pdfMockFile2.metadata,
                                JSON.parse(res.text).descriptors
                            );

                            done();
                        });
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
                console.log(artigo.toString());
                keywordsUtils.preprocessing(artigo, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("introduction");
                    // console.log(res.text);
                    // res.text.should.contain("science");
                    keywordsUtils.termextraction(res.text, artigo.toString(), agent, function (err, te)
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
                console.log(artigo.toString());
                keywordsUtils.preprocessing(artigo, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("introduction");
                    // console.log(res.text);
                    // res.text.should.contain("science");
                    keywordsUtils.termextraction(res.text, artigo.toString(), agent, function (err, te)
                    {
                        te.statusCode.should.equal(200);
                        console.log(te.text);
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
            /*
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.preprocessing("Sources tell us that Google is acquiring Kaggle, a platform that hosts data science and machine learning    competitions. Details about the transaction remain somewhat vague , but given that Google is hosting    its Cloud Next conference in San Francisco this week, the official announcement could come as early    as tomorrow.  Reached by phone, Kaggle co-founder CEO Anthony Goldbloom declined to deny that the    acquisition is happening. Google itself declined \\'to comment on rumors\\'.    Kaggle, which has about half a million data scientists on its platform, was founded by Goldbloom    and Ben Hamner in 2010. The service got an early start and even though it has a few competitors    like DrivenData, TopCoder and HackerRank, it has managed to stay well ahead of them by focusing on its    specific niche. The service is basically the de facto home for running data science  and machine learning    competitions.  With Kaggle, Google is buying one of the largest and most active communities for    data scientists - and with that, it will get increased mindshare in this community, too    (though it already has plenty of that thanks to Tensorflow and other projects).    Kaggle has a bit of a history with Google, too, but that\\'s pretty recent. Earlier this month,    Google and Kaggle teamed up to host a $100,000 machine learning competition around classifying    YouTube videos. That competition had some deep integrations with the Google Cloud Platform, too.    Our understanding is that Google will keep the service running - likely under its current name.    While the acquisition is probably more about Kaggle\\'s community than technology, Kaggle did build    some interesting tools for hosting its competition and \\'kernels\\', too. On Kaggle, kernels are    basically the source code for analyzing data sets and developers can share this code on the    platform (the company previously called them \\'scripts\\').  Like similar competition-centric sites,    Kaggle also runs a job board, too. It\\'s unclear what Google will do with that part of the service.    According to Crunchbase, Kaggle raised $12.5 million (though PitchBook says it\\'s $12.75) since its    launch in 2010. Investors in Kaggle include Index Ventures, SV Angel, Max Levchin, Naval Ravikant,    Google chief economist Hal Varian, Khosla Ventures and Yuri Milner", agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    // console.log(res.text);
                    res.text.should.contain("source");
                    res.text.should.contain("datum");
                    res.text.should.contain("science");

                    done();

                    keywordsUtils.termextraction(res.text, "Sources tell us that Google is acquiring Kaggle, a platform that hosts data science and machine learning    competitions. Details about the transaction remain somewhat vague , but given that Google is hosting    its Cloud Next conference in San Francisco this week, the official announcement could come as early    as tomorrow.  Reached by phone, Kaggle co-founder CEO Anthony Goldbloom declined to deny that the    acquisition is happening. Google itself declined \\'to comment on rumors\\'.    Kaggle, which has about half a million data scientists on its platform, was founded by Goldbloom    and Ben Hamner in 2010. The service got an early start and even though it has a few competitors    like DrivenData, TopCoder and HackerRank, it has managed to stay well ahead of them by focusing on its    specific niche. The service is basically the de facto home for running data science  and machine learning    competitions.  With Kaggle, Google is buying one of the largest and most active communities for    data scientists - and with that, it will get increased mindshare in this community, too    (though it already has plenty of that thanks to Tensorflow and other projects).    Kaggle has a bit of a history with Google, too, but that\\'s pretty recent. Earlier this month,    Google and Kaggle teamed up to host a $100,000 machine learning competition around classifying    YouTube videos. That competition had some deep integrations with the Google Cloud Platform, too.    Our understanding is that Google will keep the service running - likely under its current name.    While the acquisition is probably more about Kaggle\\'s community than technology, Kaggle did build    some interesting tools for hosting its competition and \\'kernels\\', too. On Kaggle, kernels are    basically the source code for analyzing data sets and developers can share this code on the    platform (the company previously called them \\'scripts\\').  Like similar competition-centric sites,    Kaggle also runs a job board, too. It\\'s unclear what Google will do with that part of the service.    According to Crunchbase, Kaggle raised $12.5 million (though PitchBook says it\\'s $12.75) since its    launch in 2010. Investors in Kaggle include Index Ventures, SV Angel, Max Levchin, Naval Ravikant,    Google chief economist Hal Varian, Khosla Ventures and Yuri Milner", agent, function (err, te)
                    {
                        te.statusCode.should.equal(200);
                        te.text.should.contain("google");
                        te.text.should.contain("kaggle");
                        // te.text.should.contain("3.068528194400547");
                        // te.text.should.contain("3.068528194400547");

                        keywordsUtils.dbpedialookup(te.text, agent, function (err, db)
                        {
                            db.statusCode.should.equal(200);
                            // console.log(db.body.dbpediaresults.result);
                            db.text.should.contain("Google");
                            db.text.should.contain("Kaggle");
                            done();
                        });
                    });
                });
            });*/
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
