function isNull(object)
{
    return typeof object == "undefined" || object === null;
}

module.exports.isNull = isNull;