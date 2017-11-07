angular.module('dendroApp.controllers')
/**
     *  Project administration controller
     */
    .controller('timelineCtrl', function ($scope, $http, $filter, usersService, timelineService, projectsService, $window, $element, usSpinnerService)
    {
        $scope.myTab = $element;
        $scope.posts = [];
        $scope.countCenas = 1;
        $scope.totalPosts = 0;
        $scope.postsPerPage = 5; // this should match however many results your API puts on one page
        $scope.postsContents = [];
        $scope.loggedUser = '';
        $scope.fullProjectsInfo = [];
        $scope.fullUsersInfo = [];
        $scope.doingARequest = false;

        $scope.pagination = {
            current: 1
        };

        $scope.actionTypesDictionary = {
            add: 'added',
            edit: 'edited',
            delete: 'deleted'
        };

        $scope.toggleNewPostModal = function (show)
        {
            $scope.showCreatePostContent = show;
        };

        var cleanUserProjectsList = function ()
        {
            $scope.userProjects.splice(1);
        };

        /* $('#myModal').on('hidden.bs.modal', function (e) {
            console.log("Modal hidden");
            $("#choosingProject").html("projects");
            $("#newPostTitle").html("titleLindo");
            $("#newPostContent").html("contentLindo");
        });
*/
        $scope.getUserProjects = function ()
        {
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            projectsService.getUserProjects()
                .then(function (response)
                {
                    cleanUserProjectsList();
                    var projectsData = response.data.projects;
                    var projects = _.map(projectsData, function (project)
                    {
                        var newProject = {
                            name: project.ddr.handle,
                            value: project.uri
                        };
                        $scope.userProjects.push(newProject);
                        return newProject;
                    });
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                    return projects;
                })
                .catch(function (error)
                {
                    console.error('Error getting User Projects ' + JSON.stringify(error));
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        // THIS IS THE FUNCTION THAT GETS THE postsURIs for the timeline
        $scope.get_all_posts = function (currentPage)
        {
            $scope.countNumPosts();
            $scope.getting_posts = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.get_all_posts(currentPage)
                .then(function (response)
                {
                    $scope.posts = response.data;
                    $scope.getting_posts = false;
                    /* $scope.getPosts($scope.posts); */
                    $scope.getPosts(JSON.stringify($scope.posts));
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    console.error('Error getting posts ' + JSON.stringify(error));
                    $scope.getting_posts = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.likePost = function (postID)
        {
            $scope.doing_likePost = true;
            timelineService.likePost(postID)
                .then(function (response)
                {
                    $scope.postLikesInfo(postID, false);
                    $scope.doing_likePost = false;
                })
                .catch(function (error)
                {
                    console.error('Error liking a post' + JSON.stringify(error));
                    $scope.doing_likePost = false;
                    Utils.show_popup('error', 'Error liking post', JSON.stringify(error));
                });
        };

        $scope.postLikesInfo = function (postURI, showSpinner)
        {
            $scope.doing_postLikesInfo = true;
            if (showSpinner)
            {
                $scope.doingARequest = true;
                usSpinnerService.spin('social-dendro-spinner');
            }
            timelineService.postLikesInfo(postURI).then(function (response)
            {
                $scope.doing_postLikesInfo = false;
                $scope.postsContents[postURI].likesContent = response.data;
                if (showSpinner)
                {
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                }
                // return response.data;
            }).catch(function (error)
            {
                console.error('Error at timeline_controller postLikesInfo' + JSON.stringify(error));
                $scope.doing_postLikesInfo = false;
                if (showSpinner)
                {
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                }
            });
        };

        $scope.get_logged_user = function ()
        {
            $scope.doing_get_logged_user = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.get_logged_user()
                .then(function (response)
                {
                    // $scope.loggedUser = response.data.uri;
                    $scope.loggedUser = response.data;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                    $scope.doing_get_logged_user = false;
                })
                .catch(function (error)
                {
                    console.error('Error getting logged in user' + JSON.stringify(error));
                    $scope.doing_get_logged_user = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.getPost = function (postURI, sharePostURI)
        {
            $scope.doing_getPost = true;
            $scope.queriedPost = null;
            $scope.doingARequest = true;

            usSpinnerService.spin('social-dendro-spinner');
            timelineService.getPost_Service(postURI)
                .then(function (response)
                {
                    if (sharePostURI)
                    {
                        // using for share service
                        // $scope.shareList[sharePostURI] = response.data;
                        $scope.postsContents[sharePostURI] = response.data;
                    }
                    else
                    {
                        // using for post service
                        // $scope.postList[postURI] = response.data;
                        $scope.postsContents[postURI] = response.data;
                    }

                    $scope.doing_getPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    console.error('Error getting a post' + JSON.stringify(error));
                    $scope.doing_getPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.getPosts = function (postsQueryInfo)
        {
            $scope.doing_getPosts = true;
            $scope.queriedPost = null;
            $scope.doingARequest = true;

            usSpinnerService.spin('social-dendro-spinner');
            timelineService.getPosts_Service(postsQueryInfo)
                .then(function (response)
                {
                    $scope.postsContents = response.data;
                    $scope.doing_getPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    console.error('Error at getPosts: ' + JSON.stringify(error));
                    $scope.doing_getPosts = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.commentPost = function (postID, commentMsg)
        {
            $scope.doing_commentPost = true;
            timelineService.commentPost(postID, commentMsg)
                .then(function (response)
                {
                    $scope.getCommentsFromPost(postID, false);
                    $scope.doing_commentPost = false;
                    Utils.show_popup('success', 'Success', 'Post was commented successfully');
                })
                .catch(function (error)
                {
                    console.error('Error commenting a post' + JSON.stringify(error));
                    Utils.show_popup('error', 'Error commenting a post', JSON.stringify(error));
                    $scope.doing_commentPost = false;
                });
        };

        $scope.sharePost = function (postID, shareMsg)
        {
            $scope.doing_sharePost = true;
            timelineService.sharePost(postID, shareMsg)
                .then(function (response)
                {
                    $scope.getSharesFromPost(postID);
                    $scope.pagination.current = 1;
                    $scope.pageChangeHandler($scope.pagination.current);
                    $window.scrollTo(0, 0);// to scroll up to the top on page change
                    $scope.doing_sharePost = false;
                    Utils.show_popup('success', 'Success', 'Post was shared successfully');
                })
                .catch(function (error)
                {
                    console.error('Error sharing a post' + JSON.stringify(error));
                    Utils.show_popup('error', 'Error sharing a post', JSON.stringify(error));
                    $scope.doing_sharePost = false;
                });
        };

        $scope.getSharesFromPost = function (postID)
        {
            $scope.doing_getSharesFromPost = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.getSharesFromPost(postID)
                .then(function (response)
                {
                    $scope.show_popup(response.data);
                    $scope.postsContents[postID].sharesContent = response.data;
                    $scope.doing_getSharesFromPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    console.error('Error getting shares from a post' + JSON.stringify(error));
                    $scope.doing_getSharesFromPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.getCommentsFromPost = function (postID, showSpinner)
        {
            $scope.doing_getCommentsFromPost = true;
            if (showSpinner)
            {
                $scope.doingARequest = true;
                usSpinnerService.spin('social-dendro-spinner');
            }

            timelineService.getCommentsFromPost(postID)
                .then(function (response)
                {
                    $scope.show_popup(response.data);
                    $scope.postsContents[postID].commentsContent = response.data;
                    $scope.doing_getCommentsFromPost = false;
                    if (showSpinner)
                    {
                        $scope.doingARequest = false;
                        usSpinnerService.stop('social-dendro-spinner');
                    }
                })
                .catch(function (error)
                {
                    console.error('Error getting comments from a post' + JSON.stringify(error));
                    $scope.doing_getCommentsFromPost = false;
                    if (showSpinner)
                    {
                        $scope.doingARequest = false;
                        usSpinnerService.stop('social-dendro-spinner');
                    }
                });
        };

        $scope.initTimeline = function (posts)
        {
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            $scope.fullProjectsInfo = [];
            $scope.fullUsersInfo = [];
            $scope.showCreatePostContent = false;
            $scope.userProjects = [{name: 'Select the Project', value: 'selectTheProject-value'}];
            $scope.projectChosen = $scope.userProjects[0];
            $scope.newPostTitle = '';
            $scope.newPostContent = '';
            $scope.getUserProjects();

            $scope.countNumPosts();
            // $scope.get_all_posts($scope.pagination.current);
            $scope.posts = JSON.parse(posts);
            /* $scope.posts = posts; */
            $scope.new_post_content = '';
            $scope.commentList = [];
            $scope.shareList = [];
            $scope.likedPosts = [];
            $scope.postList = [];
            // $scope.posts = [];
            $scope.likesPostInfo = [];
            $scope.postsContents = [];
            /* $scope.getPosts($scope.posts); */
            $scope.getPosts(posts);
            // $scope.pageChangeHandler($scope.pagination.current);
            $window.scrollTo(0, 0);// to scroll up to the top on page change
            usSpinnerService.stop('social-dendro-spinner');
            $scope.doingARequest = false;
        };

        $scope.initSinglePost = function (postUri)
        {
            $scope.doing_getPost = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.getPostInfo(postUri).then(function (response)
            {
                $scope.postsContents[postUri] = response.data;
                $scope.doing_getPost = false;
                $scope.doingARequest = false;
                usSpinnerService.stop('social-dendro-spinner');
            })
                .catch(function (error)
                {
                    console.error('Error initSinglePost' + JSON.stringify(error));
                    $scope.doing_getPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.initSingleShare = function (shareUri)
        {
            $scope.doing_getPost = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.getShareInfo(shareUri).then(function (response)
            {
                $scope.postsContents[shareUri] = response.data;
                return response.data;
            }).then(function (shareContent)
            {
                timelineService.getPostInfo(shareContent.ddr.postURI).then(function (response)
                {
                    $scope.postsContents[shareContent.ddr.postURI] = response.data;
                    $scope.doing_getPost = false;
                    $scope.doingARequest = false;
                    $scope.postUri = $scope.postsContents[shareUri].ddr.postURI;
                    usSpinnerService.stop('social-dendro-spinner');
                    $scope.getUserInfo($scope.postsContents[shareUri].ddr.userWhoShared);
                });
            }).catch(function (error)
            {
                console.error('Error initSinglePost' + JSON.stringify(error));
                $scope.doing_getPost = false;
                $scope.doingARequest = false;
                usSpinnerService.stop('social-dendro-spinner');
            });
        };

        $scope.show_popup = function (type, title, message)
        {
            if (type == 'success')
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'success',
                    opacity: 1.0,
                    delay: 2000,
                    addclass: 'stack-bar-top',
                    cornerclass: '',
                    stack: stack_topright
                });
            }
            else if (type == 'error')
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'error',
                    opacity: 1.0,
                    delay: 5000,
                    addclass: 'stack-bar-top',
                    cornerclass: '',
                    stack: stack_topright
                });
            }
            else if (type == 'info')
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'info',
                    opacity: 1.0,
                    delay: 8000,
                    addclass: 'stack-bar-top',
                    cornerclass: '',
                    stack: stack_topright
                });
            }
        };

        $scope.waitForPostInfo = function (postURI)
        {
            console.log('in waitForPostInfo');
            /* var socket = io('http://127.0.0.1:3001');
            socket.on('postURI:'+ postURI, function (postData) {
                console.log('session for: ', postURI);
                console.log('this was the data:');
                console.log(postData);
            }); */
        };

        $scope.countNumPosts = function ()
        {
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.countNumPosts()
                .then(function (response)
                {
                    $scope.totalPosts = response.data;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    console.error('Error number of posts' + JSON.stringify(error));
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.pageChangeHandler = function (num)
        {
            console.log('Im here going to page: ', num);
            $scope.countNumPosts();
            $scope.get_all_posts(num);
            $window.scrollTo(0, 0);// to scroll up to the top on page change
        };

        // $scope.createNewManualPost = function (newPostTitle, newPostContent, projectUri) {
        $scope.createNewManualPost = function ()
        {
            $scope.doing_createNewPost = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            timelineService.newPost($scope.newPostTitle, $scope.newPostContent, $scope.projectChosen.value)
                .then(function (response)
                {
                    console.log('before newPostTitle: ' + $scope.newPostTitle);
                    console.log('before newPostContent: ' + $scope.newPostContent);

                    $scope.newPostTitle = '';
                    $scope.newPostContent = '';
                    $scope.projectChosen = $scope.userProjects[0];
                    $scope.pagination.current = 1;
                    $scope.pageChangeHandler($scope.pagination.current);
                    $window.scrollTo(0, 0);// to scroll up to the top on page change
                    $scope.doing_createNewPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                    $scope.toggleNewPostModal(false);
                    Utils.show_popup('success', 'Success', 'Post was created successfully');
                })
                .catch(function (error)
                {
                    console.error('Error createNewManualPost' + JSON.stringify(error));
                    $scope.newPostTitle = '';
                    $scope.newPostContent = '';
                    $scope.projectChosen = $scope.userProjects[0];
                    Utils.show_popup('error', 'Error creating a post', JSON.stringify(error));
                    $scope.doing_createNewPost = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                    $scope.toggleNewPostModal(false);
                });
        };

        $scope.getProjectInfo = function (projectUri)
        {
            $scope.doing_getProjectInfo = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            projectsService.getProjectInfo(projectUri)
                .then(function (response)
                {
                    $scope.fullProjectsInfo[projectUri] = response.data;
                    $scope.doing_getProjectInfo = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    Utils.show_popup('error', "Error getting a project's information", JSON.stringify(error));
                    $scope.doing_getProjectInfo = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };

        $scope.getUserInfo = function (userUri)
        {
            $scope.doing_getUserInfo = true;
            $scope.doingARequest = true;
            usSpinnerService.spin('social-dendro-spinner');
            usersService.getUserInfo(userUri)
                .then(function (response)
                {
                    $scope.fullUsersInfo[userUri] = response.data;
                    $scope.doing_getUserInfo = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                })
                .catch(function (error)
                {
                    Utils.show_popup('error', "Error getting a user's information", JSON.stringify(error));
                    $scope.doing_getUserInfo = false;
                    $scope.doingARequest = false;
                    usSpinnerService.stop('social-dendro-spinner');
                });
        };
    });
