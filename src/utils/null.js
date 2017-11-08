function isNull (object)
{
    if (object === null)
    {
        return true;
    }
    if (typeof object === 'undefined')
    {
        return true;
    }
    return false;
}

module.exports.isNull = isNull;
