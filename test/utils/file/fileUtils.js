module.exports.binaryParser = function (res, cb) {
    res.setEncoding("binary");
    res.data = "";
    res.on("data", function (chunk) {
        res.data += chunk;
    });
    res.on("end", function () {
        cb(null, new Buffer(res.data, "binary"));
    });
};


module.exports.uploadFile = function(acceptsJSON, agent, file, targetUrl, fileType, cb)
{
    const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    let supertest = require('supertest');

    let request = supertest(Config.host);
    request.set("Cookie", agent.cookies); //TODO FIX

    request.post(targetUrl)
        .field('extra_info', '{"in":"case you want to send json along with your file"}')
        .attach(fileType, file.location)
        .end(cb);
};

