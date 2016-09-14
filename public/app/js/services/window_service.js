'use strict';

angular.module('dendroApp.services')
    .service('windowService',
        ['$http',
        function ($http) {

        this.show_popup = function(type, title, message)
        {
            if(type == "success")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'success',
                    opacity: 1.0,
                    delay: 2000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "error")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'error',
                    opacity: 1.0,
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
                    opacity: 1.0,
                    delay: 8000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
        };

        this.valid_date = function(date)
        {
            if(date instanceof Date)
            {
                return true;
            }
            else
            {
                return false;
            }
        };

        this.get_current_url = function()
        {
            var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            return newURL;
        };

        this.download_url = function(url, parametersString)
        {
            if(url != null && parametersString != null)
            {
                url = url + parametersString;
            }

            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            function guid() {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }

            var hiddenIFrameID = 'hiddenDownloader_' + guid();
            var iframe = document.getElementById(hiddenIFrameID);

            if (iframe === null) {
                iframe = document.createElement('iframe');
                iframe.id = hiddenIFrameID;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }

            iframe.src = url;
        };
    }]);
