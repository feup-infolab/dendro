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
                            try
                            {
                                var uploadUri = URI(upload_url)
                                    .addQuery("filename", encodeURIComponent(fileName))
                                    .addQuery("username", response.ddr.username);

                                $http({
                                    method: 'GET',
                                    url: uploadUri.toString(),
                                    contentType: "application/json",
                                    headers: {'Accept': "application/json"}
                                }).then(
                                    function (response)
                                    {
                                        if (response.data != null && response.data.upload_id != null)
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
                            catch (e)
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

                this.calculate_md5 = function (file, callback)
                {
                    browserMD5File(file, function (err, md5)
                    {
                        callback(err, md5); // 97027eb624f85892c69c4bcec8ab0f11
                    });
                }
            }
        ]
    );