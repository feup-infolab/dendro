angular.module('dendroApp.controllers')
/**
 *  Avatar controller
 */
    .controller('avatarCtrl', function ($scope, $http, $filter, $window, $element)
    {
        $scope.editAvatarModalActivated = false;
        $scope.myImage='';
        $scope.myCroppedImage='';
        $scope.avatarUri = '';

        /*$scope.init = function () {
            console.log("At INIT!!!");
            $scope.editAvatarModalActivated = false;
            $scope.myImage='';
            $scope.myCroppedImage='';
            $scope.avatarUri = '';
        };*/

        $scope.openEditAvatarModal = function () {
            console.log("opened avatar modal");
            $scope.editAvatarModalActivated = true;
        };

        $scope.closeEditAvatarModal = function () {
            console.log("closed avatar modal");
            $scope.editAvatarModalActivated = false;
            $scope.myCroppedImage = null;
        };

        $scope.updateProfilePic = function () {
            console.log("At updateProfilePic");
        };

        $scope.updateProfilePic = function () {
            console.log('I will update the profile picture');
            console.log('myCroppedImage is:');
            //console.log($scope.myCroppedImage);
            //TODO call a service here to execute function updateAvatar
            /*userService.update_avatar($scope.myCroppedImage)
                .then(function(response)
                {
                    console.log('updatedAvatar');
                    location.reload();
                })
                .catch(function(error){
                    console.error("Error updating avatar " + JSON.stringify(error));
                });*/
        };

        var handleFileSelect=function(evt) {
            console.log("AT handleFileSelect");
            var file=evt.currentTarget.files[0];
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function($scope){
                    $scope.myImage=evt.target.result;
                });
            };
            reader.readAsDataURL(file);
        };
        angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);

    });