'use strict';

/* Directives */

angular.module('dendroApp.directives', [])
    .directive('focusOn', function() {
        return function(scope, elem, attr) {
            scope.$on('focusOn', function(e, name) {
                //alert("dentro do foco 1" + elem + " name :" + name + " e : " + e);
                if(name === attr.focusOn) {
                    elem[0].focus();
                }
            });
        };
    })
    .directive('datepicker', function() {
        return {
            restrict: 'A',
            require : 'ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {

                element.datetimepicker({
                    dateFormat:'dd/MM/yyyy hh:mm:ss',
                });

                /*.on('changeDate', function(e) {
                    ngModelCtrl.$setViewValue(e.date);
                    scope.$apply();
                });*/
            }
        };
    })
    .directive('ngEnter', function () {
        return function (scope, element, attrs) {
            scope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    return;
                } else {
                    this.$apply(fn);
                    element[0].blur();
                }
            };

            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    if (!event.shiftKey){
                        scope.safeApply(function (){
                            scope.$eval(attrs.ngEnter);
                        });
                        event.preventDefault();
                    }
                }
            });
        };
    })
    .directive('focusMe', function($timeout, $parse) {
        return {
            scope: true,   // optionally create a child scope
            link: function(scope, element, attrs) {
                var model = $parse(attrs.focusMe);

                scope.$watch(model, function(value) {
                    if(value === true) {
                        $timeout(function() {
                            element[0].focus();
                        });
                    }
                    else{
                        $timeout(function() {
                            element[0].blur();
                        });
                    }
                });

            }
        };
    })
    .directive('a', function() {
        return {
            restrict: 'E',
            link: function(scope, elem, attrs) {
                if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
                    elem.on('click', function(e){
                        e.preventDefault();
                    });
                }
            }
        };
    });

