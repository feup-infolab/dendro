angular.module("dendroApp.controllers")
/*
     *  File Browser controller
     */
    .controller("uploadsCtrl",
        [
            "$scope",
            "$http",
            "$filter",
            "$q",
            "$log",
            "$timeout",
            "$compile",
            "Upload",
            "usersService",
            "windowService",
            "uploadsService",
            function (
                $scope,
                $http,
                $filter,
                $q,
                $log,
                $timeout,
                $compile,
                Upload,
                usersService,
                windowService,
                uploadsService
            )
            {
                $scope.usingFlash = FileAPI && FileAPI.upload != null;

                $scope.invalidFiles = [];

                $scope.isResumeSupported = false; // Upload.isResumeSupported(); //TODO Enable this
                $scope.chunkSize = "1MB";

                const cleanUploadFilesListByPropertyAndValue = function (property, value, timeout)
                {
                    if (!timeout)
                    {
                        timeout = 3000;
                    }
                    $timeout(function ()
                    {
                        $scope[$scope.files_array_name] = _.reject($scope[$scope.files_array_name], function (d)
                        {
                            return d[property] === value;
                        });
                    }, timeout);
                };

                $scope.uploadFiles = function (files)
                {
                    if (files && files instanceof Array && files.length > 0)
                    {
                        var self = this;
                        self.files = files;

                        $scope.formUpload = false;
                        if (self.files != null)
                        {
                            // make files array for not multiple to be able to be used in ng-repeat in the ui
                            if (!angular.isArray(self.files))
                            {
                                $timeout(function ()
                                {
                                    $scope[$scope.files_array_name] = self.files = [self.files];
                                });
                                return;
                            }

                            $scope.errorMsg = null;

                            async.mapSeries(
                                self.files,
                                function (file, callback)
                                {
                                    if (!file.uploading && !file.has_error)
                                    {
                                        file.calculating_md5 = true;
                                        file.md5_progress = 0;
                                        uploadsService.calculate_md5(file, function (err, md5)
                                        {
                                            if (!err)
                                            {
                                                file.calculating_md5 = false;
                                                file.md5 = md5;
                                                $scope.upload(file, true)
                                                    .then(function (result)
                                                    {
                                                        file.uploading = false;
                                                        file.result = result;
                                                        const successMessage = "File uploaded successfully.";
                                                        file.has_success = successMessage;

                                                        if ($scope.move_to_success_timeout != null && $scope.move_to_success_timeout > 0)
                                                        {
                                                            cleanUploadFilesListByPropertyAndValue("has_success", successMessage, $scope.move_to_success_timeout);
                                                        }

                                                        callback(null, result);
                                                    })
                                                    .catch(function (response)
                                                    {
                                                        file.uploading = false;
                                                        file.has_error = response.error;
                                                        if (response.error.message)
                                                        {
                                                            windowService.show_popup("error", "Upload error", response.error.message, 10000);
                                                            cleanUploadFilesListByPropertyAndValue("has_error", file.has_error, 3000);
                                                        }
                                                        else
                                                        {
                                                            callback(response);
                                                        }
                                                    });
                                            }
                                            else
                                            {
                                                windowService.show_popup("info", "Unable to calculate checksum of file " + file.name);
                                            }
                                        }, function (progress)
                                        {
                                            file.md5_progress = Math.round(progress * 100);
                                            $scope.$apply();
                                        });
                                    }
                                },
                                function (err, results)
                                {
                                    if (!err)
                                    {
                                        $scope.uploads_callback(null, results, $scope.still_uploading_files());
                                    }
                                    else
                                    {
                                        $scope.uploads_callback(1, err);
                                    }
                                }
                            );
                        }
                    }
                };

                $scope.activate_watches = function ()
                {
                    // make invalidFiles array for not multiple to be able to be used in ng-repeat in the ui
                    $scope.$watch($scope.invalid_files_array_name, function (invalidFiles)
                    {
                        if (invalidFiles != null && !angular.isArray(invalidFiles))
                        {
                            $timeout(function ()
                            {
                                $scope[invalid_files_array_name] = [invalidFiles];
                            });
                        }
                    });

                    $scope.$watch($scope.files_array_name, function (files)
                    {
                        $scope.uploadFiles(files);
                    });

                    $scope.$on("new_files_to_upload", function (event, files, extra_query_parameters)
                    {
                        $scope.uploadFiles(files);
                    });
                };

                $scope.upload = function (file, resumable)
                {
                    var doUpload = $q.defer();
                    file.uploading = true;

                    function startUpload ()
                    {
                        $scope.errorMsg = null;
                        if ($scope.howToSend === 1)
                        {
                            uploadsService.uploadUsingUpload(file, $scope.get_upload_url(), resumable, $scope.chunkSize)
                                .then(function (data)
                                {
                                    file.result = data;
                                    file.uploading = false;
                                    doUpload.resolve({
                                        file: file,
                                        data: data
                                    });
                                })
                                .catch(function (error)
                                {
                                    file.error = error;
                                    file.uploading = false;
                                    doUpload.reject({
                                        file: file,
                                        error: error
                                    });
                                });
                        }
                        else if ($scope.howToSend === 2)
                        {
                            uploadsService.uploadUsing$http(file, $scope.get_upload_url())
                                .then(function (data)
                                {
                                    file.result = data;
                                    file.uploading = false;
                                    doUpload.resolve(file);
                                })
                                .catch(function (error)
                                {
                                    file.error = error;
                                    file.uploading = false;
                                    doUpload.reject(file);
                                });
                        }
                    }

                    uploadsService.getUploadTicket(file, $scope.get_upload_url())
                        .then(function (upload_id)
                        {
                            file.upload_id = upload_id;
                            if (file.username === null || typeof file.username === "undefined")
                            {
                                usersService.get_logged_user()
                                    .then(function (user)
                                    {
                                        file.username = user.ddr.username;
                                        startUpload();
                                    })
                                    .catch(function (error)
                                    {
                                        file.uploading = false;
                                        doUpload.reject(error);
                                    });
                            }
                            else
                            {
                                startUpload();
                            }
                        })
                        .catch(function (error)
                        {
                            if (error.data.message)
                            {
                                windowService.show_popup("error", "Upload error", error.data.message, 10000);
                            }
                            file.uploading = false;
                            file.error = true;
                            cleanUploadFilesListByPropertyAndValue("error", true, 3000);
                            // windowService.show_popup("error", "Error", "There was an error processing your upload. Are you authenticated in the system?");
                            // console.error(error);
                        });

                    return doUpload.promise;
                };

                $scope.still_uploading_files = function ()
                {
                    var files = $scope[$scope.files_array_name];

                    if (files && files instanceof Array)
                    {
                        for (var i = 0; i < files.length; i++)
                        {
                            var file = files[i];
                            if (file.uploading)
                            {
                                return true;
                            }
                        }
                    }
                    else
                    {
                        return false;
                    }
                };

                $scope.restart = function (file)
                {
                    if (Upload.isResumeSupported())
                    {
                        var resumeUrl = URI($scope.get_restart_url())
                            .addSearch("upload_id", file.upload_id)
                            .addSearch("username", file.username)
                            .addSearch("filename", file.name).toString()
                            .addSearch("size", file.length).toString();

                        $http.get(resumeUrl).then(function ()
                        {
                            $scope.upload(file, true);
                        });
                    }
                    else
                    {
                        $scope.upload(file);
                    }
                };

                $scope.confirm = function ()
                {
                    return confirm("Are you sure? Your local changes will be lost.");
                };

                angular.element(window).bind("dragover", function (e)
                {
                    e.preventDefault();
                });
                angular.element(window).bind("drop", function (e)
                {
                    e.preventDefault();
                });

                $scope.modelOptionsObj = {};
                $scope.$watch("validate+dragOverClass+modelOptions+resize+resizeIf", function (v)
                {
                    $scope.validateObj = eval("(function(){return " + $scope.validate + ";})()");
                    $scope.dragOverClassObj = eval("(function(){return " + $scope.dragOverClass + ";})()");
                    $scope.modelOptionsObj = eval("(function(){return " + $scope.modelOptions + ";})()");
                    $scope.resizeObj = eval("(function($file){return " + $scope.resize + ";})()");
                    $scope.resizeIfFn = eval("(function(){var fn = function($file, $width, $height){return " + $scope.resizeIf + ";};return fn;})()");
                });

                $timeout(function ()
                {
                    $scope.howToSend = localStorage.getItem("howToSend") || 1; // 1- multipart/form-data upload cross browser  . 2 - Upload.http(): binary content with file's Content-Type Can be used to upload files directory into CouchDB, imgur, etc... without multipart form data (HTML5 FileReader browsers only)
                    $scope.capture = localStorage.getItem("capture") || "camera";
                    $scope.pattern = localStorage.getItem("pattern") || "*"; // 'image/*,audio/*,video/*';
                    $scope.acceptSelect = localStorage.getItem("acceptSelect") || "*"; // 'image/*,audio/*,video/*';
                    $scope.modelOptions = localStorage.getItem("modelOptions") || "{debounce:100}";
                    $scope.dragOverClass = localStorage.getItem("dragOverClass") || "{accept:'dragover', reject:'dragover-err'}"; // '{accept:\'dragover\', reject:\'dragover-err\', pattern:\'image/*,audio/*,video/*,text/*\'}';
                    $scope.disabled = localStorage.getItem("disabled") === "true" || false;
                    $scope.multiple = localStorage.getItem("multiple") === "true" || true;
                    $scope.allowDir = localStorage.getItem("allowDir") === "true" || false;
                    // $scope.validate = localStorage.getItem('validate') || '{size: {max: \'2000MB\', min: \'10B\'}, height: {max: 12000}, width: {max: 12000}, duration: {max: \'50000m\'}}';
                    $scope.keep = localStorage.getItem("keep") === "true" || false;
                    $scope.keepDistinct = localStorage.getItem("keepDistinct") === "true" || true;
                    $scope.orientation = localStorage.getItem("orientation") === "true" || false;
                    $scope.runAllValidations = localStorage.getItem("runAllValidations") === "true" || true;
                    // $scope.resize = localStorage.getItem('resize') || "{width: 1000, height: 1000, centerCrop: true}";
                    // $scope.resizeIf = localStorage.getItem('resizeIf') || "$width > 5000 || $height > 5000";
                    // $scope.dimensions = localStorage.getItem('dimensions') || "$width < 12000 || $height < 12000";
                    // $scope.duration = localStorage.getItem('duration') || "$duration < 10000";
                    $scope.maxFiles = localStorage.getItem("maxFiles") || "500";
                    $scope.ignoreInvalid = localStorage.getItem("ignoreInvalid") || "";
                    $scope.$watch("validate+capture+pattern+acceptSelect+disabled+capture+multiple+allowDir+keep+orientation+" +
                "keepDistinct+modelOptions+dragOverClass+resize+resizeIf+maxFiles+duration+dimensions+ignoreInvalid+runAllValidations", function ()
                    {
                        localStorage.setItem("capture", $scope.capture);
                        localStorage.setItem("pattern", $scope.pattern);
                        localStorage.setItem("acceptSelect", $scope.acceptSelect);
                        localStorage.setItem("disabled", $scope.disabled);
                        localStorage.setItem("multiple", $scope.multiple);
                        localStorage.setItem("allowDir", $scope.allowDir);
                        localStorage.setItem("validate", $scope.validate);
                        localStorage.setItem("keep", $scope.keep);
                        localStorage.setItem("orientation", $scope.orientation);
                        localStorage.setItem("keepDistinct", $scope.keepDistinct);
                        localStorage.setItem("dragOverClass", $scope.dragOverClass);
                        localStorage.setItem("modelOptions", $scope.modelOptions);
                        // localStorage.setItem('resize', $scope.resize);
                        // localStorage.setItem('resizeIf', $scope.resizeIf);
                        // localStorage.setItem('dimensions', $scope.dimensions);
                        // localStorage.setItem('duration', $scope.duration);
                        localStorage.setItem("maxFiles", $scope.maxFiles);
                        localStorage.setItem("ignoreInvalid", $scope.ignoreInvalid);
                        localStorage.setItem("runAllValidations", $scope.runAllValidations);
                    });
                });

                $scope.init = function (
                    upload_url_function,
                    files_array_name,
                    invalid_files_array_name,
                    upload_files_successful_array_name,
                    uploads_callback,
                    move_to_success_timeout)
                {
                    if (typeof upload_url_function === "function")
                    {
                        $scope.get_uploads_url_function = upload_url_function;
                    }
                    else if (typeof upload_url_function === "string")
                    {
                        $scope.get_uploads_url_function = function ()
                        {
                            return upload_url_function;
                        };
                    }

                    $scope.uploads_callback = uploads_callback;

                    $scope.files_array_name = files_array_name;
                    $scope.invalid_files_array_name = invalid_files_array_name;
                    $scope.upload_files_successful_array_name = upload_files_successful_array_name;
                    $scope.move_to_success_timeout = move_to_success_timeout;

                    $scope.get_upload_url = function ()
                    {
                        return URI($scope.get_uploads_url_function()).addSearch("upload").toString();
                    };
                    $scope.get_resume_url = function ()
                    {
                        return URI($scope.get_uploads_url_function()).addSearch("resume").toString();
                    };
                    $scope.get_restart_url = function ()
                    {
                        return URI($scope.get_uploads_url_function()).addSearch("restart").toString();
                    };

                    $scope.activate_watches();
                };
            }
        ]);
