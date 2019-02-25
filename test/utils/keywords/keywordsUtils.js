const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);

module.exports.loadfiles = function (text, agent, cb)
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

module.exports.processExtract = function (text, agent, cb)
{
    const path = "/keywords/processExtract";
    agent
        .post(path)
        .set("Accept", "application/json")
        .send(text)
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

module.exports.preProcessing = function (text, agent, cb)
{
    const path = "/keywords/preProcessing";
    agent
        .post(path)
        .set("Accept", "application/json")
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

module.exports.termExtraction = function (text, documents, agent, cb)
{
    const path = "/keywords/termExtraction";

    agent
        .post(path)
        .set("Accept", "application/json")
        .attach("documents", new Buffer.from(JSON.stringify({text: text, documents: documents})), "documents.json")
        .end(function (err, res)
        {
            cb(err, res);
        });
};

// module.exports.termExtraction = function (text, documents, agent, cb)
// {
//     console.log(text);
//     const path = "/keywords/termExtraction";
//     agent
//         .post(path)
//         .attach("text", new Buffer.from(JSON.stringify({text: text, documents: documents})))
//         .set("Accept", "application/json")
//         .then(function (response, res)
//         {
//             if (response.ok)
//             {
//                 cb(null, response);
//             }
//             else
//             {
//                 cb("Error extracting terms.", response);
//             }
//         });
// };

module.exports.dbpediaResourceLookup = function (text, agent, cb)
{
    const path = "/keywords/dbpediaResourceLookup";
    agent
        .post(path)
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
        })
        .catch(function (error)
        {
            console.log("Error during dbpedia lookup" + error);
            // cb(null, error);
        });
};

module.exports.lovPropertiesProperties = function (text, agent, cb)
{
    const path = "/keywords/lovProperties";
    agent
        .post(path)
        .send({concepts: text})
        .then(function (response, res)
        {
            if (response.ok)
            {
                cb(null, response);
            }
            else
            {
                cb("Error dbpedia properties.", response);
            }
        })
        .catch(function (error)
        {
            console.log("Error during dbpedia properties return" + error);
            // cb(null, error);
        });
};
module.exports.clustering = function (text, agent, cb)
{
    const path = "/keywords/clustering";
    agent
        .post(path)
        .send({terms: text})
        .then(function (response, res)
        {
            if (response.ok)
            {
                cb(null, response);
            }
            else
            {
                cb("Error clustering: ", response);
            }
        })
        .catch(function (error)
        {
            console.log("Error during term clustering" + error);
            // cb(null, error);
        });
};
