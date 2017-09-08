const startServer = function(app, server, callback)
{
    server.listen(app.get('port'), function ()
    {
        console.log('Express server listening on port ' + app.get('port'));

        callback(null);
    });
};

module.exports.startServer = startServer;