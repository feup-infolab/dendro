angular.module("dendroApp.controllers")
/**
 *  Metadata editor controller
 */
    .controller("folderEditorCtrl", function (
        $scope,
        $rootScope,
        $http,
        $filter,
        $q,
        $log,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        cacheService,
        filesService,
        interactionsService,
        ontologiesService,
        storageService,
        recommendationService,
        projectsService,
        moment
    )
    {
        $scope.shared = {
            metadata: null,
            initial_metadata: null,
            selected_file: null,
            folder_contents: null,
            multiple_selection_active: null,
            recommender_offline: null,
            change_log: null,
            stats: null
        };
    });
