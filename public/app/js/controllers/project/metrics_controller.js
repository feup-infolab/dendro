angular.module('dendroApp.controllers', ['chart.js']);


$scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
$scope.data = [300, 500, 100];

app.controller("DoughnutCtrl", function ($scope) {
    $scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
    $scope.data = [300, 500, 100];
});
