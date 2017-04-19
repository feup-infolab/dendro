var Config = GLOBAL.Config;
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var async = require('async');
chai.use(chaiHttp);

var should = chai.should();

module.exports.deleteGraphs = function (finish) {
    var graphs = Object.keys(GLOBAL.db);
    var conn = GLOBAL.db.default.connection;

    async.map(graphs, function(graph, cb){

        var graphUri = GLOBAL.db[graph].graphUri;
        conn.deleteGraph(graphUri, function(err){
            //err = new Error("Que error mai lindo!!!!");
            if(err)
            {
                //finish(err);
                cb(err, null);
            }
            else
            {
                conn.graphExists(graphUri, function(err, exists){
                    /*exists = true;
                    err = new Error("Que error mai lindo22!!!!");*/
                    if(exists)
                    {
                        //finish(err);
                        cb(err, exists);
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
        should.equal(err, null);
        finish(err, res);
    });
};

/*
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
*/