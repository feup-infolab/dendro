angular.module("dendroApp.controllers")
/**
 *  Avatar controller
 */
    .controller("dendroConfigurationController", function ($scope, $http, $filter, $window, $element, dendroConfigurationService)
    {
        $scope.getConfiguration = function ()
        {
            dendroConfigurationService.getConfiguration()
                .then(function (configuration)
                {
                    $scope.serverConfiguration = JSON.stringify(configuration.deployment_configs, null, 4);
                    $scope.runningConfiguration = JSON.stringify(configuration.config, null, 4);
                });
        };

        $scope.saveConfiguration = function ()
        {
            dendroConfigurationService.save($scope.serverConfiguration)
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

        $scope.rebootServer = function ()
        {
            dendroConfigurationService.rebootServer();
        };

        $scope.init = function ()
        {
            $scope.getConfiguration();
        };
    });
