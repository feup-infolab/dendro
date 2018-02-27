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
            .send(interactionData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};
