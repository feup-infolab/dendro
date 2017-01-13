'use strict';

angular.module('dendroApp.services')
    .service('uploadsService',
        [   'Upload',
            '$http',
            function (Upload, $http) {

                // upload on file select or drop
                this.upload = function (file, url, extra_parameters) {

                    if(!(extra_parameters instanceof Object))
                    {
                        var data = { file : file };
                    }
                    else
                    {
                        var data  = extra_parameters;
                        data.file = file;
                    }

                    return Upload.upload({
                        url: url,
                        data: data
                    });
                };

                /*
                 .then(function (resp) {
                 console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                 }, function (resp) {
                 console.log('Error status: ' + resp.status);
                 }, function (evt) {
                 var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                 console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                 progress.percentage = progressPercentage;
                 });
                 */

                // for multiple files:
                this.uploadFiles = function (files, url, extra_parameters, callback) {

                    if (files && files.length) {
                        for (var i = 0; i < files.length; i++) {
                            var file = files[i];

                            var data = extra_parameters;
                            data.file = file;

                            callback(
                                Upload.upload( {url: url, data: data} )
                            );

                            /*
                                .then(function (resp) {
                                    console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                                }, function (resp) {
                                    console.log('Error status: ' + resp.status);
                                }, function (evt) {
                                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                    console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                                    file.progress.percentage = progressPercentage;
                                })
                            */
                        }
                    }
                }

            }
        ]
    );