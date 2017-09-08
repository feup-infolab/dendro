const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const sendAnyResponse  = function(data, options, req, res, next)
{
    if(isNull(data))
        data = {};
    
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if(!options.code)
    {
        options.code = 200;
    }

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const jsonResponse = data;
        let result;
        switch(options.code)
        {
            case 200:
                result = "ok";
                break;
            case 404:
                result = "not_found";
                break;
            case 500:
                result = "error";
                break;
            case 405:
                result = "invalid_request";
                break;
            default:
                console.error("Unknown status code : " + options.code);
                result = "other";
                break;
        }

        jsonResponse.result = result;

        if(!isNull(options.messages))
        {
            jsonResponse.message = options.messages;
        }

        if(!isNull(options.error))
        {
            jsonResponse.error = options.error;
        }

        res.status(options.code).json(jsonResponse);
    }
    else
    {
        const viewToRender = options.view;
        const locals = data;

        if(!isNull(options.messages))
        {
            locals.error_messages = options.messages;
        }
        
        res.status(options.code).render(viewToRender, locals);
    }
};

const sendNotFoundResponse = function(data, options, req, res, next)
{
    options.code = 404;
    options.error_messages = [options.messages];
    sendAnyResponse(data, options, req, res, next);
};

const sendForbiddenResponse = function(data, options, req, res, next)
{
    options.code = 403;
    options.error_messages = [options.messages];
    sendAnyResponse(data, options, req, res, next);
};

const sendInternalErrorResponse = function(data, options, req, res, next)
{
    options.code = 500;
    options.error_messages = [options.messages];
    sendAnyResponse(data, options, req, res, next);
};

const sendInvalidRequestResponse = function(data, options, req, res, next)
{
    options.code = 500;
    options.error_messages = [options.messages];
    sendAnyResponse(data, options, req, res, next);
};

const sendOKResponse = function(data, options, req, res, next)
{
    options.code = 200;
    options.success_messages = [options.messages];

    sendAnyResponse(data, options, req, res, next);
};

const sendResponse = {
    notFound : sendNotFoundResponse,
    ok : sendOKResponse,
    error : sendInternalErrorResponse,
    invalidRequest :  sendInvalidRequestResponse
};

module.exports.sendResponse = sendResponse;