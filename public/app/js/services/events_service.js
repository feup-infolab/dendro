angular.module("dendroApp.services")
    .service("eventsService", function ()
    {
        this.debug_mode = true;

        this.events = {
            selected_file_changed: "selected_file_changed",
            metadata_changed: "metadata_changed"
        };

        this.send_event_to_parents = function (scope, event_name, arguments)
        {
            var self = this;
            if (self.debug_mode)
            {
                Logger.log("Sending event " + event_name);
            }

            scope.$emit(event_name, arguments);
        };

        this.send_event_to_children = function (scope, event_name, arguments)
        {
            var self = this;
            if (self.debug_mode)
            {
                Logger.log("Sending event " + event_name);
            }

            scope.$broadcast(event_name, arguments);
        };

        this.register_handler_for_event = function (scope, event_name, handler)
        {
            var self = this;
            function call_handler (handler, event_object, arguments_for_handler)
            {
                if (typeof handler === "function")
                {
                    if (self.debug_mode)
                    {
                        Logger.log("Received event " + event_object.name + ". Calling handler");
                    }

                    handler(event, arguments_for_handler);
                }
                else
                {
                    Logger.log("error","No handler registered for event " + event_object);
                }
            }

            if (self.registered_events == null)
            {
                self.registered_events = {};
            }

            if (self.events[event_name] != null)
            {
                if (self.registered_events[event_name] == null)
                {
                    self.registered_events[event_name] = handler;

                    scope.$on(event_name, async.apply(call_handler, handler));
                }
                else
                {
                    Logger.log("There is already a handler registered for event " + event_name + "!!");
                }
            }
            else
            {
                Logger.log(String("Trying to register an event " + event_name) +
                    "  that is not parametrized. " +
                    "Possible events are " + Object.keys(this.events));
            }
        };

        this.unregister_handler_for_event = function (event_name)
        {
            var self = this;
            if (self.registered_events[event_name] && typeof this.registered_events[event_name] === "function")
            {
                this.registered_events[event_name]();
            }
        };
    });
