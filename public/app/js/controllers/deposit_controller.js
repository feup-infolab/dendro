angular.module('dendroApp.controllers', ['ui.scroll', 'ui.scroll.grid'])
/**
 *  Project administration controller
 */
    .controller('depositCtrl', function (
        $scope,
        $http,
        $filter,
        $q,
        $location,
        $log,
        $sce,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        projectsService,
        usersService
    )
    {
        $scope.active_tab = null;
        $scope.offset = 0;
        $scope.page = 10;

        $scope.search =  {
                creator: {
                  type: "text",
                  label: "Username",
                  key: "creator",
                  value: "",
                },
                project: {
                  type: "text",
                  label: "Project",
                  key: "project",
                  value: "",
                },
                dateFrom: {
                  type: "date",
                  label: "Date Start",
                  key: "dateFrom",
                  value: "",
                },
                dateTo: {
                  type: "date",
                  label: "Date End",
                  key: "dateTo",
                  value: "",
                },
                privateDeposit: {
                  type: "checkbox",
                  label: "Private Deposits",
                  key: "private",
                  value: false,
                },
                system: {
                  type: "checkbox",
                  list: true,
                  label: "System Used",
                  key: "systems",
                  value: [
                    {
                      name: "ckan",
                      value: false,
                    },
                    {
                      name: "b2Drop",
                      value: true,
                    }
                  ]
                }

                /*offset: 0,
                limit: 10,
                system: {
                  ckan: true,
                  b2drop: false,
                  all: true,
                }*/

        };

        $scope.hostUrl = window.location.protocol + "//" + window.location.host + "/user/";

        $scope.init = function(){

            $scope.getRegistry();
        };

        $scope.getRegistry = function(){
            let url = $scope.get_current_url();
            url += "deposits/latest";
            const params = $scope.parseFilter();

            $http({
                method: "GET",
                url: url,
                params: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(function(response){

                //TODO check if empty and show something else if it is and disable scrolling function

                //if data checks out
                $scope.offset++;

                let deposits = response.data;
                for(let i = 0; i < deposits.length; i++){
                    deposits[i].date = moment(deposits[i].date).fromNow();
                }
                $scope.deposits = deposits;
            }).catch(function(error){
                console.log(error);
            });
        };

        $scope.parseFilter = function(){
            let search = {};
            for(item in $scope.search){
              if($scope.search[item].value !== null && $scope.search[item].value !== "")
              search[$scope.search[item].key] = $scope.search[item].value;
            }
            return search;
        };

        $scope.deposits = [];


        $scope.get_project = function()
        {
            var url = $scope.get_current_url()+"?metadata&deep=true";

            $http({
                method: 'GET',
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            }).then(function(response) {
                //console.log(data);
                $scope.project = response.data;

                for(var i = 0; i < $scope.project.descriptors.length; i++)
                {
                    var descriptor = $scope.project.descriptors[i];
                    if(descriptor.prefixedForm == "ddr:deleted" && descriptor.value == true)
                    {
                        project.deleted = true;
                    }
                }
            })
                .catch(function(error){
                    if(error.message != null && error.title != null)
                    {
                        Utils.show_popup("error", error.title, error.message);
                    }
                    else
                    {
                        Utils.show_popup("error", "Error occurred", JSON.stringify(error));
                    }
                });
        };


    })
    .directive("searchBar", function (

    ) {
        //let searchParameters = $scope.search();
        return {
          template: "<div class=\"form-group\" ng-repeat=\"item in search track by $index\">\n" +
          "        <label>\n" +
          "            {{item.label}}\n" +
          "            <div ng-if=\"item.list\" ng-repeat=\"iterator in item.value track by $index\">\n" +
          "                <label>\n" +
          "                    {{iterator.name}}\n" +
          "                    <input ng-model=\"iterator.value\" ng-change=\"getRegistry()\" ng-model-options=\"{debounce : 500}\" type=\"{{item.type}}\">\n" +
          "                </label>\n" +
          "            </div>\n" +
          "\n" +
          "            <input ng-if=\"!item.list\" ng-model=\"item.value\" ng-change=\"getRegistry()\" ng-model-options=\"{debounce : 500}\" type=\"{{item.type}}\">\n" +
          "\n" +
          "        </label>\n" +
          "    </div>"
        }
    });