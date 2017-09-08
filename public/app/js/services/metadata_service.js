'use strict';

angular.module('dendroApp.factories')
    .service('metadataService',
        ['$q','$http', 'filesService', 'interactionsService', 'windowService', 'descriptorsService',
        function ($q, $http, filesService, interactionsService, windowService, descriptorsService) {

        this.deserialize_metadata = function(descriptorsArray)
        {
            var deserialized = [];

            if(descriptorsArray == null)
            {
                return [];
            }
            else
            {
                if(descriptorsArray instanceof Array)
                {
                    for(var i = 0; i < descriptorsArray.length; i++)
                    {
                        var descriptor = JSON.parse(JSON.stringify(descriptorsArray[i]));

                        if(descriptor.control === "date_picker")
                        {
                            descriptor.value = new Date(descriptor.value);
                        }

                        deserialized.push(descriptor);
                    }
                }
                else
                {
                    console.error("Error deserializing metadata. Argument should be an array of descriptors");
                }


                return deserialized;
            }
        };


        this.dirty_metadata = function(initial_metadata, current_metadata)
        {
            if(initial_metadata == null && current_metadata == null)
            {
                return false;
            }
            else if(initial_metadata == null && current_metadata != null)
            {
                return true;
            }
            else if(
                initial_metadata != null &&
                current_metadata != null &&

                initial_metadata instanceof Array &&
                current_metadata instanceof Array)
            {
                for(var i = 0; i < current_metadata.length;i++){
                    if(current_metadata[i].just_added || current_metadata[i].just_recommended || current_metadata[i].just_deleted || current_metadata[i].just_inherited)
                        return true;
                }

                return !_.isEqual(JSON.parse(JSON.stringify(current_metadata)), JSON.parse(JSON.stringify(initial_metadata)));
            }
            else
            {
                return false;
            }
        };

        this.load_metadata = function(uri)
        {
            var self = this;

            if(uri == null)
            {
                uri = windowService.get_current_url();
            }

            var requestUri = uri + "?metadata";

            var deserialize = $q.defer();

            $http({
                method: 'GET',
                url: requestUri,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(
                function(response)
                {
                    if(response.data != null && response.data instanceof Object)
                    {
                        deserialize.resolve({
                            descriptors : self.deserialize_metadata(response.data.descriptors),
                            is_project_root : response.data.is_project_root,
                            is_a_file : response.data.is_a_file,
                            file_extension : response.data.file_extension,
                            data_processing_error : response.data.data_processing_error
                        });
                    }
                    else
                    {
                        deserialize.reject([]);
                    }
                });

            return deserialize.promise;
        };

        this.metadata_is_valid = function(metadata_array)
        {
            var self = this;

            if(!metadata_array)
            {
                return true;
            }
            else
            {
                for(var i = 0; i < metadata_array.length;i++)
                {
                    if(!descriptorsService.descriptor_is_valid(metadata_array[i]))
                    {
                        return false;
                    }
                }

                return true;
            }
        };

        this.save_metadata = function(metadata_array, resource_uri)
        {
            var self = this;

            var deferred = $q.defer();

            if(self.metadata_is_valid(metadata_array))
            {
                var metadataString = JSON.stringify(metadata_array);
                var url = resource_uri + "?update_metadata";

                return $http({
                    method: "POST",
                    url: url,
                    data: metadataString,
                    contentType: "application/json",
                    headers: {"Accept": "application/json"}
                }).then(function (response)
                    {
                        var data = response.data;
                        deferred.resolve(data);
                    }
                ).catch(function(error)
                    {
                        deferred.reject(error);
                    }
                );
            }

            return deferred.promise;
        };

        this.save_as = function(format){
            var self = this;

            var url = windowService.get_current_url();

            var mimeTypes = {
                'txt' : "application/txt",
                'rdf' : "application/rdf",
                'json' : "application/json"
            };

            var mt = mimeTypes[format];
            if(mt != null)
            {
                return $http({
                    method: 'GET',
                    url: url,
                    headers: {"Accept": mt},
                    data : {}
                }).then(function(response) {
                    var data = response.data;
                    if(format == 'json'){
                        data = vkbeautify.json(data);
                    }
                    else if(format == 'rdf'){
                        data = vkbeautify.xml(data);
                    }

                    var  filename = url.match(/([^\/]*)\/*$/)[1];
                    var element = angular.element('<a/>');
                    element.attr({
                        href: 'data:attachment/'+format+';charset=utf-8,' + encodeURI(data),
                        target: '_blank',
                        download: filename +'.'+  format
                    })[0].click();

                }).catch(function(error) {
                    // if there's an error you should see it here
                });
            }
            else{
                windowService.show_popup("error", "Parser not Found", "System cannot provide such a representation for this record");
            }
        };

        this.revert_to_version = function(resource_uri, version) {

            var self = this;
            var url = resource_uri + "?restore_metadata_version"

            $.ajax({
                type: "POST",
                url: url,
                contentType : "application/json",
                data: JSON.stringify({version : version}),
                beforeSend: function (xhr)
                {
                    xhr.setRequestHeader("Accept", "application/json")
                },
                success: function( response ) {
                    location.reload();
                    windowService.show_popup("success", response.result, response.message);
                },
                error : function( response ) {
                    windowService.show_popup("error", response.responseJSON.result, response.responseJSON.message);
                }
            });
        };

        this.descriptor_is_filled_in = function(descriptor, metadata)
        {
            if(metadata != null && metadata instanceof Array)
            {
                for(var i = 0; i < metadata.length; i++)
                {
                    var descriptorUri = metadata[i].uri;

                    if(
                        descriptorUri == descriptor.uri &&
                        metadata[i].value != null &&
                        (
                            metadata[i].value.length > 0 ||
                            metadata[i].value instanceof Date
                        )
                    )
                    {
                        return true;
                    }
                }
                return false;
            }
            else
            {
                return false;
            }
        };

        this.descriptor_is_present = function(descriptor, metadata_array)
        {
            if(metadata_array != null && metadata_array instanceof Array)
            {
                for(var i = 0; i < metadata_array.length; i++)
                {
                    if(descriptor.uri == metadata_array[i].uri)
                    {
                        return true;
                    }
                }

                return false;
            }
            else
            {
                return false;
            }
        };

        this.get_recent_changes_of_project = function(resource_uri)
        {
            if(resource_uri != null)
            {
                var requestUri = resource_uri + '?recent_changes&limit=5';

                return $http({
                    method: 'GET',
                    url: requestUri,
                    data: JSON.stringify({}),
                    contentType: "application/json",
                    headers: {"Accept": "application/json"}
                }).then(function(response) {
                    return response;
                });
            }
        };


        this.get_recent_changes_of_resource = function(resourceUri)
        {
            if(resourceUri != null)
            {
                var requestUri = resourceUri + '?change_log';

                return $http({
                        method: 'GET',
                        url: requestUri,
                        data: JSON.stringify({}),
                        contentType: "application/json",
                        headers: {"Accept": "application/json"}
                }).then(function(response) {
                    return response;
                });
            }
        };
    }]);
