var Utils = {};

Utils.get_current_url = function()
{
    var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
    return newURL;
}

Utils.getCurrentProject = function()
{
    var currentUrl = Utils.get_current_url();

    var leadingPart = currentUrl.match(new RegExp("http://[\/]*.*/project\/"));
    var ownerProject = currentUrl.replace(leadingPart, "");
    if(ownerProject != null && leadingPart != null)
    {
        ownerProject = ownerProject.replace(new RegExp("\/.*"), "");
        ownerProject = leadingPart + ownerProject;
    }

    return ownerProject;
};

Utils.getCurrentProjectHandle = function()
{
    var currentProjectUri = Utils.getCurrentProject();
    var leadingPart = currentProjectUri.match(new RegExp("http:\/\/.*\/project\/"));
    var projectHandle = currentProjectUri.replace(leadingPart, "");
    return projectHandle;
};

/**
 * Bootstrap parametrization!
 * @type {{dir1: string, dir2: string, push: string}}
 */
//this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
var stack_topright = {"dir1": "down", "dir2": "left", "push": "top"};
//$.pnotify.defaults.styling = "bootstrap3";
//$.pnotify.defaults.history = false;

/**
 * End of Bootstrap parametrization
 */

Utils.show_popup = function(type, title, message)
{
    if(type == "success")
    {
        new PNotify({
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

        new PNotify({
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
        new PNotify({
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

Utils.add_line_breaks = function(sentence, every_x_words)
{
    var words = sentence.split(" ");
    var brokenSentence = "";
    var separator;

    for(var i = 0; i < words.length; i++)
    {
        if((i+1) % every_x_words == 0)
        {
            separator = "<br/>"
        }
        else
        {
            separator = " "
        }

        brokenSentence = brokenSentence + words[i] + separator;
    }

    return brokenSentence;
};

Utils.isCyclic = function(obj) {
    var seenObjects = [];

    function detect (obj) {
        if (obj && typeof obj === 'object') {
            if (seenObjects.indexOf(obj) !== -1) {
                return true;
            }
            seenObjects.push(obj);
            for (var key in obj) {
                if (obj.hasOwnProperty(key) && detect(obj[key])) {
                    console.log(obj, 'cycle at ' + key);
                    return true;
                }
            }
        }
        return false;
    }

    return detect(obj);
}

Utils.extractEverythingAfterBaseUri = function(url)
{
    var URL = require("url");
    var parsed = URL.parse(url);

    return parsed.pathname;
}

Utils.replaceBaseUri = function(uri, newBaseUri)
{
    var URL = require("url");
    var relativeResource = Utils.extractEverythingAfterBaseUri(uri);
    return URL.resolve(newBaseUri, relativeResource);
}

Utils.copyFromObjectToObject = function(fromObject, toObject)
{
    for (var attrname in fromObject) { toObject[attrname] = fromObject[attrname]; }
};

Utils.fade_messages = function()
{
    var timeout = 7000;
    setTimeout(function(){
        $("#error_messages").fadeOut("slow");
    },timeout);

    setTimeout(function(){
        $("#success_messages").fadeOut("slow");
    },timeout);

    setTimeout(function(){
        $("#info_messages").fadeOut("slow");
    },timeout);
};

if(typeof exports != "undefined")
{
    exports.Utils = Utils;
}
