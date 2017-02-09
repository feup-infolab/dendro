angular.module('dendroApp.controllers')
    /*
     *  File Browser controller
     */
    .controller('uploadsCtrl',
        [
            '$scope',
            '$http',
            '$filter',
            '$q',
            '$log',
            '$timeout',
            '$compile',
            'Upload',
            'usersService',
            'windowService',
            'uploadsService',
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

        $scope.isResumeSupported = Upload.isResumeSupported();
        $scope.chunkSize = '10MB';

        // make invalidFiles array for not multiple to be able to be used in ng-repeat in the ui
        $scope.$watch('invalidFiles', function (invalidFiles) {
            if (invalidFiles != null && !angular.isArray(invalidFiles)) {
                $timeout(function () {$scope.invalidFiles = [invalidFiles];});
            }
        });

        $scope.$watch('files', function (files) {
            $scope.formUpload = false;
            if (files != null) {
                // make files array for not multiple to be able to be used in ng-repeat in the ui
                if (!angular.isArray(files)) {
                    $timeout(function () {
                        $scope.files = files = [files];
                    });
                    return;
                }
                for (var i = 0; i < files.length; i++) {
                    $scope.errorMsg = null;

                    function doUpload(file)
                    {
                        (function (f) {
                            $scope.upload(f.f, true);
                        })({f : file.f});
                    }

                    var file = {f :files[i]};
                    uploadsService.calculate_md5(file.f, function(err, md5){
                        if(!err)
                        {
                            file.f.md5 = md5;
                            doUpload(file);
                        }
                        else
                        {
                            windowService.show_popup('info', 'Unable to calculate checksum of file ' + file.name);
                        }
                    });
                }
            }
        });

        $scope.upload = function (file, resumable) {
            function startUpload()
            {
                $scope.errorMsg = null;
                if ($scope.howToSend === 1)
                {
                    uploadsService.uploadUsingUpload(file, $scope.upload_url, resumable, $scope.chunkSize)
                        .then(function(data){
                            file.result  = data;
                        })
                        .catch(function(error){
                            file.error = error;
                            windowService.show_popup("error", file.name, error.message);
                        });
                } else if ($scope.howToSend == 2)
                {
                    uploadsService.uploadUsing$http(file, $scope.upload_url);
                }
            }

            console.log("Getting new upload ticket for file " + file.name);
            uploadsService.getUploadTicket(file, $scope.upload_url)
                .then(function (upload_id)
                {
                    file.upload_id = upload_id;
                    if(file.username == null)
                    {
                        usersService.get_logged_user()
                            .then(function(user){
                                file.username = user.ddr.username;
                                startUpload();
                            })
                            .catch(function(error){
                                windowService.show_popup('error', "Error", "Unable to retrieve the currently logged in user.");
                                console.log(error);
                            });
                    }
                    else
                    {
                        startUpload();
                    }
                })
                .catch(function(error){
                    windowService.show_popup("error", "Error", "There was an error processing your upload. Are you authenticated in the system?");
                    console.error(error);
                });
        };


        $scope.restart = function (file) {
            if (Upload.isResumeSupported()) {
                var resumeUrl = URI($scope.upload_url)
                    .addSearch("restart", "true")
                    .addSearch("upload_id", file.upload_id)
                    .addSearch("username", file.username)
                    .addSearch("filename", file.name).toString();

                $http.get(resumeUrl).then(function () {
                    $scope.upload(file, true);
                });
            } else {
                $scope.upload(file);
            }
        };

        $scope.confirm = function () {
            return confirm('Are you sure? Your local changes will be lost.');
        };

        angular.element(window).bind('dragover', function (e) {
            e.preventDefault();
        });
        angular.element(window).bind('drop', function (e) {
            e.preventDefault();
        });

        $scope.modelOptionsObj = {};
        $scope.$watch('validate+dragOverClass+modelOptions+resize+resizeIf', function (v) {
            $scope.validateObj = eval('(function(){return ' + $scope.validate + ';})()');
            $scope.dragOverClassObj = eval('(function(){return ' + $scope.dragOverClass + ';})()');
            $scope.modelOptionsObj = eval('(function(){return ' + $scope.modelOptions + ';})()');
            $scope.resizeObj = eval('(function($file){return ' + $scope.resize + ';})()');
            $scope.resizeIfFn = eval('(function(){var fn = function($file, $width, $height){return ' + $scope.resizeIf + ';};return fn;})()');
        });

        $timeout(function () {
            $scope.howToSend = localStorage.getItem('howToSend') || 1; //1- multipart/form-data upload cross browser  . 2 - Upload.http(): binary content with file's Content-Type Can be used to upload files directory into CouchDB, imgur, etc... without multipart form data (HTML5 FileReader browsers only)
            $scope.capture = localStorage.getItem('capture') || 'camera';
            $scope.pattern = localStorage.getItem('pattern') || '*'; //'image/*,audio/*,video/*';
            $scope.acceptSelect = localStorage.getItem('acceptSelect') || '*'; //'image/*,audio/*,video/*';
            $scope.modelOptions = localStorage.getItem('modelOptions') || '{debounce:100}';
            $scope.dragOverClass = localStorage.getItem('dragOverClass') || '{accept:\'dragover\', reject:\'dragover-err\'}'; //'{accept:\'dragover\', reject:\'dragover-err\', pattern:\'image/*,audio/*,video/*,text/*\'}';
            $scope.disabled = localStorage.getItem('disabled') == 'true' || false;
            $scope.multiple = localStorage.getItem('multiple') == 'true' || true;
            $scope.allowDir = localStorage.getItem('allowDir') == 'true' || false;
            //$scope.validate = localStorage.getItem('validate') || '{size: {max: \'2000MB\', min: \'10B\'}, height: {max: 12000}, width: {max: 12000}, duration: {max: \'50000m\'}}';
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
            $scope.upload_url = URI(uploadUrl).addSearch("upload").toString();
            $scope.resume_url = URI(uploadUrl).addSearch("resume").toString();
            $scope.restart_url = URI(uploadUrl).addSearch("restart").toString();
        }
    }
]);