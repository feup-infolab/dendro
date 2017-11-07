angular.module('dendroApp.services')
    .service('ontologiesService',
        ['$http', 'storageService', 'windowService',
            function ($http, storageService, windowService)
            {
                this.get_ontologies_by_text_search = function (typed)
                {
                    if (typeof typed !== 'undefined')
                    {
                        var requestUri = '/ontologies/autocomplete?query=' + typed;

                        return $http.get(requestUri).then(function (response)
                        {
                            return response.data;
                        });
                    }
                };

                this.get_public_ontologies = function ()
                {
                    return $http({
                        method: 'GET',
                        url: '/ontologies/public',
                        data: JSON.stringify({}),
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    })
                        .then(function (response)
                        {
                            storageService.save_to_local_storage('public_ontologies', response.data);
                            return response.data;
                        });
                };

                this.get_all_ontologies = function ()
                {
                    return $http({
                        method: 'GET',
                        url: '/ontologies/all',
                        data: JSON.stringify({}),
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    })
                        .then(function (response)
                        {
                            storageService.save_to_local_storage('all_ontologies', response.data);
                            return response.data;
                        })
                        .catch(function (response)
                        {
                            windowService.show_popup('error', response.responseJSON.result, response.responseJSON.message);
                        });
                };
            }]);
