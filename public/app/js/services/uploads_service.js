"use strict";

angular.module("dendroApp.services")
    .service("uploadsService",
        [
            "usersService",
            "Upload",
            "$http",
            "$timeout",
            "$q",
            function (usersService, Upload, $http, $timeout, $q)
            {
                this.uploadUsing$http = function (file, upload_url)
                {
                    file.upload = Upload.http({
                        url: upload_url,
                        method: "POST",
                        headers: {
                            "Content-Type": file.type
                        },
                        data: file
                    });

                    var deferred = $q.defer();
                    file.upload
                        .then(function (response)
                        {
                            file.result = response.data;
                        })
                        .catch(function (error)
                        {
                            deferred.reject(error);
                        });

                    file.upload.progress(function (evt)
                    {
                        console.log(evt.loaded);
                        file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    });

                    return deferred.promise;
                };

                this.uploadUsingUpload = function (file, upload_url, resumable, chunkSize)
                {
                    var url = URI(upload_url);
                    var keys = Object.keys(JSON.parse(JSON.stringify(file)));

                    for (var i = 0; i < keys.length; i++)
                    {
                        var key = keys[i];
                        if (file.hasOwnProperty(key) && ((typeof file[key] === "string") || typeof file[key] === "boolean"))
                        {
                            url.addSearch(key, file[key]);
                        }
                    }

                    url.addSearch("size", file.size)
                        .addSearch("filename", file.name)
                        .addSearch("md5_checksum", file.md5);

                    url = url.toString();

                    var resumeUrl = URI(url)
                        .addSearch("resume", "true").toString();

                    file.upload = Upload.upload({
                        url: url,
                        resumeSizeUrl: resumable ? resumeUrl : null,
                        resumeChunkSize: resumable ? chunkSize : null,
                        headers: {
                            "optional-header": "header-value"
                        },
                        data: {
                            file: file
                        }
                    });

                    var deferred = $q.defer();

                    file.upload
                        .then(function (response)
                        {
                            $timeout(function ()
                            {
                                deferred.resolve(response.data);
                            });
                        })
                        .catch(function (error)
                        {
                            deferred.reject(error.data);
                        });

                    file.upload.progress(function (evt)
                    {
                        file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                        if (file.progress >= 100)
                        {
                            file.sent_to_server = true;
                        }
                        // console.log(file.upload_id + " : " + file.progress);
                    });

                    file.upload.xhr(function (xhr)
                    {
                        // xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
                    });

                    return deferred.promise;
                };

                // upload on file select or drop
                this.upload = function (file, url, extra_parameters)
                {
                    var data;

                    if (!(extra_parameters instanceof Object))
                    {
                        data = {file: file};
                    }
                    else
                    {
                        data = extra_parameters;
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
                            var data;

                            if (!(extra_parameters instanceof Object))
                            {
                                data = {file: file};
                            }
                            else
                            {
                                data = extra_parameters;
                                data.file = file;
                            }

                            callback(
                                Upload.upload({url: url, data: data})
                            );
                        }
                    }
                };

                this.getUploadTicket = function (file, upload_url)
                {
                    var ticketPromise = $q.defer();

                    usersService.get_logged_user()
                        .then(function (response)
                        {
                            try
                            {
                                var uploadUri = URI(upload_url)
                                    .addQuery("filename", file.name)
                                    .addQuery("size", file.size)
                                    .addQuery("md5_checksum", file.md5)
                                    .addQuery("username", response.ddr.username);

                                $http({
                                    method: "GET",
                                    url: uploadUri.toString(),
                                    contentType: "application/json",
                                    headers: {Accept: "application/json"}
                                }).then(
                                    function (response)
                                    {
                                        if (response.data != null && response.data.upload_id != null)
                                        {
                                            ticketPromise.resolve(response.data.upload_id, file);
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
                };

                this.calculate_md5 = function (file, callback)
                {
                    return new BrowserMD5File(file, function (err, md5)
                    {
                        callback(err, md5);
                    });
                };
            }
        ]
    );
