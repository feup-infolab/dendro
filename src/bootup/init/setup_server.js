const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const http = require('http');
const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const setupServer = function(app, callback)
{
    const server = http.createServer(function (req, res)
    {
        const domain = require('domain');
        const reqd = domain.create();
        reqd.add(req);
        reqd.add(res);

        // On error dispose of the domain
        reqd.on('error', function (error)
        {
            console.error('Error!\n' + "Code: \n" + error.code + " \nMessage: \n" + error.message + "Request URL: \n" + req.originalRequestUrl);

            if (!isNull(error.stack))
            {
                const util = require('util');
                console.error('Stack Trace : ' + util.format(error.stack));
            }

            reqd.dispose();
        });

        // Pass the request to express
        app(req, res);
    });

    callback(null, app, server);
};

module.exports.setupServer = setupServer;