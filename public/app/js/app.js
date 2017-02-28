'use strict';

//this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
PNotify.prototype.options.styling = "bootstrap3";
var stack_topright = {"dir1": "down", "dir2": "left", "push": "top"};

var bootstrapAngular = function( analytics_tracking_code ) {
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
        'dendroApp.factories'
    ]).filter('trustAsResourceUrl', ['$sce', function($sce) {
        return function(val) {
            return $sce.trustAsResourceUrl(val);
        };
    }]).config(['ngAlertsProvider', function (ngAlertsProvider) {
        // Global empty list text.
        ngAlertsProvider.options.emptyListText = 'Nothing here...';

        // The queue timeout for new alerts.
        ngAlertsProvider.options.queue = null;
    }]).config(['AnalyticsProvider', function (AnalyticsProvider) {
        // Add configuration code as desired
        AnalyticsProvider.setAccount(analytics_tracking_code);  //UU-XXXXXXX-X should be your tracking code
    }]).run(['Analytics', function(Analytics) { }]);
};

$.ajax({url : "/analytics_tracking_code",
    headers: {"Accept": "application/json"},
    success : bootstrapAngular
});

