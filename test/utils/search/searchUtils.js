exports.search = function (jsonOnly, agent, queryString, cb)
{
    const path = '/search?q=' + queryString;
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};
