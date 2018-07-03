const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const VirtualBoxManager = rlequire("dendro", "src/utils/virtualbox/vm_manager.js").VirtualBoxManager;

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
