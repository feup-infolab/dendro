const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

function Logger()
{

}

Logger.override_console = function(window, morgan)
{
    const oldConsole = window.console;
    // define a new console
    const console = (function (oldCons) {
        return {
            log: function (text) {
                oldCons.log(text);
            },
            info: function (text) {
                oldCons.info(text);
                // Your code
            },
            warn: function (text) {
                oldCons.warn(text);
                // Your code
            },
            error: function (text) {
                oldCons.error(text);
                // Your code
            }
        };
    }(window.console));

//Then redefine the old console
    window.console = console;
};

Logger.log_boot_message = function(type, message)
{
    const path = require("path");
    const colors = require("colors");
    let intro = "[MISC]".cyan;
    if(Config.startup.log_bootup_actions)
    {
        if(type === "info")
        {
            intro = "[INFO]".blue;
        }
        else if(type === "success")
        {
            intro = "[OK]".green;
        }

        console.log(intro + " " + message);
    }
};

Logger.log = function(type, message)
{
    const colors = require("colors");
    let intro = "[MISC]".cyan;
    if(type === "info")
    {
        intro = "[INFO]".blue;
    }
    else if(type === "success")
    {
        intro = "[OK]".green;
    }
    else if(type === "error")
    {
        intro = "[OK]".red;
    }

    console.log(intro + " " + message);
};



module.exports.Logger = Logger;