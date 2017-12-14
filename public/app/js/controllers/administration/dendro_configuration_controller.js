angular.module("dendroApp.controllers")
/**
 *  Avatar controller
 */
    .controller("dendroConfigurationController", function ($scope, $http, $filter, $window, $element, storageService, dendroConfigurationService)
    {
        $scope.storageNamespace = "dendro_admin_controller";

        $scope.setReadOnly = function (_editor)
        {
            _editor.setReadOnly(true);
        };

        $scope.getConfiguration = function ()
        {
            dendroConfigurationService.getConfiguration()
                .then(function (configuration)
                {
                    $scope.serverConfiguration = JSON.stringify(configuration.deployment_configs, null, 4);
                    $scope.runningConfiguration = JSON.stringify(configuration.config, null, 4);
                    $scope.pm2Description = JSON.stringify(configuration.pm2_description, null, 4);
                });
        };

        $scope.saveNLinesOfLogToFetch = function()
        {
            storageService.save_to_local_storage("nLinesOfLogToFetch", $scope.nLinesOfLogToFetch);
        };

        $scope.getLogs = function ()
        {
            $scope.fetchingLogs = true;
            $scope.saveNLinesOfLogToFetch();

            dendroConfigurationService.getLogs($scope.nLinesOfLogToFetch)
                .then(function (logs)
                {
                    $scope.fetchingLogs = false;
                    $scope.combinedLog = logs.combined;
                    $scope.errorLog = logs.error;
                })
                .catch(function (error){
                    Utils.show_popup("error", "Error", error.message);
                    $scope.autoRefreshLogs = false;
                });
        };

        $scope.saveConfiguration = function ()
        {
            dendroConfigurationService.saveConfiguration($scope.serverConfiguration)
                .then(function (data)
                {
                    Utils.show_popup("success", "Saved", data.message);
                })
                .catch(function (error)
                {
                    Utils.show_popup("error", "Error", "Error saving configuration");
                    Utils.show_popup("error", "Error", JSON.stringify(error));
                });
        };

        $scope.restartServer = function ()
        {
            dendroConfigurationService.restartServer();
        };

        $scope.toggleAutoRefreshLogs = function ()
        {
            $scope.autoRefreshLogs = !$scope.autoRefreshLogs;
            storageService.save_to_local_storage("autoRefreshLogs", $scope.autoRefreshLogs);
        };

        $scope.periodicLogRefresh = function()
        {
            setTimeout(function()
            {
                if($scope.autoRefreshLogs)
                {
                    $scope.getLogs();
                    $scope.periodicLogRefresh();
                }
            }, 1000);
        }

        $scope.init = function ()
        {
            $scope.set_from_local_storage_and_then_from_value("nLinesOfLogToFetch", 30, $scope);
            $scope.set_from_local_storage_and_then_from_value("autoRefreshLogs", false, $scope);
            $scope.getConfiguration();
            $scope.periodicLogRefresh();
        };
    });
