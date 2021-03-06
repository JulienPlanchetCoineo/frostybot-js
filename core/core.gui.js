// GUI Routes

module.exports = {

    // GUI

    '/ui'      : {

        // GUI Content

        'get|/'                          :  'gui:main',             // Main GUI Loader
        'get|/register'                  :  'gui:register',         // Register User
        'get|/login'                     :  'gui:login',            // Login Page
        //'get|/auth_callback'             :  'gui:auth_callback',    // OAuth Login Callback
        'get|/content/:key'             :  'gui:content',           // Get Content

    },

}

