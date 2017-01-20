'use strict';

angular.module('dendroApp.services')
    .service('uploadsService',
        [
            'usersService',
            'Upload',
            '$http',
            '$q',
            function (usersService, Upload, $http, $q)
            {

                // upload on file select or drop
                this.upload = function (file, url, extra_parameters)
                {

                    if (!(extra_parameters instanceof Object))
                    {
                        var data = {file: file};
                    }
                    else
                    {
                        var data = extra_parameters;
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
                this.uploadFiles = function (files, url, extra_parameters, callback)
                {

                    if (files && files.length)
                    {
                        for (var i = 0; i < files.length; i++)
                        {
                            var file = files[i];

                            var data = extra_parameters;
                            data.file = file;

                            callback(
                                Upload.upload({url: url, data: data})
                            );
                        }
                    }
                }

                this.getUploadTicket = function (fileName, upload_url)
                {
                    var ticketPromise = $q.defer();

                    usersService.get_logged_user()
                        .then(function (response)
                        {
                            try{
                                var uploadUri = URI(upload_url)
                                    .addQuery("filename", encodeURIComponent(fileName))
                                    .addQuery("username", response.data.ddr.username);

                                $http({
                                    method: 'GET',
                                    url: uploadUri,
                                    contentType: "application/json",
                                    headers: {'Accept': "application/json"}
                                }).then(
                                    function (response)
                                    {
                                        if (response.upload_id != null)
                                        {
                                            ticketPromise.resolve(response.data.upload_id);
                                        }
                                        else
                                        {
                                            ticketPromise.reject("Invalid response format received from server");
                                        }
                                    }
                                ).catch(function (error)
                                {
                                    ticketPromise.reject(error);
                                });
                            }
                            catch(e)
                            {
                                ticketPromise.reject("Invalid response format received from server");
                            }
                        })
                        .catch(function (error)
                        {
                            ticketPromise.reject(error);
                        });

                    return ticketPromise.promise;
                }
            }
        ]
    );