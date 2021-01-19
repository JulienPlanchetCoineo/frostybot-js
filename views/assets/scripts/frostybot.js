$( document ).ready(function() {

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

    function hideApiKeyForm() {
        $( "#apikeyform" ).hide();
    }

    function showApiKeyForm() {
        $( "#apikeyform" ).show();
    }

    function hideApiKeyTable() {
        $( "#apikeytable" ).hide();
    }

    function showApiKeyTable() {
        $( "#apikeytable" ).show();
    }

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

    $( "#addapikeybutton" ).on( "click", function() {
        showApiKeyForm();
        hideApiKeyTable();
    });


});