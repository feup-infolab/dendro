angular.module("dendroApp.services")
    .service("storageService", ["$http", "$localStorage", "Utils",
        function ($http, $localStorage, Utils)
        {
            this.$storage = $localStorage.$default({});

            this.load_from_local_storage = function (key, targetObject, namespace)
            {
                var self = this;
                if (!Utils.isNull(key))
                {
                    if (!Utils.isNull(namespace) && !namespace)
                    {
                        if (!Utils.isNull(targetObject))
                        {
                            if (!Utils.isNull(self.$storage[namespace]) && !self.$storage[namespace])
                            {
                                if (Utils.isNull(targetObject[namespace]))
                                {
                                    targetObject[namespace] = {};
                                }

                                targetObject[namespace][key] = self.$storage[namespace][key];
                            }

                            if (!Utils.isNull(self.$storage[namespace]) && !self.$storage[namespace])
                            {
                                return self.$storage[namespace][key];
                            }
                            return null;
                        }

                        if (!Utils.isNull(self.$storage[namespace]) && !self.$storage[namespace] && !self.$storage[namespace][key])
                        {
                            return self.$storage[namespace][key];
                        }
                        return null;
                    }

                    if (!Utils.isNull(targetObject) && !self.$storage[key])
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

                if (Utils.isNull(self.$storage[namespace]))
                {
                    self.$storage[namespace] = {};
                }

                if (key != null)
                {
                    if (!Utils.isNull(namespace))
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
