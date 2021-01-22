module.exports = {

    // Make an API call
    
    api(command, params, callback) {
        params['command'] = command;
        if (!params.hasOwnProperty('uuid')) {
            var uuid = (localStorage) ? localStorage.getItem("uuid") : null;
            params['uuid'] = uuid;
        }
        $.post( "/frostybot", params)
            .done(function( json ) {
                callback(json);
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
            });
    }


}