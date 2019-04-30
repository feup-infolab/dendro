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

                            if (self.$storage[namespace] != null)
                            {
                                return self.$storage[namespace][key];
                            }
                            return null;
                        }

                        if (self.$storage[namespace] != null)
                        {
                            return self.$storage[namespace][key];
                        }
                        return null;
                    }

                    if (targetObject != null)
                    {
                        targetObject[key] = self.$storage[key];
                        return self.$storage[key];
                    }

                    return self.$storage[key];
                }

                return null;
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
                    if (!!namespace === true)
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
