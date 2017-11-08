'use strict';

// this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
PNotify.prototype.options.styling = 'bootstrap3';
var stack_topright = {dir1: 'down', dir2: 'left', push: 'top'};

var startTrackingWithGoogleAnalytics = function (app)
{
    app.run(function (Analytics)
    {});
};

// Declare app level module which depends on filters, and services
var dendroApp = angular.module('dendroApp', [
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
    'imageSpinner',
    'ngImgCrop',
    'ngImageCompress',
    'ngSanitize',
    'ui.select',
    'angularSpinner'
]).filter('trustAsResourceUrl', ['$sce', function ($sce)
{
    return function (val)
    {
        return $sce.trustAsResourceUrl(val);
    };
}]).config(['ngAlertsProvider', function (ngAlertsProvider)
{
    // Global empty list text.
    ngAlertsProvider.options.emptyListText = 'Nothing here...';

    // The queue timeout for new alerts.
    ngAlertsProvider.options.queue = null;
}]).config(['AnalyticsProvider', function (AnalyticsProvider)
{
    // Add configuration code as desired

    let initInjector = angular.injector(['ng']);
    let $http = initInjector.get('$http');

    $http({
        method: 'GET',
        url: '/analytics_tracking_code',
        contentType: 'application/json',
        headers: {Accept: 'application/json'}
    }).then(
        function (response)
        {
            AnalyticsProvider.setAccount(response.data); // UU-XXXXXXX-X should be your tracking code
            startTrackingWithGoogleAnalytics(dendroApp);
        }
    );
}]).run(function ($http, $rootScope)
{
    $http.get('/shared/public_config.json')
        .then(function (response)
        {
            $rootScope.config = response.data;
        })
        .catch(function (error)
        {
            // log error
            console.log('Unable to load remote config');
        });
});
