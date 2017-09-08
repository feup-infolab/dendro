function isNull(object)
{
    if(object === null)
    {
        return true;
    }
    else
    {
        if(typeof object === "undefined")
        {
            return true;
        }
        else
        {
            return false;
        }
    }
}

module.exports.isNull = isNull;