angular.module('dendroApp.controllers', [])
/**
 *  Deposit registry controller
 */
    .controller('depositCtrl', function (
        $scope,
        $http,
        listings,
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
        $scope.offset = 1;
        $scope.page = 5;
        $scope.totalDeposits = 0;

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
                  label: "Private Deposits only",
                  key: "private",
                  value: false,
                },
                system: {
                  type: "checkbox",
                  list: true,
                  label: "Platform Used",
                  key: "platforms",
                  value: [
                    {
                      name: "CKAN",
                      value: true,
                    },
                    {
                      name: "DSpace",
                      value: true,
                    },
                    {
                      name: "EPrints",
                      value: true,
                    },
                    {
                      name: "Figshare",
                      value: true,
                    },
                    {
                      name: "Zenodo",
                      value: true,
                    },
                    {
                      name: "EUDAT B2Share",
                      value: true,
                    },
                  ]
                },
                ordering: {
                  type: "dropdown",
                  list: true,
                  label: "Order By",
                  key: "order",
                  selected: "Date",
                  value: [
                    {
                      name: "Date",
                    },
                    {
                      name: "Username",
                    },
                    {
                      name: "Project",
                    }
                  ]
                }
        };

        $scope.hostUrl = window.location.protocol + "//" + window.location.host + "/user/";

        $scope.init = function(){

            $scope.getRegistry(true);
        };

        $scope.getRegistry = function(change){

            const handle = function(data, change){
              //if data checks out
              //$scope.offset++;
              $scope.totalDeposits = 0;

              let deposits = data.deposits;
              for(let i = 0; i < deposits.length; i++){
                deposits[i].date = moment(deposits[i].date).fromNow();
              }
              $scope.deposits = deposits;

              if(change && data.repositories instanceof Array){
                $scope.totalDeposits = 0;

                const repository = data.repositories;
                if($scope.search.repositories == null || $scope.search.repositories == undefined){
                  $scope.search.repositories = {
                    type: "checkbox",
                    list: true,
                    label: "Repository Used",
                    key: "repositories",
                    value: []
                  }
                  for(let repo of repository){
                    $scope.search.repositories.value.push({
                      name: repo.repository,
                      count: repo.count,
                      value: true
                    });
                    $scope.totalDeposits += parseInt(repo.count);
                  }
                  $scope.totalDeposits = Math.ceil($scope.totalDeposits / $scope.page);
                  console.log("oioiooioioioioioioio\n" + $scope.totalDeposits);
                }
              }
            }

            let url = $scope.get_current_url();
            url += "deposits/latest";
            listings.get_listing($scope, url, $scope.page, $scope.offset - 1, $scope.search, change, handle);

        };

        $scope.changePage = function(pageNumber){

        }



        $scope.deposits = [];

    })
    .directive("searchBar", function (

    ) {
        return {
          restrict: "ACE",
          scope: true,
          replace: true,
          templateUrl: "/app/views/search/filter_table.ejs",
          link: function(scope, elem, attr){
            scope.attr = function(){
              return attr.searchmodel;
            };
            scope.update = function(){
              return attr.searchfunction;
            };
          }
        };
    })
  .directive("pageNavigation", function(

  ){
    return {
      restrict: "ACE",
      scope: true,
      replace: true,
      templateUrl: "/app/views/search/dynamic_pagination.ejs",
      link: function(scope, elem, attr){
        scope.max = function(){
          return attr.maximum;
        };
        scope.update = function(){
          return attr.searchfunction;
        };
        scope.current = function () {
          return attr.current;
        };
      }
    };
  });