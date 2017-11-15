angular.module("dendroApp.services")
    .service("storageService", ["$http", "$localStorage",
        function ($http, $localStorage)
        {
            this.$storage = $localStorage.$default({});

            this.load_from_local_storage = function (key, targetObject, namespace)
            {
                var self = this;
                if (key != null)
                {
                    if (namespace != null)
                    {
                        if (targetObject != null)
                        {
                            if (self.$storage[namespace] != null)
                            {
                                if (targetObject[namespace] == null)
                                {
                                    targetObject[namespace] = {};
                                }

                                targetObject[namespace][key] = self.$storage[namespace][key];
                            }
                        }
                        else
                        {
                            return self.$storage[namespace][key];
                        }
                    }
                    else // if(self.$storage[key] != null)
                    {
                        if (targetObject != null)
                        {
                            targetObject[key] = self.$storage[key];
                        }
                        else
                        {
                            return self.$storage[key];
                        }
                    }
                }
            };

            this.save_to_local_storage = function (key, value, namespace)
            {
                var self = this;

                if (self.$storage[namespace] == null)
                {
                    self.$storage[namespace] = {};
                }

                if (key != null)
                {
                    if (namespace != null)
                    {
                        self.$storage[namespace][key] = value;
                    }
                    else
                    {
                        self.$storage[key] = value;
                    }
                }
            };
        }
    ]);
