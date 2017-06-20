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


module.exports.logger = Logger;