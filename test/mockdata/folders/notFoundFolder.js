const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const folderName = "notFoundFolder";
const publicProject = require("../projects/public_project");
const privateProject = require("../projects/private_project");
const metadataOnlyProject = require("../projects/metadata_only_project");
const projectsArray = [publicProject, privateProject, metadataOnlyProject];
const activeProjectIndex = 0;
let folderData = {
    name : folderName,
    version: 0,
    pathInProject : '',
    download_md5 : '',
    backup_md5 : '',
    files : [
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockFile.js"))
    ],
    metadata : [
        {
            uri:"http://purl.org/dc/terms/creator",
            prefix:"dcterms",
            ontology:"http://purl.org/dc/terms/",
            shortName:"creator",
            prefixedForm:"dcterms:creator",
            type:1,
            control:"url_box",
            label:"Creator",
            comment:"An entity primarily responsible for making the resource.",
            recommendation_types:{dc_element_forced:true},
            recommendationCallId:"fc0cdf5f-5f85-4692-aa41-72ce268d048b",
            recommendationCallTimeStamp:"2017-03-15T10:31:15.253Z",
            $$hashKey:"object:314",
            just_added:true,
            added_from_manual_list:true,
            rankingPosition:12,
            pageNumber:0,
            interactionType:"accept_descriptor_from_manual_list",
            recommendedFor:"http://" + Config.host + "/project/" + projectsArray[activeProjectIndex].handle + "/data/" + folderName,
            value:"demouser1"
        },
        {
            uri:"http://purl.org/dc/terms/title",
            prefix:"dcterms",
            ontology:"http://purl.org/dc/terms/",
            shortName:"title",
            prefixedForm:"dcterms:title",
            type:3,
            control:"input_box",
            label:"Title",
            comment:"A name given to the resource.",
            recommendation_types:{dc_element_forced:true},
            recommendationCallId:"fc0cdf5f-5f85-4692-aa41-72ce268d048b",
            recommendationCallTimeStamp:"2017-03-15T10:31:15.253Z",
            $$hashKey:"object:352",
            just_added:true,
            added_from_manual_list:true,
            rankingPosition:50,
            pageNumber:0,
            interactionType:"accept_descriptor_from_manual_list",
            recommendedFor:"http://" + Config.host + "/project/" + projectsArray[activeProjectIndex].handle + "/data/" + folderName,
            value: folderName + " title"
        }
    ],
    invalidMetadata : ["Garbage"]
};

module.exports = folderData;