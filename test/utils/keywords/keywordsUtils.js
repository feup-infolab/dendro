const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);

const loadfiles = function (text, cb)
{
    const path = "/keywords/loadfiles";
    agent
        .get(path)
        .send({text: text})
        .then(function (response, res)
        {
            if (response.ok)
            {
                cb(null, response);
            }
            else
            {
                cb("Error processing files.", response);
            }
        });
};

const preprocessing = function (text, cb)
{
    const path = "/keywords/preprocessing";
    agent
        .get(path)
        .send({text: text})
        .then(function (response, res)
        {
            if (response.ok)
            {
                cb(null, response);
            }
            else
            {
                cb("Error processing text.", response);
            }
        });
};

const termextraction = function (text, documents, cb)
{
    const path = "/keywords/termextraction";
    agent
        .get(path)
        .send({text: text, documents: documents})
        .then(function (response, res)
        {
            if (response.ok)
            {
                cb(null, response);
            }
            else
            {
                cb("Error extracting terms.", response);
            }
        });
};

const dbpedialookup = function (text, cb)
{
    const path = "/keywords/dbpedialookup";
    agent
        .get(path)
        .send({keywords: text})
        .then(function (response, res)
        {
            if (response.ok)
            {
                cb(null, response);
            }
            else
            {
                cb("Error dbpedia lookup.", response);
            }
        });
};

module.exports = {
    loadfiles: loadfiles,
    preprocessing: preprocessing,
    termextraction: termextraction,
    dbpedialookup: dbpedialookup
};
