angular.module('dendroApp.controllers')
    /*
     *  File Browser controller
     */
    .controller('uploadsCtrl', function ($scope,
                                             $http,
                                             $filter,
                                             $q,
                                             $log,
                                             $timeout,
                                             $compile,
                                             Upload,
                                             focus,
                                             preview,
                                             $localStorage,
                                             metadataService,
                                             windowService,
                                             cacheService,
                                             filesService,
                                             interactionsService,
                                             ontologiesService,
                                             storageService,
                                             recommendationService)
    {
        $scope.usingFlash = FileAPI && FileAPI.upload != null;
        //Upload.setDefaults({ngfKeep: true, ngfPattern:'image/*'});
        $scope.changeAngularVersion = function ()
        {
            window.location.hash = $scope.angularVersion;
            window.location.reload(true);
        };
        $scope.angularVersion = window.location.hash.length > 1 ? (window.location.hash.indexOf('/') === 1 ?
            window.location.hash.substring(2) : window.location.hash.substring(1)) : '1.2.24';

        $scope.invalidFiles = [];

        // make invalidFiles array for not multiple to be able to be used in ng-repeat in the ui
        $scope.$watch('invalidFiles', function (invalidFiles)
        {
            if (invalidFiles != null && !angular.isArray(invalidFiles))
            {
                $timeout(function ()
                {
                    $scope.invalidFiles = [invalidFiles];
                });
            }
        });

        $scope.$watch('files', function (files)
        {
            $scope.formUpload = false;
            if (files != null)
            {
                // make files array for not multiple to be able to be used in ng-repeat in the ui
                if (!angular.isArray(files))
                {
                    $timeout(function ()
                    {
                        $scope.files = files = [files];
                    });
                    return;
                }
                for (var i = 0; i < files.length; i++)
                {
                    $scope.errorMsg = null;
                    (function (f)
                    {
                        $scope.upload(f, true);
                    })(files[i]);
                }
            }
        });

        $scope.uploadPic = function (file)
        {
            $scope.formUpload = true;
            if (file != null)
            {
                $scope.upload(file);
            }
        };

        $scope.upload = function (file, resumable)
        {
            $scope.errorMsg = null;
            if ($scope.howToSend === 1)
            {
                uploadUsingUpload(file, resumable);
            } else if ($scope.howToSend == 2)
            {
                uploadUsing$http(file);
            }
        };

        $scope.isResumeSupported = Upload.isResumeSupported();

        $scope.restart = function (file)
        {
            if (Upload.isResumeSupported())
            {
                $http.get('https://angular-file-upload-cors-srv.appspot.com/upload?restart=true&name=' + encodeURIComponent(file.name)).then(function ()
                {
                    $scope.upload(file, true);
                });
            } else
            {
                $scope.upload(file);
            }
        };

        $scope.chunkSize = 100000;
        function uploadUsingUpload(file, resumable)
        {
            if(file.uuid == null)
            {
                file.uuid = UUIDjs.create(4);
            }

            file.upload = Upload.upload({
                url: $scope.upload_url + $scope.getReqParams(),
                resumeSizeUrl: resumable ? $scope.upload_url : null,
                resumeChunkSize: resumable ? $scope.chunkSize : null,
                headers: {
                    'optional-header': 'header-value'
                },
                data: {
                    file: file
                }
            });

            file.upload.then(function (response)
            {
                $timeout(function ()
                {
                    file.result = response.data;
                });
            }, function (response)
            {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt)
            {
                // Math.min is to fix IE which reports 200% sometimes
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });

            file.upload.xhr(function (xhr)
            {
                // xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
            });
        }

        function uploadUsing$http(file)
        {
            file.upload = Upload.http({
                url: $scope.upload_url + $scope.getReqParams(),
                method: 'POST',
                headers: {
                    'Content-Type': file.type
                },
                data: file
            });

            file.upload.then(function (response)
            {
                file.result = response.data;
            }, function (response)
            {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            });

            file.upload.progress(function (evt)
            {
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        }

        $scope.success_action_redirect = $scope.success_action_redirect || window.location.protocol + '//' + window.location.host;
        $scope.jsonPolicy = $scope.jsonPolicy || '{\n  "expiration": "2020-01-01T00:00:00Z",\n  "conditions": [\n    {"bucket": "angular-file-upload"},\n    ["starts-with", "$key", ""],\n    {"acl": "private"},\n    ["starts-with", "$Content-Type", ""],\n    ["starts-with", "$filename", ""],\n    ["content-length-range", 0, 524288000]\n  ]\n}';
        $scope.acl = $scope.acl || 'private';

        $scope.confirm = function () {
            return confirm('Are you sure? Your local changes will be lost.');
        };

        $scope.getReqParams = function () {
            return $scope.generateErrorOnServer ? '?errorCode=' + $scope.serverErrorCode +
            '&errorMessage=' + $scope.serverErrorMsg : '';
        };

        $scope.modelOptionsObj = {};
        $scope.$watch('validate+dragOverClass+modelOptions+resize+resizeIf', function (v)
        {
            $scope.validateObj = eval('(function(){return ' + $scope.validate + ';})()');
            $scope.dragOverClassObj = eval('(function(){return ' + $scope.dragOverClass + ';})()');
            $scope.modelOptionsObj = eval('(function(){return ' + $scope.modelOptions + ';})()');
            $scope.resizeObj = eval('(function($file){return ' + $scope.resize + ';})()');
            $scope.resizeIfFn = eval('(function(){var fn = function($file, $width, $height){return ' + $scope.resizeIf + ';};return fn;})()');
        });

        $timeout(function ()
        {
            $scope.howToSend = localStorage.getItem('howToSend') || 1; //1- multipart/form-data upload cross browser  . 2 - Upload.http(): binary content with file's Content-Type Can be used to upload files directory into CouchDB, imgur, etc... without multipart form data (HTML5 FileReader browsers only)
            $scope.capture = localStorage.getItem('capture') || 'camera';
            $scope.pattern = localStorage.getItem('pattern') || '*'; //'image/*,audio/*,video/*';
            $scope.acceptSelect = localStorage.getItem('acceptSelect') || '*'; //'image/*,audio/*,video/*';
            $scope.modelOptions = localStorage.getItem('modelOptions') || '{debounce:100}';
            $scope.dragOverClass = localStorage.getItem('dragOverClass') || '{accept:\'dragover\', reject:\'dragover-err\'}'; //'{accept:\'dragover\', reject:\'dragover-err\', pattern:\'image/*,audio/*,video/*,text/*\'}';
            $scope.disabled = localStorage.getItem('disabled') == 'true' || false;
            $scope.multiple = localStorage.getItem('multiple') == 'true' || true;
            $scope.allowDir = localStorage.getItem('allowDir') == 'true' || false;
            $scope.validate = localStorage.getItem('validate') || '{size: {max: \'2000MB\', min: \'10B\'}}'; //'{size: {max: \'2000MB\', min: \'10B\'}, height: {max: 12000}, width: {max: 12000}, duration: {max: \'5m\'}}';
            $scope.keep = localStorage.getItem('keep') == 'true' || false;
            $scope.keepDistinct = localStorage.getItem('keepDistinct') == 'true' || true;
            $scope.orientation = localStorage.getItem('orientation') == 'true' || false;
            $scope.runAllValidations = localStorage.getItem('runAllValidations') == 'true' || true;
            //$scope.resize = localStorage.getItem('resize') || "{width: 1000, height: 1000, centerCrop: true}";
            //$scope.resizeIf = localStorage.getItem('resizeIf') || "$width > 5000 || $height > 5000";
            //$scope.dimensions = localStorage.getItem('dimensions') || "$width < 12000 || $height < 12000";
            //$scope.duration = localStorage.getItem('duration') || "$duration < 10000";
            $scope.maxFiles = localStorage.getItem('maxFiles') || "500";
            $scope.ignoreInvalid = localStorage.getItem('ignoreInvalid') || "";
            $scope.$watch('validate+capture+pattern+acceptSelect+disabled+capture+multiple+allowDir+keep+orientation+' +
                'keepDistinct+modelOptions+dragOverClass+resize+resizeIf+maxFiles+duration+dimensions+ignoreInvalid+runAllValidations', function ()
            {
                localStorage.setItem('capture', $scope.capture);
                localStorage.setItem('pattern', $scope.pattern);
                localStorage.setItem('acceptSelect', $scope.acceptSelect);
                localStorage.setItem('disabled', $scope.disabled);
                localStorage.setItem('multiple', $scope.multiple);
                localStorage.setItem('allowDir', $scope.allowDir);
                localStorage.setItem('validate', $scope.validate);
                localStorage.setItem('keep', $scope.keep);
                localStorage.setItem('orientation', $scope.orientation);
                localStorage.setItem('keepDistinct', $scope.keepDistinct);
                localStorage.setItem('dragOverClass', $scope.dragOverClass);
                localStorage.setItem('modelOptions', $scope.modelOptions);
                //localStorage.setItem('resize', $scope.resize);
                //localStorage.setItem('resizeIf', $scope.resizeIf);
                //localStorage.setItem('dimensions', $scope.dimensions);
                //localStorage.setItem('duration', $scope.duration);
                localStorage.setItem('maxFiles', $scope.maxFiles);
                localStorage.setItem('ignoreInvalid', $scope.ignoreInvalid);
                localStorage.setItem('runAllValidations', $scope.runAllValidations);
            });
        });

        $scope.init = function(uploadUrl)
        {
            $scope.upload_url = uploadUrl;
        }
    })