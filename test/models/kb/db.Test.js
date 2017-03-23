var Config = GLOBAL.Config;
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var async = require('async');
chai.use(chaiHttp);

var should = chai.should();

describe('db.js', function () {
    it('deletes all graphs', function (done) {
        var graphs = Object.keys(GLOBAL.db);
        var conn = GLOBAL.db.default.connection;

        async.map(graphs, function(graph, cb){

            var graphUri = GLOBAL.db[graph].graphUri;
            conn.deleteGraph(graphUri, function(err){
                if(err)
                {
                    done(err);
                }
                else
                {
                    conn.graphExists(graphUri, function(err, exists){
                        if(exists)
                        {
                            done(err);
                        }
                        else
                        {
                            cb(null, exists);
                        }
                    });
                }
            });
        }, function(err, res)
        {
            done(err);
        });
    });
});
