var Utils = {};

Utils.get_current_url = function()
{
    var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
    return newURL;
};

/**
 * Bootstrap parametrization!
 * @type {{dir1: string, dir2: string, push: string}}
 */
//this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
var stack_topright = {"dir1": "down", "dir2": "left", "push": "top"};
$.pnotify.defaults.styling = "bootstrap3";
$.pnotify.defaults.history = false;

/**
 * End of Bootstrap parametrization
 */

Utils.show_popup = function(type, title, message)
{
    if(type == "success")
    {
        $.pnotify({
            title: title,
            text: message,
            type: 'success',
            opacity: .9,
            delay: 2000,
            addclass: "stack-bar-top",
            cornerclass: "",
            stack: stack_topright
        });
    }
    else if(type == "error")
    {
        if(title == null)
        {
            title = "Unknown Error";
        }
        if(message == null)
        {
            message = "Unknown error occurred!";
        }

        $.pnotify({
            title: title,
            text: message,
            type: 'error',
            opacity: .9,
            delay: 5000,
            addclass: "stack-bar-top",
            cornerclass: "",
            stack: stack_topright
        });
    }
    else if(type == "info")
    {
        $.pnotify({
            title: title,
            text: message,
            type: 'info',
            opacity: .9,
            delay: 8000,
            addclass: "stack-bar-top",
            cornerclass: "",
            stack: stack_topright
        });
    }
};

Utils.statusCodeDefaults = {
    404: function (e, data) {
        show_popup("info", "Notice", e.responseJSON.message);
    },
    500 : function(e, data)
    {
        show_popup("error", "error", e.responseJSON.message);
    },
    401: function (e, data) {
        show_popup("error", "Unauthorized", e.responseJSON.message);
    },
    400: function (e, data) {
        show_popup("error", "Invalid Request", e.responseJSON.message);
    }
};

Utils.setSpinner = function(spinnerName, value) {
    if (Utils.spinners == null) {
        Utils.spinners = {};
    }

    Utils.spinners[spinnerName] = value;
};

Utils.spinnerActive = function(spinnerName) {
    return $scope.spinners[spinnerName];
};

Utils.valid_url = function(url)
{
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(url);
};



