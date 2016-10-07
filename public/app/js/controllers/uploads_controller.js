//inject directives and services.
var app = angular.module('dendroApp', ['ngFileUpload']);

app.controller('uploadController', ['$scope', 'Upload', function ($scope, Upload) {
    // upload later on form submit or something similar
    $scope.submit = function() {
        if ($scope.form.file.$valid && $scope.file) {
            $scope.upload($scope.file);
        }
    };

    // upload on file select or drop
    $scope.upload = function (file, url, extra_parameters) {
        var data = extra_parameters;
        data.file = file;

        return Upload.upload({
            url: url,
            data: data
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            progress.percentage = progressPercentage;
        });
    };

    // for multiple files:
    $scope.uploadFiles = function (files, url, extra_parameters, callback) {
        var data = extra_parameters;
        data.file = file;

        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                callback(
                    Upload.upload({url: url, data: data})
                );
            }
        }
    }
}]);