const rlequire = require("rlequire");
const IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;

const appendIndexToRequests = function (app, index, callback)
{
    const appendIndexToRequest = function (req, res, next)
    {
        req.index = IndexConnection.getDefault();
        // for debugging
        req.util = require("util");
        req.async = require("async");

        req.sha1_encode = function (value)
        {
            const crypto = require("crypto");
            return crypto.createHash("sha1").update(value);
        };

        next(null, req, res);
    };

    app.use(appendIndexToRequest);

    callback(null);
};

module.exports.appendIndexToRequests = appendIndexToRequests;
