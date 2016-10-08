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
        uploadsService,
        windowService
    )
    {
        $scope.validate = {size: {max: '20MB', min: '10B'}, height: {max: 12000}, width: {max: 12000}, duration: {max: '5m'}};
        $scope.dragClass= {pattern: 'application/zip', accept:'upload-area-dropped-accept', reject:'upload-area-dropped-reject', delay:100};

        $scope.upload_for_importing = function(file) {
            $scope.file = file;
            $scope.uploading = true;

            uploadsService.upload (file, '/projects/import')
                .then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        $scope.uploading = false;
                    });
                }, function (response) {
                    if (response.status > 0)
                    {
                        $scope.errorMsg = response.status + ': ' + response.data;
                        windowService.show_popup("error", "Unable to upload.", "Error reported: " + $scope.errorMsg );
                    }
                    $scope.uploading = false;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    $scope.upload_progress = file.progress;
                })
                .catch(function(e){
                    windowService.show_popup("error", "Unable to upload. Error reported: " + JSON.stringify(e));
                    $scope.uploading = false;
                });
        }
    });