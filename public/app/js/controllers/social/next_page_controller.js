angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('nextPageCtrl', function ($scope)
    {
        $scope.pageChangeHandler = function(num) {
            console.log('ESTOU AQUI');
            console.log('going to page ' + num);
        };
    });