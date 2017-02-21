'use strict';

//this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
PNotify.prototype.options.styling = "bootstrap3";
var stack_topright = {"dir1": "down", "dir2": "left", "push": "top"};

// Declare app level module which depends on filters, and services
angular.module('dendroApp', [
        'ngRoute',
        'ngAnimate',
        'ngTagsInput',
        'ngStorage',
        'ui.tree',
        'angular-loading-bar',
        'ui.bootstrap',
        'codemwnci.markdown-edit-preview',
        'angularMoment',
        'hljs',
        'ngFileUpload',
        'ngJSONPath',
        'TreeWidget',
        'angularUtils.directives.dirPagination',
        'ngAlerts',
        'angular-google-analytics',
        'dendroApp.controllers',
        'dendroApp.filters',
        'dendroApp.services',
        'dendroApp.directives',
        'dendroApp.factories',
]).filter('trustAsResourceUrl', ['$sce', function($sce) {
    return function(val) {
        return $sce.trustAsResourceUrl(val);
    };
}]).config(['ngAlertsProvider', function (ngAlertsProvider) {
        // Global empty list text.
        ngAlertsProvider.options.emptyListText = 'Nothing here...';

        // The queue timeout for new alerts.
        ngAlertsProvider.options.queue = null;
}]).config(['$http', '$localStorage', 'AnalyticsProvider', function ($http, $localStorage, AnalyticsProvider) {

        function setAnalyticsProviderProperties(token)
        {
            AnalyticsProvider.setAccount(token);  //UU-XXXXXXX-X should be your tracking code
            // Track all routes (default is true).
            AnalyticsProvider.trackPages(true);

            // Track all URL query params (default is false).
            AnalyticsProvider.trackUrlParams(true);

            // Ignore first page view (default is false).
            // Helpful when using hashes and whenever your bounce rate looks obscenely low.
            AnalyticsProvider.ignoreFirstPageLoad(false);
        }

        if($localStorage.get('ganalytics_tracking_code') != null)
        {
            var token = $localStorage.get('ganalytics_tracking_code');
            AnalyticsProvider.setAccount(token);
            setAnalyticsProviderProperties(token);
        }
        else
        {
            $http({
                method: 'GET',
                url: "/analytics_tracking_code",
                responseType: 'json'
            }).then(function(response){
                    if(response.data != null && response.data.length > 0)
                    {
                        var token = response.data;
                        $localStorage.set('ganalytics_tracking_code', token);
                        setAnalyticsProviderProperties(token);
                    }
                })
                .catch(function(err){
                    console.log("Unable to get google analytics tracking code");
                });
        }
}]).run(['Analytics', function(Analytics) { }]);
