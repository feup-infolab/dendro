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

