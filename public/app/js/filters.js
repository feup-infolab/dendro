'use strict';

/* Filters */

angular.module('dendroApp.filters', []).
    filter('interpolate', ['version', function(version) {
        return function(text) {
          return String(text).replace(/\%VERSION\%/mg, version);
        }
    }])
    .filter('markdown', function ($sce) {
    var converter = new showdown.Converter();
        return function (value)
        {
            var html = converter.makeHtml(value || '');
            return $sce.trustAsHtml(html);
        }
    })
    .filter('propsFilter', function() {
        return function(items, props) {
            var out = [];

            if (angular.isArray(items)) {
                var keys = Object.keys(props);

                items.forEach(function(item) {
                    var itemMatches = false;

                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    });
