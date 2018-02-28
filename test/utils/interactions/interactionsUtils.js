const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

exports.recordInteraction = function (jsonOnly, folderUri, projectHandle, interactionData, agent, cb)
{
    const path = folderUri + "?register_interaction";

    if (jsonOnly)
    {
        agent
            .post(path)
            .send(interactionData)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(interactionData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromQuickList = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_quick_list";
    if(jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.getLatestInteractionInDB = function (callback)
{
    Config.mysql.default.pool.getConnection(function (err, connection)
    {
        if (isNull(err))
        {
            const countInteractionsQuery = "SELECT * FROM interactions ORDER BY ID DESC LIMIT 1" + ";\n";
            connection.query(
                countInteractionsQuery,
                function (err, result, fields)
                {
                    connection.release();
                    if (isNull(err))
                    {
                        callback(err, result);
                    }
                    else
                    {
                        return callback(true, "[ERROR] Unable get the latest interaction info on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                    }

                }
            );
        }
        else
        {
            return callback(true, "[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
        }
    });
};

exports.getNumberOfInteractionsInDB = function (callback)
{
    Config.mysql.default.pool.getConnection(function (err, connection)
    {
        if (isNull(err))
        {
            const countInteractionsQuery = "SELECT count(*) as nInteractions FROM interactions" + ";\n";
            connection.query(
                countInteractionsQuery,
                function (err, result, fields)
                {
                    connection.release();
                    if (isNull(err))
                    {
                        callback(err, result);
                    }
                    else
                    {
                        return callback(true, "[ERROR] Unable to count the number of interations on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                    }

                }
            );
        }
        else
        {
            return callback(true, "[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
        }
    });
};