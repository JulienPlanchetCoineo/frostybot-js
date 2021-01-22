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
    //   REST API Calls
    // ---------------------------------------------------------

    function api(command, params, callback) {
        params['command'] = command;
        console.log(params);
        $.post( "/frostybot", params)
            .done(function( json ) {
                callback(json);
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                console.log( "Request Failed: " + err );
            });
    }

    function updateContent(key, params = {}, callback = null) {
        var uuid = (localStorage) ? localStorage.getItem("uuid") : null;
        $.get( "/ui/content/" + uuid + "/" + key, params)
            .done(function( html ) {
                $('#'+key).html( html);
                if (callback != null)
                    callback();
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                console.log( "Request Failed: " + err );
            });
    }


    // Create/Update API Keys

    function submitApiKeysForm() {
        var uuid = (localStorage) ? localStorage.getItem("uuid") : null;
        var ex = $("#inputexchange").val();
        var [exchange, type] = ex.split('_');
        var data = {
            uuid: (localStorage) ? localStorage.getItem("uuid") : null,
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
                hideApiKeyForm();
                showApiKeyTable();
                refreshApiKeyTable();
            } else {
                showError("Failed to add account, please check the API key and secret and try again.", 5000)
            }
        });
    }

    $("#apikeysform").submit(function(event){
        event.preventDefault();
        submitApiKeysForm();
    });

    // ---------------------------------------------------------
    //   API Key Form automation
    // ---------------------------------------------------------

    function updateApiKeyFormFields() {
        var val = $( "#inputexchange" ).val();
        if (val == 'ftx') {
            $( "#subaccountfield" ).show();
            $( "#testnetfield" ).hide();
        } else {
            $( "#subaccountfield" ).hide();
            $( "#testnetfield" ).show();
        }
    }

    function setApiKeyTitle(title) {
        $( "#apikeystitle" ).html(title);
    }

    function hideApiKeyTableButtons() {
        $( "#apikeysnavbar" ).hide();
    }

    function showApiKeyTableButtons() {
        $( "#apikeysnavbar" ).show();
    }

    function hideApiKeyForm() {
        $( "#form_apikeys" ).hide();
    }

    function showApiKeyForm(stub = null) {
        if (stub != null) {
            api('accounts:get', {stub: stub}, function(json) {
                if (json.result == "success") {
                    var account = Object.values(json.data)[0];
                    $('#inputstub').val(account.stub);
                    $('#inputexchange').val(account.exchange + (account.hasOwnProperty('type') ? '_' + account.type : ''));
                    $('#inputapikey').val(account.parameters.apikey);
                    $('#inputsecret').val('');
                    $('#inputtestnet').prop( "checked", account.parameters.testnet == "true" ? true : false);
                    $('#inputdescription').val(account.description);
                    $('#inputsubaccount').val(account.parameters.subaccount);
                    updateApiKeyFormFields();
                    setApiKeyTitle('Configure API Key');
                    $( "#form_apikeys" ).show();
                } else {
                    showError('Failed to load account details');
                }
            });
        } else {
            $('#inputstub').val('');
            $('#inputexchange').val('');
            $('#inputapikey').val('');
            $('#inputsecret').val('');
            $('#inputtestnet').prop( "checked", false);
            $('#inputdescription').val('');
            updateApiKeyFormFields();
            setApiKeyTitle('Configure API Key');
            $( "#form_apikeys" ).show();
        }
    }

    function hideApiKeyTable() {
        hideApiKeyTableButtons();
        $( "#table_apikeys" ).hide();
    }

    function showApiKeyTable() {
        setApiKeyTitle('API Keys');
        showApiKeyTableButtons()
        $( "#table_apikeys" ).show();
    }

    function testApiKey(stub) {
        api('accounts:test', { stub: stub}, function(json) {
            if (json.result == "success") {
                showSuccess('API Key tested successfully');
            } else {
                showFail('API Key test failed')
            }
        });
    }

    function deleteApiKey(stub) {
        api('accounts:delete', { stub: stub}, function(json) {
            if (json.result == "success") {
                showSuccess('API Key deleted successfully');
                refreshApiKeyTable();
            } else {
                showFail('Failed to delete API key')
            }
        });    
    }

    function refreshApiKeyTable() {
        updateContent('table_apikeys', {}, function() {
            $( ".testapikeylink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                testApiKey(stub);
            });
            $( ".editapikeylink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                showApiKeyForm(stub);
                hideApiKeyTable();
            });
            $( ".deleteapikeylink" ).on( "click", function() {
                if (confirm("Are you sure you wish to delete this API key?")) {
                    var stub = $(this).attr('data-stub');
                    deleteApiKey(stub);
                }
            });
        });
    }

    refreshApiKeyTable();
    hideApiKeyForm();
    showApiKeyTable();
    updateApiKeyFormFields();

    $( "#inputexchange" ).on( "change", function() {
        updateApiKeyFormFields();
    });

    $( "#apiformcancel" ).on( "click", function() {
        hideApiKeyForm();
        showApiKeyTable();
    });

    $( "#addapikeylink" ).on( "click", function() {
        showApiKeyForm();
        hideApiKeyTable();
    });
    
    $( "#apikeyrefreshlink" ).on( "click", function() {
        hideApiKeyForm();
        showApiKeyTable();
        refreshApiKeyTable();
    });
    
});