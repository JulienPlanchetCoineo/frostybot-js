$( document ).ready(function() {


    // ---------------------------------------------------------
    //   REST API Calls
    // ---------------------------------------------------------

    function updateContent(key, params = {}) {
        var uuid = (localStorage) ? localStorage.getItem("uuid") : null;
        $.get( "/ui/partial/" + uuid + "/" + key, params)
            .done(function( html ) {
                $('#'+key).html( html);
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                console.log( "Request Failed: " + err );
            });
    }


    // Create/Update API Keys

    function submitApiKeysForm() {
        var ex = $("#inputexchange").val();
        var [exchange, type] = ex.split('_');
        var data = {
            uuid: (localStorage) ? localStorage.getItem("uuid") : null,
            stub: $("#inputstub").val(),
            exchange: exchange,
            testnet: exchange == 'ftx' ? false : $("#testnet").is(":checked"),
            apikey: $("#inputapikey").val(),
            secret: $("#inputsecret").val(),
            description: $("#description").val()
        }
        if (type != undefined) data['type'] = type;
        $.ajax({
            type: "POST",
            url: "/rest/accounts",
            data: data,
            success : function(text){
                if (text == "success"){
                    alert('Cool');
                }
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

    function showApiKeyForm() {
        setApiKeyTitle('Configure API Key');
        $( "#form_apikeys" ).show();
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

    updateContent('table_apikeys');
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
        updateContent('table_apikeys');
    });
    
});