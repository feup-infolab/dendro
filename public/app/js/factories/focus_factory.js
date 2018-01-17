"use strict";

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module("dendroApp.factories")
    .factory("focus", function ($rootScope, $timeout)
    {
        return function (name)
        {
            // alert('focusing ' + name);
            setTimeout(function ()
            {
                // alert('emitting event ' + name);
                $rootScope.$broadcast("focusOn", name);
            }, 200);
        };
    });
