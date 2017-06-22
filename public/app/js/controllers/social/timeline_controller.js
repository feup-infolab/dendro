angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('timelineCtrl', function ($scope, $http, $filter, timelineService, projectsService, $window, $element)
    {
        $scope.myTab = $element;
        $scope.posts = [];
        $scope.countCenas = 1;
        $scope.totalPosts = 0;
        $scope.postsPerPage = 5; // this should match however many results your API puts on one page
        $scope.renderPosts = false;
        $scope.postsContents = [];
        $scope.loggedUser = "";

        $scope.newPostTitlePlaceholder = "The title of your post";
        $scope.newPostContentPlaceholder = "Write your post here";

        $scope.userProjects = [
            {
                name: 'Select the Project',//name of the project
                value: 'selectTheProject-value'//the uri of the project
            }
        ];

        $scope.pagination = {
            current: 1
        };
        
        $scope.actionTypesDictionary = {
            "add": "added",
            "edit": "edited",
            "delete": "deleted"
        };


        var cleanUserProjectsList = function () {
            //$scope.userProjects = [];
            //$scope.userProjects.push({name: 'Select the Project', value: 'selectTheProject-value'});
            $scope.userProjects.splice(1);
            console.log("yay");
        };

        $scope.getUserProjects = function () {
            projectsService.getUserProjects()
                .then(function (response) {
                    cleanUserProjectsList();
                    var projectsData = response.data.projects;
                    var projects = _.map(projectsData, function (project) {
                        var newProject = {
                            name: project.ddr.handle,
                            value: project.uri
                        };
                        $scope.userProjects.push(newProject);
                        return newProject;
                    });
                    console.log("yay");
                })
                .catch(function (error) {
                    console.error("Error getting User Projects " + JSON.stringify(error));
                });
        };

        //THIS IS THE FUNCTION THAT GETS THE postsURIs for the timeline
        $scope.get_all_posts = function(currentPage)
        {
            $scope.countNumPosts();
            $scope.getting_posts = true;
            timelineService.get_all_posts(currentPage)
                .then(function(response)
                {
                    $scope.posts = response.data;
                    $scope.getting_posts = false;
                })
                .catch(function(error){
                    console.error("Error getting posts " + JSON.stringify(error));
                    $scope.getting_posts = false;
                });
        };

        $scope.new_post = function()
        {
            $scope.posting_new_post = true;

            timelineService.new_post($scope.new_post_content)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);

                    $scope.get_all_posts();
                    $scope.posting_new_post = false;
                })
                .catch(function(error){
                    console.error("Error creating new post" + JSON.stringify(error));
                    $scope.posting_new_post = false;
                });
        };

        $scope.likePost = function (postID) {
            $scope.doing_likePost = true;

            timelineService.likePost(postID)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);
                    $scope.postLikesInfo(postID);
                    $scope.doing_likePost = false;
                })
                .catch(function(error){
                    console.error("Error liking a post" + JSON.stringify(error));
                    $scope.doing_likePost = false;
                });
        };

        $scope.postIsLiked = function (postID) {
            $scope.doing_postIsLiked = true;

            timelineService.postIsLiked(postID)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);
                    $scope.doing_postIsLiked = false;
                    return response.data;
                })
                .catch(function(error){
                    console.error("Error checking like of a post" + JSON.stringify(error));
                    $scope.doing_postIsLiked = false;
                    return false;
                });
        };

        $scope.postLikesInfo = function(postURI) {

            $scope.doing_postLikesInfo = true;
            timelineService.postLikesInfo(postURI).then(function (response) {
                $scope.doing_postLikesInfo = false;
                $scope.postsContents[postURI].likesContent = response.data;
                return response.data;
            }).catch(function (error) {
                console.error("Error at timeline_controller postLikesInfo" + JSON.stringify(error));
                $scope.doing_postIsLiked = false;
                return false;
            });
        };

        $scope.get_logged_user = function () {

            $scope.doing_get_logged_user = true;

            timelineService.get_logged_user()
                .then(function(response)
                {
                    $scope.loggedUser = response.data.uri;

                    $scope.doing_get_logged_user = false;
                })
                .catch(function(error){
                    console.error("Error getting logged in user" + JSON.stringify(error));
                    $scope.doing_get_logged_user = false;
                });
        };

        $scope.getPost = function (postURI, sharePostURI) {

            $scope.doing_getPost = true;
            $scope.queriedPost = null;

            timelineService.getPost_Service(postURI)
                .then(function(response)
                {
                    if(sharePostURI)
                    {
                        //using for share service
                        //$scope.shareList[sharePostURI] = response.data;
                        $scope.postsContents[sharePostURI] = response.data;
                    }
                    else
                    {
                        //using for post service
                        //$scope.postList[postURI] = response.data;
                        $scope.postsContents[postURI] = response.data;
                    }

                    $scope.doing_getPost = false;
                })
                .catch(function(error){
                    console.error("Error getting a post" + JSON.stringify(error));
                    $scope.doing_getPost = false;
                });
        };

        $scope.commentPost = function (postID, commentMsg) {
            $scope.doing_commentPost = true;
            timelineService.commentPost(postID, commentMsg)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);
                    $scope.getCommentsFromPost(postID);
                    $scope.doing_commentPost = false;
                })
                .catch(function(error){
                    console.error("Error commenting a post" + JSON.stringify(error));
                    $scope.doing_commentPost = false;
                });
        };

        $scope.sharePost = function (postID, shareMsg) {
            $scope.doing_sharePost = true;

            timelineService.sharePost(postID, shareMsg)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);
                    $scope.getSharesFromPost(postID);
                    $scope.get_all_posts($scope.pagination.current);//TODO remove this function call???
                    $scope.doing_sharePost = false;
                })
                .catch(function(error){
                    console.error("Error sharing a post" + JSON.stringify(error));
                    $scope.doing_sharePost = false;
                });
        };

        $scope.getSharesFromPost = function (postID) {
            $scope.doing_getSharesFromPost = true;
            timelineService.getSharesFromPost(postID)
                .then(function(response)
                {
                    $scope.show_popup(response.data);
                    $scope.postsContents[postID].sharesContent = response.data;
                    $scope.doing_getSharesFromPost = false;
                })
                .catch(function(error){
                    console.error("Error getting shares from a post" + JSON.stringify(error));
                    $scope.doing_getSharesFromPost = false;
                });
        };

        $scope.getCommentsFromPost = function (postID) {

            $scope.doing_getCommentsFromPost = true;

            timelineService.getCommentsFromPost(postID)
                .then(function(response)
                {
                    $scope.show_popup(response.data);
                    $scope.postsContents[postID].commentsContent = response.data;
                    $scope.doing_getCommentsFromPost = false;
                })
                .catch(function(error){
                    console.error("Error getting comments from a post" + JSON.stringify(error));
                    $scope.doing_getCommentsFromPost = false;
                });
        };

        $scope.initTimeline = function()
        {
            if($scope.renderPosts)
            {
                $scope.new_post_content = "";
                $scope.commentList = [];
                $scope.shareList = [];
                $scope.likedPosts = [];
                $scope.postList = [];
                $scope.posts = [];
                $scope.likesPostInfo = [];
                $scope.postsContents = [];
                $scope.getUserProjects();
                $scope.pageChangeHandler($scope.pagination.current);
            }
        };

        $scope.initSinglePost = function (postUri) {
            timelineService.getPostInfo(postUri).then(function(response)
            {
                $scope.postsContents[postUri] = response.data;
            })
            .catch(function(error){
                console.error("Error initSinglePost" + JSON.stringify(error));
            });
        };

        $scope.initSingleShare = function (shareUri) {
            timelineService.getShareInfo(shareUri).then(function(response)
            {
                $scope.postsContents[shareUri] = response.data;
                return response.data;
            }).then(function (shareContent) {
                timelineService.getPostInfo(shareContent.ddr.postURI).then(function (response) {
                    $scope.postsContents[shareContent.ddr.postURI] = response.data;
                });
            }).catch(function(error){
                console.error("Error initSinglePost" + JSON.stringify(error));
            });
        };

        $scope.show_popup = function(type, title, message)
        {
            if(type == "success")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'success',
                    opacity: 1.0,
                    delay: 2000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "error")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'error',
                    opacity: 1.0,
                    delay: 5000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "info")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'info',
                    opacity: 1.0,
                    delay: 8000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
        };

        $scope.waitForPostInfo = function (postURI) {
            console.log('in waitForPostInfo');
            /*var socket = io('http://127.0.0.1:3001');
            socket.on('postURI:'+ postURI, function (postData) {
                console.log('session for: ', postURI);
                console.log('this was the data:');
                console.log(postData);
            });*/
        };

        $scope.countNumPosts = function () {

            timelineService.countNumPosts()
                .then(function(response)
                {
                    $scope.totalPosts = response.data;
                })
                .catch(function(error){
                    console.error("Error number of posts" + JSON.stringify(error));
                });
        };

        $scope.pageChangeHandler = function(num) {
            if($scope.renderPosts)
            {
                console.log("Im here going to page: ", num);
                $scope.countNumPosts();
                $scope.get_all_posts(num);
                $window.scrollTo(0, 0);//to scroll up to the top on page change
            }
        };

        $scope.createNewManualPost = function (newPostTitle, newPostContent, projectUri) {
            console.log("AT createNewManualPost");
        };

        $scope.$on('tab_changed:timeline', function(event, args) {
            $scope.renderPosts = true;
            $scope.pagination.current = 1;
            $scope.initTimeline();
        });

        $scope.$on('tab_changed:fileVersions', function(event, args) {
            $scope.pagination.current = 1;
            $scope.totalPosts = 0;
            $scope.renderPosts = false;
        });
    });