"use strict";

angular.module("dendroApp.services")
    .service("windowService",
        ["$http", "Utils", "$window",
            function ($http, Utils, $window)
            {
                this.openInNewWindow = function (url)
                {
                    $window.open(url);
                };

                this.redirectToUri = function(url)
                {
                    $window.location.href = url;
                };

                this.init = function ()
                {
                    Utils.fade_messages();
                };

                this.show_popup = function (type, title, message, delay)
                {
                    if (!delay)
                    {
                        delay = 2000;
                    }

                    if (type === "success")
                    {
                        new PNotify({
                            title: title,
                            text: message,
                            type: "success",
                            opacity: 1.0,
                            delay: delay,
                            addclass: "stack-bar-top",
                            cornerclass: "",
                            stack: stack_topright
                        });
                    }
                    if (type === "warning")
                    {
                        new PNotify({
                            title: title,
                            text: message,
                            type: "warning",
                            opacity: 1.0,
                            delay: delay,
                            addclass: "stack-bar-top",
                            cornerclass: "",
                            stack: stack_topright
                        });
                    }
                    else if (type === "error")
                    {
                        new PNotify({
                            title: title,
                            text: message,
                            type: "error",
                            opacity: 1.0,
                            delay: 5000,
                            addclass: "stack-bar-top",
                            cornerclass: "",
                            stack: stack_topright
                        });
                    }
                    else if (type === "info")
                    {
                        new PNotify({
                            title: title,
                            text: message,
                            type: "info",
                            opacity: 1.0,
                            delay: delay,
                            addclass: "stack-bar-top",
                            cornerclass: "",
                            stack: stack_topright
                        });
                    }
                };

                this.valid_date = function (date)
                {
                    if (date instanceof Date)
                    {
                        return true;
                    }
                    return false;
                };

                this.get_current_url = function ()
                {
                    var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    return newURL;
                };
                this.get_protocol_and_host = function ()
                {
                    return window.location.protocol + "//" + window.location.host;
                };
                this.get_resource_from_URL = function ()
                {
                    return window.location.pathname;
                };

                this.download_url = function (url, parametersString)
                {
                    if (!Utils.isNull(url) && !Utils.isNull(parametersString))
                    {
                        url = url + parametersString;
                    }

                    function s4 ()
                    {
                        return Math.floor((1 + Math.random()) * 0x10000)
                            .toString(16)
                            .substring(1);
                    }

                    function guid ()
                    {
                        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
                    }

                    var hiddenIFrameID = "hiddenDownloader_" + guid();
                    var iframe = document.getElementById(hiddenIFrameID);

                    if (Utils.isNull(iframe))
                    {
                        iframe = document.createElement("iframe");
                        iframe.id = hiddenIFrameID;
                        iframe.style.display = "none";
                        document.body.appendChild(iframe);
                    }

                    iframe.src = url;
                };

                this.register_server_side_event_source = function (event_name, handler, url)
                {
                    if (!event_name)
                    {
                        throw "No event name provided.";
                    }

                    if (Utils.isNull(url))
                    {
                        url = "";
                    }

                    var source = new EventSource(url);
                    source.addEventListener(event_name, handler, false);
                };
            }]);
