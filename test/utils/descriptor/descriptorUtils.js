const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);

const getDescriptorsFromOntology = function (jsonOnly, agent, ontologyPrefix, cb)
{
    // query.descriptors_from_ontology
    const path = "/descriptors";
    if (jsonOnly)
    {
        agent
            .get(path)
            .query(
                {
                    descriptors_from_ontology: ontologyPrefix,
                    from_ontology: ontologyPrefix
                })
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .query(
                {
                    descriptors_from_ontology: ontologyPrefix,
                    from_ontology: ontologyPrefix
                })
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getResourceDescriptorsFromOntology = function (jsonOnly, agent, resourceUri, ontologyPrefix, cb)
{
    const path = resourceUri + "?descriptors_from_ontology=" + ontologyPrefix;
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getProjectDescriptorsFromOntology = function (jsonOnly, agent, ontologyPrefix, projectHandle, cb)
{
    const path = "/project/" + projectHandle + "?descriptors_from_ontology=" + ontologyPrefix;
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const noPrivateDescriptors = function (descriptors)
{
    for (let i = 0; i < descriptors.length; i++)
    {
        if ((!descriptors[i].api_acessible && (descriptors.locked || descriptors.private || descriptors.locked_for_project || descriptors.immutable)))
        {
            return false;
        }
    }

    return true;
};

const containsAllMetadata = function (descriptorsThatShouldBePresent, descriptorsArray)
{
    for (let i = 0; i < descriptorsThatShouldBePresent.length; i++)
    {
        let found = false;
        for (let j = 0; j < descriptorsArray.length; j++)
        {
            if (descriptorsThatShouldBePresent[i].prefix === descriptorsArray[j].prefix &&
                descriptorsThatShouldBePresent[i].shortName === descriptorsArray[j].shortName &&
                descriptorsThatShouldBePresent[i].value === descriptorsArray[j].value
            )
            {
                found = true;
            }
        }

        if (!found)
        {
            return false;
        }
    }

    return true;
};

module.exports = {
    getProjectDescriptorsFromOntology: getProjectDescriptorsFromOntology,
    noPrivateDescriptors: noPrivateDescriptors,
    containsAllMetadata: containsAllMetadata,
    getDescriptorsFromOntology: getDescriptorsFromOntology,
    getResourceDescriptorsFromOntology: getResourceDescriptorsFromOntology
};
