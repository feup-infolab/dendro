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
    });
