const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const VirtualBoxManager = require(Pathfinder.absPathInSrcFolder("utils/virtualbox/vm_manager.js")).VirtualBoxManager;

const initVirtualBoxVM = function (app, callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        try
        {
            VirtualBoxManager.startVM(function (err, result)
            {
                callback(err, result);
            });
        }
        catch (e)
        {
            const msg = "Unable to start Virtualbox VM!" + JSON.stringify(e);
            Logger.log("error", msg);
            callback(e, msg);
        }
    }
    else
    {
        callback(null);
    }
};

module.exports.initVirtualBoxVM = initVirtualBoxVM;
