const loadRoutes = function (app, callback)
{
    // Handle 404
    app.use(function (req, res)
    {
        let acceptsHTML = req.accepts("html");
        const acceptsJSON = req.accepts("json");
        if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
        {
            res.status(404).json(
                {
                    result: "error",
                    message: "Page not found"
                }
            );
        }
        else
        {
            res.status(404).render("errors/404",
                {
                    title: "Page not Found"
                }
            );
        }
    });

    // Handle 405
    app.use(function (req, res)
    {
        let acceptsHTML = req.accepts("html");
        const acceptsJSON = req.accepts("json");
        if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
        {
            res.status(405).json(
                {
                    result: "error",
                    message: "Method Not Supported"
                }
            );
        }
        else
        {
            res.status(405).render("errors/404",
                {
                    title: "Method Not Supported"
                }
            );
        }
    });

    // Handle 500
    app.use(function (error, req, res, next)
    {
        let acceptsHTML = req.accepts("html");
        const acceptsJSON = req.accepts("json");
        console.error(error.stack);

        if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
        {
            res.status(500).json(
                {
                    result: "error",
                    error: error
                }
            );
        }
        else
        {
            res.render("errors/500",
                {
                    title: "Something went wrong",
                    error: error
                }
            );
        }
    });

    callback(null);
};

module.exports.loadRoutes = loadRoutes;
