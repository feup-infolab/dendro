const appendIndexToRequests = function (app, index, callback)
{
    const appendIndexToRequest = function (req, res, next)
    {
        req.index = index;
        // for debugging
        req.util = require('util');
        req.async = require('async');

        req.sha1_encode = function (value)
        {
            const crypto = require('crypto');
            return crypto.createHash('sha1').update(value);
        };

        next(null, req, res);
    };

    app.use(appendIndexToRequest);

    callback(null);
};

module.exports.appendIndexToRequests = appendIndexToRequests;
