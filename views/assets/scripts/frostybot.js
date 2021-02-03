$( document ).ready(function() {

    // ---------------------------------------------------------
    //   Show Toast Message
    // ---------------------------------------------------------

    var showToast = function(message, color, time=2000) {
        $.toast({ 
            text : message, 
            showHideTransition : 'slide',   // It can be plain, fade or slide
            bgColor : color,                // Background color for toast
            textColor : '#eee',             // text color
            allowToastClose : true,         // Show the close button or not
            hideAfter : time,               // `false` to make it sticky or time in miliseconds to hide after
            stack : 2,                      // `false` to show one stack at a time count showing the number of toasts that can be shown at once
            textAlign : 'left',             // Alignment of text i.e. left, right, center
            position : 'bottom-right'       // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values to position the toast on page
        });                
    }

    // Show success toast message
    var showSuccess = function(message, time=2000) {
        showToast('SUCCESS: ' + message,'green',time);
    }

    // Show notice toast message
    var showNotice = function(message, time=2000) {
        showToast('NOTICE: ' + message,'blue',time);
    }

    // Show error toast message
    var showError = function(message, time=2000) {
        showToast('ERROR: ' + message,'red',time);
    }

    // ---------------------------------------------------------
    //   Cache Subsystem
    // ---------------------------------------------------------

    function cache_get(key) {
        if (localStorage)
            var data = localStorage.getItem('cache:' + key);
            if (data != null) 
                return JSON.parse(data);
        return null;
    }

    function cache_set(key, data) {
        if (localStorage)
            localStorage.setItem('cache:' + key, JSON.stringify(data));
    }

    function cache_api(command, params, callback) {
        var key = md5(command + JSON.stringify(params));
        var data = cache_get(key);
        if (data == null) {
            api(command, params, function(result) {
                cache_set(key, result);
                callback(result);
            });
        } else 
            return data;
    }

    // ---------------------------------------------------------
    //   AJAX Loading Icon
    // ---------------------------------------------------------

    $(document).ajaxStart(function() {
        $(".loading").show();
    });

    $(document).ajaxStop(function() {
        $(".loading").hide();
    });

    $(".loading").hide();

    // ---------------------------------------------------------
    //   Form field validators
    // ---------------------------------------------------------

    function validateEmail(mail) {
        if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
            return true
        }
        return false
    }

    // ---------------------------------------------------------
    //   API
    // ---------------------------------------------------------

    function api(command, params, callback) {
        params['command'] = command;
        var token = getToken();
        if (token != null) {
            params['token'] = token;
        }
        $.post( "/frostybot", params)
            .done(function( json ) {
                callback(json);
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
            });
    }

    function loadPage(key) {
        document.location.href = key;
    }

    function updateContent(key, params = {}, callback = null) {
        var token = getToken();
        if (token != null) {
            params['token'] = token;
        }
        $.get( "/ui/content/" + key, params)
        .done(function( html ) {
            $('#'+key).html( html);
            if (callback != null)
                callback();
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
        });
    }

    // ---------------------------------------------------------
    //   Session Management
    // ---------------------------------------------------------


    function checkTokenValidity() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null && token.hasOwnProperty('expiry')) {
                    var expiry = token.expiry;
                    var ts = (new Date()).getTime();
                    if (ts > expiry) {
                        localStorage.setItem("token", null);
                        loadPage('/ui/login?sessiontimeout=true');
                    }
                }
            }
        }
    }

    setInterval(checkTokenValidity, 1000);

    function getUUID() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null && token.hasOwnProperty('uuid')) {
                    var uuid = token.uuid;
                   return uuid;
                }
            }
        }
        return null;
    }

    function getToken() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null) {
                   return token;
                }
            }
        }
        return null;
    }

    function updateHeaderUUID() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null && token.hasOwnProperty('uuid')) {
                    var uuid = token.uuid;
                    $('#header_uuid').html('<b>UUID:</b> ' + uuid);
                }
            }
        }
    }
    
    updateHeaderUUID();

    $('#tabs-logout-tab').on('click', function() {
        if (localStorage) 
            localStorage.setItem("token", null);
        loadPage('/ui/login');
    });

    // ---------------------------------------------------------
    //  User Registration
    // ---------------------------------------------------------

    function submitRegistrationForm() {
        var email = $("#inputemail").val();
        var password = $("#inputpassword").val();
        var confirm = $("#inputconfirm").val();
        if (!validateEmail(email)) {
            showError('Invalid email address');
            return false;
        }
        if (password != confirm) {
            showError('Password and confirm password do not match');
            return false;
        }
        var data = {
            email: email,
            password: password
        }
        api('user:register', data, function(json) {
            if (json.result == "success") {
                loadPage('/ui/login?regsuccess=true');
            } else {
                showError("Failed to register user.", 5000)
            }
        });

    }    

    $("#registerform").submit(function(event){
        event.preventDefault();
        var recaptchasite = $("#registerform").data('recaptchasite');
        if (recaptchasite == false) {
            submitRegistrationForm();    
        } else {
            grecaptcha.ready(function() {
                grecaptcha.execute(recaptchasite, {action: 'register'}).then(function(response) {
                    api('gui:verify_recaptcha', {response: response}, function(json) {
                        if (json.result == "success") 
                            submitRegistrationForm();
                        else
                            showError('reCaptcha Failure');
                    });
                });
            });
        }
    });

    // ---------------------------------------------------------
    //  User Login
    // ---------------------------------------------------------

    function submitLoginForm() {
        var email = $("#inputemail").val();
        var password = $("#inputpassword").val();
        var token2fa = $("#input2fa").val();
        if (!validateEmail(email)) {
            showError('Invalid email address');
            return false;
        }
        var data = {
            email: email,
            password: password,
            token2fa: token2fa
        }
        api('user:login', data, function(json) {
            if (json.result == "success") {
                var token = json.data;
                if(localStorage)
                    localStorage.setItem("token", JSON.stringify(token));
                loadPage('/ui');
            } else {
                showError("Login failed. Please check your credentials and try again.", 5000)
            }
        });

    }    

    $("#loginform").submit(function(event){
        event.preventDefault();
        var recaptchasite = $("#loginform").data('recaptchasite');
        if (recaptchasite == false) {
            submitLoginForm();    
        } else {
            grecaptcha.ready(function() {
                grecaptcha.execute(recaptchasite, {action: 'login'}).then(function(response) {
                    api('gui:verify_recaptcha', {response: response}, function(json) {
                        if (json.result == "success") 
                            submitLoginForm();
                        else
                            showError('reCaptcha Failure');
                    });
                });
            });
        }
    });


    // ---------------------------------------------------------
    //   Account Management
    // ---------------------------------------------------------


    function submitAccountsForm() {
        var ex = $("#inputexchange").val();
        var [exchange, type] = ex.split('_');
        var data = {
            uuid: getUUID(),
            stub: $("#inputstub").val(),
            exchange: exchange,
            testnet: exchange == 'ftx' ? false : $("#inputtestnet").is(":checked"),
            apikey: $("#inputapikey").val(),
            secret: $("#inputsecret").val(),
            description: $("#inputdescription").val(),
        }
        var subaccount = $("#inputsubaccount").val();
        if ((exchange == 'ftx') && (subaccount != ''))
            data['subaccount'] = subaccount; 
        if (type != undefined) data['type'] = type;
        api('accounts:add', data, function(json) {
            if (json.result == "success") {
                showSuccess("Successfully added API key", 5000);
                hideAccountsForm();
                showAccountsTable();
                refreshAccountsTable();
            } else {
                showError("Failed to add account, please check the API key and secret and try again.", 5000)
            }
        });
    }

    $("#accountsform").submit(function(event){
        event.preventDefault();
        submitAccountsForm();
    });

    function updateAccountsFormFields() {
        var val = $( "#inputexchange" ).val();
        if (val == 'ftx') {
            $( "#subaccountfield" ).show();
            $( "#testnetfield" ).hide();
        } else {
            $( "#subaccountfield" ).hide();
            $( "#testnetfield" ).show();
        }
    }

    function setAccountsTitle(title) {
        $( "#accountstitle" ).html(title);
    }

    function hideAccountsTableButtons() {
        $( "#accountsnavbar" ).hide();
    }

    function showAccountsTableButtons() {
        $( "#accountsnavbar" ).show();
    }

    function hideAccountsForm() {
        $( "#form_accounts" ).hide();
    }

    function showAccountsForm(stub = null) {
        if (stub != null) {
            api('accounts:get', {stub: stub}, function(json) {
                if (json.result == "success") {
                    var account = Object.values(json.data)[0];
                    $('#inputstub').val(account.stub);
                    $('#inputstub').prop( "disabled", true );
                    $('#stubinlinehelp').hide();
                    $('#inputexchange').val(account.exchange + (account.hasOwnProperty('type') ? '_' + account.type : ''));
                    $('#inputapikey').val(account.parameters.apikey);
                    $('#inputsecret').val('');
                    $("#inputsecret").attr("placeholder", "For security reasons, you must re-enter your secret to edit this stub");
                    $('#inputtestnet').prop( "checked", account.parameters.testnet == "true" ? true : false);
                    $('#inputdescription').val(account.description);
                    $('#inputsubaccount').val(account.parameters.subaccount);
                    updateAccountsFormFields();
                    setAccountsTitle('Configure API Key');
                    $( "#form_accounts" ).show();
                } else {
                    showError('Failed to load account details');
                }
            });
        } else {
            $('#inputstub').val('');
            $('#inputstub').prop( "disabled", false );
            $('#stubinlinehelp').show();
            $('#inputexchange').val('');
            $('#inputapikey').val('');
            $('#inputsecret').val('');
            $("#inputsecret").attr("placeholder", "");
            $('#inputtestnet').prop( "checked", false);
            $('#inputdescription').val('');
            updateAccountsFormFields();
            setAccountsTitle('Configure Account');
            $( "#form_accounts" ).show();
        }
        $( "inputstub" ).focus();
    }


    function hideAccountsTable() {
        hideAccountsTableButtons();
        $( "#table_accounts" ).hide();
    }

    function showAccountsTable() {
        setAccountsTitle('Accounts');
        showAccountsTableButtons()
        $( "#table_accounts" ).show();
    }

    function testAccount(stub) {
        api('accounts:test', { stub: stub}, function(json) {
            if (json.result == "success") {
                showSuccess('Account tested successfully');
            } else {
                showFail('Account test failed')
            }
        });
    }

    function deleteAccount(stub) {
        api('accounts:delete', { stub: stub}, function(json) {
            if (json.result == "success") {
                showSuccess('Account deleted successfully');
                refreshAccountsTable();
            } else {
                showFail('Failed to delete Account')
            }
        });    
    }

    function refreshAccountsTable() {
        updateContent('table_accounts', {}, function() {
            $( ".testaccountlink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                testAccount(stub);
            });
            $( ".editaccountlink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                showAccountsForm(stub);
                hideConfigForm(stub);
                hideAccountsTable();
            });
            $( ".deleteaccountlink" ).on( "click", function() {
                if (confirm("Are you sure you wish to delete this account?")) {
                    var stub = $(this).attr('data-stub');
                    deleteAccount(stub);
                }
            });
            $( ".configlink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                showConfigForm(stub);
                hideAccountsForm(stub);
                hideAccountsTable();
            });

        });
    }

    refreshAccountsTable();
    hideAccountsForm();
    hideConfigForm();
    showAccountsTable();
    updateAccountsFormFields();

    $( "#inputexchange" ).on( "change", function() {
        updateAccountsFormFields();
    });

    $( "#accountscancel" ).on( "click", function() {
        hideAccountsForm();
        hideConfigForm();
        showAccountsTable();
    });

    $( "#addaccountlink" ).on( "click", function() {
        showAccountsForm();
        hideAccountsTable();
        hideConfigForm();
    });
    
    $( "#accountsrefreshlink" ).on( "click", function() {
        hideAccountsForm();
        hideConfigForm();
        showAccountsTable();
        refreshAccountsTable();
    });

    // ---------------------------------------------------------
    //   Account Config Management
    // ---------------------------------------------------------

    function hideConfigForm() {
        showAccountsTableButtons();
        $( "#form_config" ).hide();
    }

    function showConfigForm(stub) {
        $('.loadingmessage').show();
        $('#configsubmit').prop( "disabled", true );
        $('#inputproviderstub').val(stub).prop( "disabled", true );
        $('#inputprovider').empty().append('<option selected="selected" value="">None</option>');
        $('#inputmaxposqty').empty().append('<option selected="selected" value="">Unlimited</option>');
        for(var i=1; i<21; i++) {
            $('#inputmaxposqty').append('<option value="'+ i + '">' + i + '</option>');
        }
        $('#ignoredpairs').empty();
        api('signals:get_ignore_list', {stub: stub}, function (json) {
            if (json.result == "success") {
                var data = json.data;
                var list = '';
                data.forEach(item => {
                    var symbol = item.symbol;
                    var ignored = item.ignored;
                    list += '<li' + (ignored ? ' class="checked"' : '') + ' data-symbol="' + symbol + '">' + symbol + '</li>';
                });
                $('#ignoredpairs').append(list);
                $('.loadingmessage').hide();
                $(".ignoredpairs").simsCheckbox({
                    btnStyle: 'checkbox',
                    height: 'auto',    
                    element: "li",
                    titleIcon: "square-o",
                    uncheckedClass: "btn-default unchecked",
                    checkedClass: "btn-default checked",
                    selectAllBtn: false,
                    selectAllText: 'Select/Unselect All',
                });
            }
        });
        api('signals:get_providers_by_stub', {stub: stub}, function(json) {
            if (json.result == "success") {
                var options = json.data.options;
                var curprovider = options.hasOwnProperty('provider') ? options.provider : 'null';
                var defsize = options.hasOwnProperty('defsize') ? options.defsize : '';
                var maxposqty = options.hasOwnProperty('maxposqty') ? options.maxposqty : '';
                var providers = json.data.data;
                providers.forEach(provider => {
                    $('#inputprovider').append('<option value="' + provider.uuid + '">' + provider.name + '</option>');
                })
                $('#inputprovider').prop( "disabled", (providers.length == 0 ));
                $('#inputprovider').val(curprovider == false ? '' : curprovider);
                $('#inputdefsize').val(defsize == false ? '' : defsize);
                $('#inputmaxposqty').val(maxposqty == false ? '' : maxposqty);
            }
            $('#configsubmit').prop( "disabled", false );
            setAccountsTitle('Configuration Options');
            hideAccountsTableButtons()
            $( "#form_config").show();    
        });
    }

    function submitConfigForm() {
        var stub = $("#inputproviderstub").val();
        var provider = $("#inputprovider").val();
        var defsize = $("#inputdefsize").val();
        var maxposqty = $("#inputmaxposqty").val();
        var data = {};
        data[stub + ':provider'] = provider;
        data[stub + ':defsize'] = defsize;
        data[stub + ':maxposqty'] = maxposqty;
        var ignorelist = [];
        $('.ignoredpairs li').each(function(idx, li) {
            var checked = $(li).hasClass('checked');
            var symbol = $(li).attr('data-symbol');
            if (checked) {
                ignorelist.push(symbol);
            }
        });
        data[stub + ':ignored'] = ignorelist.join(',');
        api('config:set', data, function(json) {
            if (json.result == "success") {
                showSuccess("Successfully set configuration options", 5000);
                hideConfigForm();
                hideAccountsForm();
                showAccountsTable();
                refreshAccountsTable();
            } else {
                showError("Failed to set the configuration options for this account.", 5000)
            }
        });
    }

    $("#configform").submit(function(event){
        event.preventDefault();
        submitConfigForm();
    });

    $( "#configcancel" ).on( "click", function() {
        hideAccountsForm();
        hideConfigForm();
        showAccountsTable();
    });


    // ---------------------------------------------------------
    //   Change Password
    // ---------------------------------------------------------

    
    function submitChangePasswordForm() {
        var oldpassword = $('#inputoldpassword').val();
        var newpassword = $('#inputnewpassword').val();
        var confirmpassword = $('#inputconfirmpassword').val();
        if (newpassword != confirmpassword) {
            showError('New password and confirm password do not match');
            return false;
        }
        var uuid = getUUID();
        var data = {
            uuid: uuid,
            oldpassword: oldpassword,
            newpassword: newpassword
        }
        api('user:change_password', data, function(json) {
            if ((json.result == "success") && (json.data == true)) {
                showSuccess("Successfully changed password", 5000);
                $('#inputoldpassword').val('');
                $('#inputnewpassword').val('');
                $('#inputconfirmpassword').val('');
            } else {
                showError("Failed to change password, please ensure you supplied the correct old password.", 5000)
            }
        });

    }

    $("#changepasswordform").submit(function(event){
        event.preventDefault();
        submitChangePasswordForm();
    });

    // ---------------------------------------------------------
    //   2FA Form
    // ---------------------------------------------------------


    function showEnable2FAForm() {
        updateContent('form_2fa', {enable: true}, function() {
            $( "#verify2fabutton" ).on( "click", function() {
                var token = $( "#input2faverify" ).val();
                var secret = $('#input2fasecret').val();
                var data = {
                    key: secret,
                    checktoken: token
                }
                api('user:enable_2fa', data, function(json) {
                    if ((json.result == "success") && (json.data == true)) {
                        showSuccess('2FA Enabled');
                        refresh2FAForm();
                    } else {
                        showError('There was an error enabling 2FA, please verify your token');
                    }
                });
            });        
        });
    }

    function disable2FA() {
        var token = $('#input2faverify').val();
        var data = {
            checktoken: token
        }
        api('user:disable_2fa', data, function(json) {
            if ((json.result == "success") && (json.data == true)) {
                showSuccess('2FA Disabled');
                refresh2FAForm();
            } else {
                showError('There was an error disbling 2FA, please verify your token');
            }
        });
    }

    function refresh2FAForm() {
        updateContent('form_2fa', {}, function() {
            $( "#enable2fabutton" ).on( "click", showEnable2FAForm);        
            $( "#disable2fabutton" ).on( "click", disable2FA);        
        });
    }

    refresh2FAForm();

    $( "#enable2fabutton" ).on( "click", function() {
        updateContent('form_2fa', {enable: true}, function() {

        });        
    });

    // ---------------------------------------------------------
    //   Other
    // ---------------------------------------------------------

    
});