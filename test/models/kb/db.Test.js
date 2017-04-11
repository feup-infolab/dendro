let Config = GLOBAL.Config;
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const async = require('async');
chai.use(chaiHttp);

let should = chai.should();

describe('db.js', function () {
    it('deletes all graphs', function (done) {
        const graphs = Object.keys(GLOBAL.db);
        const conn = GLOBAL.db.default.connection;

        async.map(graphs, function(graph, cb){

            const graphUri = GLOBAL.db[graph].graphUri;
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
