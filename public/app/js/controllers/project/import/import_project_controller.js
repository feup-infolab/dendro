angular.module('dendroApp.controllers')
    /**
     *  Descriptors List controller
     */
    .controller('importProjectCtrl', function (
        $scope,
        $http,
        $filter,
        $q,
        $log,
        $localStorage,
        $timeout,
        Upload
    )
    {
        $scope.validate = {size: {max: '20MB', min: '10B'}, height: {max: 12000}, width: {max: 12000}, duration: {max: '5m'}};
        $scope.dragClass= {pattern: 'application/zip', accept:'upload-area-dropped-accept', reject:'upload-area-dropped-reject', delay:100};

        $scope.uploadFiles = function(files, errFiles) {
            $scope.files = files;
            $scope.errFiles = errFiles;
            angular.forEach(files, function(file) {
                file.upload = Upload.upload({
                    url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
                    data: {file: file}
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                }, function (response) {
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                });
            });
        }
    });