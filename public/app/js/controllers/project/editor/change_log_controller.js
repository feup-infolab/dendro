angular.module('dendroApp.controllers')
    /**
     *  Descriptors List controller
     */
    .controller('changeLogController', function (
        $scope,
        $http,
        $filter,
        $q,
        $log,
        $sce,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        filesService
    ) {
        $scope.revert_to_version = function(version) {
            metadataService.revert_to_version(
                $scope.get_calling_uri(), version
            );
        };

        $scope.get_project_stats = function()
        {

            filesService.get_stats($scope.get_owner_project_uri())
                .then(function(response)
                {
                    $scope.shared.project_stats = response.data;
                });
        };

        $scope.get_recent_changes_of_resource = function()
        {
            $scope.getting_change_log = true;

            /**INIT**/
            metadataService.get_recent_changes_of_resource(windowService.get_current_url())
                .then(function(response)
                {
                    var recent_versions = response.data;
                    for(var i = 0; i < recent_versions.length; i++)
                    {
                        recent_versions[i].thumbnail = '/images/icons/extensions/file_extension_'+ recent_versions[i].ddr.isVersionOf.ddr.fileExtension + ".png";
                    }

                    $scope.shared.recent_versions = recent_versions;
                });
        };

        $scope.get_recent_changes_of_project = function()
        {
            /**INIT**/
            metadataService.get_recent_changes_of_project($scope.get_owner_project_uri())
                .then(function(response)
                {
                    var recent_versions = response.data;
                    for(var i = 0; i < recent_versions.length; i++)
                    {
                        recent_versions[i].thumbnail = '/images/icons/extensions/file_extension_'+ recent_versions[i].ddr.isVersionOf.ddr.fileExtension + ".png";
                    }

                    $scope.shared.recent_versions = recent_versions;
                });
        };
    });