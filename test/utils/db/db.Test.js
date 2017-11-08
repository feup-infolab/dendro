const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const async = require('async');
chai.use(chaiHttp);

const should = chai.should();

module.exports.deleteGraphs = function (finish)
{
    const graphs = Object.keys(Config.db);
    const conn = Config.db.default.connection;

    async.mapSeries(graphs, function (graph, cb)
    {
        const graphUri = Config.db[graph].graphUri;
        conn.deleteGraph(graphUri, function (err)
        {
            if (err)
            {
                cb(err, null);
            }
            else
            {
                conn.graphExists(graphUri, function (err, exists)
                {
                    if (exists)
                    {
                        cb(err, exists);
                    }
                    else
                    {
                        cb(null, exists);
                    }
                });
            }
        });
    }, function (err, res)
    {
        should.equal(err, null);
        finish(err, res);
    });
};
