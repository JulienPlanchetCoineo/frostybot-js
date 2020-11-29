$ (document).ready (function () {

  // --------------------------------------------------------------------------------------
  //  Frostybot REST and WebSocket URLs
  // --------------------------------------------------------------------------------------

  var frostybot_rest = '../rest';
  var frostybot_wss = new WebSocket("ws://127.0.0.1/websocket")


  // --------------------------------------------------------------------------------------
  //  Toast Messages
  // --------------------------------------------------------------------------------------


  // Show toast message
  var showToast = function(message, color, time=2000) {
    $.toast({ 
          text : message, 
          showHideTransition : 'slide',   // It can be plain, fade or slide
          bgColor : color,                // Background color for toast
          textColor : '#eee',             // text color
          allowToastClose : true,         // Show the close button or not
          hideAfter : time,               // `false` to make it sticky or time in miliseconds to hide after
          stack : 5,                      // `fakse` to show one stack at a time count showing the number of toasts that can be shown at once
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

  // --------------------------------------------------------------------------------------
  //  WebSockets
  // --------------------------------------------------------------------------------------

  frostybot_wss.onopen = function() {
    setInterval(function() {
      frostybot_wss.send("PING");
      //console.log("WSS:PING");
    }, 5000)
  };


  frostybot_wss.onmessage = function (evt) { 
    var msg = evt.data;
    if (msg == "PONG") {
      console.log("WSS:" + msg);
    } else {
      var msg = JSON.parse(msg);
      if (msg.message_type == 'log') {
        updateLogGrid(msg);
      }
      if (msg.message_type == 'order') {
        var message = msg.symbol + ' ' + msg.direction + ' ' + msg.size_base 
        showSuccess(message);
      }
    }
  };

  frostybot_wss.onclose = function() { 
    console.log("Websocket connection is closed..."); 
  };
  

  function subscribe(stub, channel, symbol = null) {
    if (symbol != null) {
      var data = { symbol : symbol };
    } else {
      var data = {};
    }
    $.post(frostybot_rest + '/websocket/' + stub + '/subscribe/' + channel, data, function( data ) {
      //$( ".result" ).html( data );
    });  
  }
  
  // --------------------------------------------------------------------------------------
  //  Master Layout
  // --------------------------------------------------------------------------------------

  var masterLayoutLoaded = false;

  var layout = [{
      type: 'layoutGroup',
      orientation: 'horizontal',
      items: [
        {
          type: 'documentGroup',
          width: '25%',
          items: [
            {
              type: 'documentPanel',
              title: 'Long/Short',
              contentContainer: 'longshortOrder'
            }, 
            {
              type: 'documentPanel',
              title: 'Buy/Sell',
              contentContainer: 'buysellOrder'
            }, 
            {
              type: 'documentPanel',
              title: 'SL/TP/TS',
              contentContainer: 'sltptsOrder'
            },
            {
              type: 'documentPanel',
              title: 'Close',
              contentContainer: 'closeOrder'
            }, 
          ]
        },
        {
          type: 'layoutGroup',
          orientation: 'vertical',
          width: '55%',
          items: [
            {
              type: 'documentGroup',
              height: '60%',
              minHeight: '25%',
              items: [{
                  type: 'documentPanel',
                  title: 'Chart',
                  contentContainer: 'chartPanel'
              }, {
                  type: 'documentPanel',
                  title: 'Reports',
                  contentContainer: 'reportsPanel'
              }]
            }, {
              type: 'documentGroup',
              height: '40%',
              pinnedHeight: '10%',
              items: [
                {
                    type: 'documentPanel',
                    title: 'Positions',
                    contentContainer: 'positionsPanel',
                    selected: true
                }, 
                {
                    type: 'documentPanel',
                    title: 'Orders',
                    contentContainer: 'ordersPanel',
                }, 
                {
                    type: 'documentPanel',
                    title: 'Log',
                    contentContainer: 'logPanel',
                }, 
              ]
            }
          ]
        }, 
        {
          type: 'layoutGroup',
          orientation: 'vertical',
          width: '20%',
          items: [
            {
              type: 'documentGroup',
              height: '27%',
              minHeight: '27%',
              items: [
                {
                  type: 'documentPanel',
                  title: 'Account',
                  contentContainer: 'stubPanel'
                },
              ]
            }, 
            {
              type: 'documentGroup',
              height: '20%',
              minHeight: '20%',
              items: [
                {
                  type: 'documentPanel',
                  title: 'Balances',
                  contentContainer: 'balancesPanel'
                },
              ]
            }, 
            {
              type: 'documentGroup',
              height: '53%',
              allowPin: false,  
              items: [
                {
                  type: 'documentPanel',
                  title: 'Markets',
                  contentContainer: 'symbolsPanel'
                }
              ]
            },
          ]
        }
      ]
  }];

  $('#masterLayout').jqxLayout({ width: '100%', height: '100%', theme: 'dark', layout: layout });

  $('#masterLayout').on('resize', function (event) {
    setTimeout(function() {
      resizePanels();
    }, 1000);
  });

  masterLayoutLoaded = true;
  
  function resizePanels() {
    $('.noscroll').parent().css('overflow','hidden');
  }

  $(window).on('resize', function() {
    setTimeout(function() {
      resizePanels();
    }, 1000);
  });

  setInterval(function() {
    resizePanels();
  }, 5000);

  // --------------------------------------------------------------------------------------
  //  Supported Exchanges
  // --------------------------------------------------------------------------------------

  var exchangessource = {
    datatype: 'json',
    datafields: [
      {name: 'exchange', type: 'string'},
      {name: 'description', type: 'string'},
    ],
    localdata: [
      {
        exchange: 'binance_spot',
        description: 'Binance Spot',
        shortform: 'Binance (S)',
        hastestnet: true,
        hassubaccount: false,
        params: {exchange: 'binance', type: 'spot'},
        defaultsymbol: 'BTC/USDT',
      },
      {
        exchange: 'binance_futures',
        description: 'Binance Futures',
        shortform: 'Binance (F)',
        hastestnet: true,
        hassubaccount: false,
        params: {exchange: 'binance', type: 'future'},
        defaultsymbol: 'BTCUSDT',
      },
      {
        exchange: 'bitmex',
        description: 'Bitmex',
        shortform: 'Bitmex',
        hastestnet: true,
        hassubaccount: false,
        params: {exchange: 'bitmex'},
        defaultsymbol: 'BTC/USD',
      },
      {
        exchange: 'deribit',
        description: 'Deribit',
        shortform: 'Deribit',
        hastestnet: true,
        hassubaccount: false,
        params: {exchange: 'deribit'},
        defaultsymbol: 'BTC-PERPETUAL',
      },
      {
        exchange: 'ftx',
        description: 'FTX',
        shortform: 'FTX',
        hastestnet: false,
        hassubaccount: true,
        params: {exchange: 'ftx'},
        defaultsymbol: 'BTC-PERP',
      },
    ],
  };

  var exchangesadapter = new $.jqx.dataAdapter (exchangessource);

  function getExchangeInfo (exchange) {
    var result = null;
    Object.values (
      exchangessource.localdata
    ).forEach (exchangeraw => {
      if (exchangeraw.exchange == exchange) {
        result = exchangeraw;
      }
    });
    return result;
  }

  // --------------------------------------------------------------------------------------
  //  Account Stub Selector Grid
  // --------------------------------------------------------------------------------------

  var selectedStub = null;

  var stubSelectorSource = {
    localdata: [],
    datafields: [
      {name: 'stub', type: 'string'},
      {name: 'exchange', type: 'string'},
      {name: 'description', type: 'string'},
      {name: 'defaultsymbol', type: 'string'},
    ],
    datatype: 'json',
  };

  var stubSelectorAdapter = new $.jqx.dataAdapter (stubSelectorSource);

  function clearStubSelectorGrid () {
    stubSelectorSource.localdata = [];
    $ ('#stubSelectorGrid').jqxGrid ('updatebounddata', 'cells');
  }

  function updateStubSelectorGrid () {
    clearStubSelectorGrid ();
    $ ('#stubSelectorGrid').jqxGrid ('showloadelement');
    $.ajax ({
      //async: false,
      type: 'GET',
      url: frostybot_rest + '/accounts',
    }).done (function (results) {
      if (results.result == 'success') {
        var stubsraw = results.data;
        var stubs = [];
        Object.entries (stubsraw).forEach (([key, stubraw]) => {
          var stub = stubraw;
          stub.stub = key;
          if (stubraw.type != undefined) {
            stubraw.exchange = stubraw.exchange + '_' + stubraw.type;
          }
          var exchangeinfo = getExchangeInfo (stubraw.exchange);
          stub.exchange = exchangeinfo.shortform;
          stub.subaccount = stubraw.parameters.hasOwnProperty ('subaccount')
            ? stubraw.parameters.subaccount
            : '';
          stub.testnet = stubraw.parameters.hasOwnProperty ('testnet')
            ? stubraw.parameters.testnet == 'true' ? true : false
            : false;
          stub.testnet_short = stubraw.parameters.hasOwnProperty ('testnet')
            ? stubraw.parameters.testnet == 'true' ? 'Yes' : 'No'
            : 'No';
          stub.defaultsymbol = exchangeinfo.defaultsymbol;
          stubs.push (stub);
        });
        stubSelectorSource.localdata = stubs;
        $('#stubSelectorGrid').jqxGrid ('updatebounddata', 'cells');
        $('#stubSelectorGrid').jqxGrid ('sortby', 'stub', 'asc');
        $('#stubSelectorGrid').jqxGrid ('hideloadelement');
        $('#stubSelectorGrid').jqxGrid('selectrow', 0);
      }
    });
  }

  $ ('#stubSelectorGrid').jqxGrid ({
    width: '100%',
    height: 200,
    source: stubSelectorAdapter,
    columnsresize: true,
    columnsheight: 20,
    rowsheight: 20,
    theme: 'dark',
    columns: [
      {text: 'Stub', datafield: 'stub', width: '50%'},
      //{text: 'Description', datafield: 'description'},
      {text: 'Exchange', datafield: 'exchange', width: '50%' },
    ],
  });

  $ ('#stubSelectorGrid').on ('rowselect', function (event) {
    var args = event.args;
    var rowData = args.row;
    selectedStub = rowData.stub;
    subscribe(selectedStub, 'orders');
    updateBalancesGrid(rowData);
    updateSymbolSelectorGrid(rowData);
    updatePositionsGrid(rowData);
    getSelectedStub();
  });

  updateStubSelectorGrid();

  function getSelectedStub() {
    return selectedStub
  }

  // --------------------------------------------------------------------------------------
  //  Balances Grid
  // --------------------------------------------------------------------------------------

  var balancesSource = {
    localdata: [],
    datafields: [
      {name: 'currency', type: 'string'},
      {name: 'free', type: 'float'},
      {name: 'used', type: 'float'},
      {name: 'total', type: 'float'},
    ],
    datatype: 'json',
  };

  var balancesAdapter = new $.jqx.dataAdapter (balancesSource);

  function clearBalancesGrid () {
    balancesSource.localdata = [];
    $ ('#balancesGrid').jqxGrid ('updatebounddata', 'cells');
  }

  function updateBalancesGrid () {
    clearBalancesGrid ();
    $ ('#balancesGrid').jqxGrid ('showloadelement');
    $.ajax ({
      //async: false,
      type: 'GET',
      url: frostybot_rest + '/trade/' + getSelectedStub() + '/balances',
    }).done (function (results) {
      if (results.result == 'success') {
        var balancesraw = results.data;
        var balances = [];
        balancesraw.forEach(balanceraw => {
          var balance = {}
          balance.currency = balanceraw.currency;
          balance.free = balanceraw.base.free;
          balance.used = balanceraw.base.used;
          balance.total = balanceraw.base.total;
          balances.push (balance);
        });
        balancesSource.localdata = balances;
        $('#balancesGrid').jqxGrid ('updatebounddata', 'cells');
        $('#balancesGrid').jqxGrid ('sortby', 'currency', 'asc');
        $('#balancesGrid').jqxGrid ('hideloadelement');
        resizePanels();
      }
    });
  }

  $ ('#balancesGrid').jqxGrid ({
    width: '100%',
    height: '100%',
    source: balancesAdapter,
    columnsresize: true,
    columnsheight: 20,
    rowsheight: 20,
    theme: 'dark',
    columns: [
      {text: 'Asset', datafield: 'currency', width: '70px'},
      {text: 'Total', datafield: 'total', width: '100px'},
      {text: 'Available', datafield: 'free', width: '100px'},
    ],
  });

  $('#balancesGrid').on('rowselect', function (event) {
    $('#balancesGrid').jqxGrid('clearselection');
  });

  // --------------------------------------------------------------------------------------
  //  Market Symbol Selector Grid
  // --------------------------------------------------------------------------------------

  var selectedSymbol = null;
  var selectedMarket = null;

  var symbolSelectorSource = {
    localdata: [],
    datafields: [
      {name: 'symbol', type: 'string'},
      {name: 'tvsymbol', type: 'string'},
      {name: 'base', type: 'string'},
      {name: 'quote', type: 'string'},
      {name: 'bid', type: 'float'},
      {name: 'ask', type: 'float'},
    ],
    datatype: 'json',
  };

  var symbolSelectorAdapter = new $.jqx.dataAdapter (symbolSelectorSource);

  function clearSymbolSelectorGrid () {
    symbolSelectorSource.localdata = [];
    $ ('#symbolSelectorGrid').jqxGrid ('updatebounddata', 'cells');
  }

  function updateSymbolSelectorGrid (selected) {
    clearSymbolSelectorGrid ();
    $ ('#symbolSelectorGrid').jqxGrid ('showloadelement');
    $.ajax ({
      //async: false,
      type: 'GET',
      url: frostybot_rest + '/trade/' + selected.stub + '/markets',
    }).done (function (results) {
      if (results.result == 'success') {
        var marketsraw = results.data;
        var markets = [];
        marketsraw.forEach(marketraw => {
          var market = {}
          market.symbol = marketraw.symbol;
          market.tvsymbol = marketraw.hasOwnProperty('tvsymbol') ? marketraw.tvsymbol : null;
          market.base = marketraw.base;
          market.quote = marketraw.quote;
          market.bid = marketraw.bid;
          market.ask = marketraw.ask;
          markets.push (market);
        });
        symbolSelectorSource.localdata = markets;
        $('#symbolSelectorGrid').jqxGrid ('updatebounddata', 'cells');
        $('#symbolSelectorGrid').jqxGrid ('sortby', 'symbol', 'asc');
        $('#symbolSelectorGrid').jqxGrid ('hideloadelement');
        var defaultIndex = getSymbolRowIndex(selected.defaultsymbol)
        var boundIndex = $('#symbolSelectorGrid').jqxGrid('getrowboundindex', defaultIndex);
        $('#symbolSelectorGrid').jqxGrid('selectrow', boundIndex);
        $('#symbolSelectorGrid').jqxGrid('ensurerowvisible', defaultIndex + 10);
        resizePanels();
      }
    });
  }

  // Get grid row index for symbol
  var getSymbolRowIndex = function(symbol) {
      var rows = $('#symbolSelectorGrid').jqxGrid('getrows');
      return rows.map(function(e) { return e.symbol; }).indexOf(symbol);
  }

  $ ('#symbolSelectorGrid').jqxGrid ({
    width: '100%',
    height: '100%',
    source: symbolSelectorAdapter,
    columnsresize: true,
    columnsheight: 20,
    rowsheight: 20,
    theme: 'dark',
    columns: [
      {text: 'Symbol', datafield: 'symbol'},
      {text: 'Bid', datafield: 'bid', width: '25%'},
      {text: 'Ask', datafield: 'ask', width: '25%'},
    ],
  });

  $ ('#symbolSelectorGrid').on ('rowselect', function (event) {
    var args = event.args;
    var rowBoundIndex = args.rowindex;
    var rowData = args.row;
    selectedSymbol = rowData.symbol;
    selectedMarket = rowData;
    if (rowData.tvsymbol != null)
      loadTVChart(rowData.tvsymbol)
    updateOrdersGrid()
    lsUpdateOrderFormInfo()
  });

  function getSelectedSymbol() {
    return selectedSymbol
  }

  function getSelectedMarket() {
    return selectedMarket
  }

  // --------------------------------------------------------------------------------------
  //  Tradingview Charts
  // --------------------------------------------------------------------------------------

  var chartWidget = null
  var chartInterval = null

  function loadTVChart(symbol) {
    if (chartWidget != null) {
      chartInterval = chartWidget.hasOwnProperty('options') ? chartWidget.options.interval : 'D';
      if (chartInterval == "1") {
        chartInterval = "240";
      }
    }
    chartWidget = new TradingView.widget({
      "autosize": true,
      "symbol": symbol,
      "interval": chartInterval,
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "container_id": "tradingview_da0a4"
    });
  }

  // --------------------------------------------------------------------------------------
  //  Positions Grid
  // --------------------------------------------------------------------------------------

  var positionsSource = {
    localdata: [],
    datafields: [
      { name: 'symbol', type: 'string', },
      { name: 'direction', type: 'string', },
      { name: 'base_size', type: 'number' },
      { name: 'quote_size', type: 'number' },
      { name: 'usd_size', type: 'number' },
      { name: 'entry_price', type: 'number' },
      { name: 'current_price', type: 'number' },
      { name: 'liquidation_price', type: 'number' },
      { name: 'entry_value', type: 'number' },
      { name: 'current_value', type: 'number' },
      { name: 'pnl', type: 'number' },
    ],
    datatype: "json"
  };

  var positionsAdapter = new $.jqx.dataAdapter(positionsSource);

  function updatePositionsGrid() {
    positionsSource.localdata = [];
    $("#positionsGrid").jqxGrid('updatebounddata', 'cells');
    $('#positionsGrid').jqxGrid('showloadelement');
    $.ajax({
        //async: false,
        type: 'GET',
        url: frostybot_rest + '/trade/' + getSelectedStub() + '/positions',
    }).done(function( results ) {
        if (results.result == 'success') {
          var positionsraw = results.data;
          var positions = []
          positionsraw.forEach(positionraw => {
            var position = positionraw
            positions.push(position);
          });
          positionsSource.localdata = positions; 
          $("#positionsGrid").jqxGrid('updatebounddata', 'cells');
          $('#positionsGrid').jqxGrid('sortby', 'symbol', 'asc');
          $('#positionsGrid').jqxGrid('hideloadelement');
        }
    });      
  }

  $("#positionsGrid").jqxGrid({
    width: '100%',
    height: '100%',
    source: positionsAdapter,
    columnsresize: true,
    filterable: true,
    sortable: true,
    showaggregates: true,
    columnsheight: 20,
    rowsheight: 20,
    theme: 'dark',
    columns: [
      { text: 'Symbol', datafield: 'symbol', filtertype: 'checkedlist', width: 145 },
      { text: 'Direction', datafield: 'direction', width: 60 },
      { text: 'Base', datafield: 'base_size', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'd4', cellclassname: function(row, column, value, data) { return data.direction == "short" ? "red" : "green" }, aggregates: ['sum'] },
      { text: 'Quote', datafield: 'quote_size', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'd4', cellclassname: function(row, column, value, data) { return data.direction == "short" ? "red" : "green" }, aggregates: ['sum'] },
      { text: 'Entry Price', datafield: 'entry_price', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'd4' },
      { text: 'Mark Price', datafield: 'current_price', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'd4' },
      { text: 'Est Liq Price', datafield: 'liquidation_price', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'd4' },
      //{ text: 'Current Value ($)', datafield: 'usd_size', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'c2', cellclassname: function(row, column, value, data) { return data.pnl < 0 ? "red" : "green" }, aggregates: ['sum'] },
      { text: 'PNL', datafield: 'pnl', width: 100, align: 'right', cellsalign: 'right', cellsformat: 'c2', cellclassname: function(row, column, value, data) { return value < 0 ? "red" : "green" }, aggregates: ['sum'] },
    ]
  });

  // --------------------------------------------------------------------------------------
  //  Orders Grid
  // --------------------------------------------------------------------------------------
 
  var ordersSource = {
    localdata: [],
    datafields: [
      { name: 'id', type: 'string', },
      { name: 'symbol', type: 'string', },
      { name: 'type', type: 'string', },
      { name: 'timestamp', type: 'date'},
      { name: 'direction', type: 'string', },
      { name: 'price', type: 'number' },
      { name: 'size_base', type: 'number' },
      { name: 'size_quote', type: 'number' },
      { name: 'status', type: 'number' },
    ],
    datatype: "json"
  };

  var ordersAdapter = new $.jqx.dataAdapter(ordersSource);

  function updateOrdersGrid() {
    clearOrdersGrid();
    $('#ordersGrid').jqxGrid('showloadelement');
    $.ajax({
        //async: false,
        type: 'GET',
        url: frostybot_rest + '/trade/' + getSelectedStub() + '/orders?symbol=' + getSelectedSymbol(),
    }).done(function( results ) {
        if (results.result == 'success') {
          var ordersraw = results.data;
          var orders = []
          ordersraw.forEach(orderraw => {
            var order = orderraw
            orders.push(order)
          });
          ordersSource.localdata = orders; 
          $("#ordersGrid").jqxGrid('updatebounddata', 'cells');
          $('#ordersGrid').jqxGrid('sortby', 'timestamp', 'asc');
          $('#ordersGrid').jqxGrid('hideloadelement');
        }
    });      
  }

  function clearOrdersGrid() {
    ordersSource.localdata = []
    $("#ordersGrid").jqxGrid('updatebounddata', 'cells');
  }

  $("#ordersGrid").jqxGrid({
    width: '100%',
    height: '100%',
    source: ordersAdapter,
    columnsresize: true,
    filterable: true,
    sortable: true,
    columnsheight: 20,
    rowsheight: 20,
    theme: 'dark',
    columns: [
      { text: 'Date', datafield: 'timestamp', cellsformat: 'S', width: 170 },
      { text: 'Type', datafield: 'type', filtertype: 'checkedlist', width: 140 },
      { text: 'Base', datafield: 'size_base', width: 150, align: 'right', cellsalign: 'right', cellsformat: 'd4', cellclassname: function(row, column, value, data) { return data.direction == "short" ? "red" : "green" } },
      { text: 'Quote', datafield: 'size_quote', width: 150, align: 'right', cellsalign: 'right', cellsformat: 'd4', cellclassname: function(row, column, value, data) { return data.direction == "short" ? "red" : "green" } },
      { text: 'Price', datafield: 'price', width: 150, align: 'right', cellsalign: 'right', cellsformat: 'd4' },
      { text: 'Status', datafield: 'status', width: 80, align: 'left', cellsalign: 'left', filtertype: 'checkedlist' },
    ],
  });


  // --------------------------------------------------------------------------------------
  //  Log Grid
  // --------------------------------------------------------------------------------------
 
  var logSource = {
    localdata: [],
    datafields: [
      { name: 'timestamp', type: 'date'},
      { name: 'type', type: 'string', },
      { name: 'message', type: 'string', },
    ],
    datatype: "json"
  };

  var logAdapter = new $.jqx.dataAdapter(logSource);

  function scrollLogToBottom() {
    var rows = $('#logGrid').jqxGrid('getrows');
    if (rows != undefined) {
      if (rows.length > 5) {
        var id = rows.length - 1;
        if (rows.hasOwnProperty(id)) {
          var lastid = rows[id].uid;
          if (lastid != 0) {
            $('#logGrid').jqxGrid('ensurerowvisible', lastid);    
          }
        }
      }  
    }
  }

  function updateLogGrid(msg) {
    if (msg.message_type == 'log') {
      logSource.localdata.push(msg);
      if (logSource.localdata.length > 50) {
        logSource.localdata = logSource.localdata.slice(-50);
      }
      $('#logGrid').jqxGrid('updatebounddata');
      scrollLogToBottom();
    }
  }

  $("#logGrid").jqxGrid({
    width: '100%',
    height: '100%',
    source: logAdapter,
    columnsresize: true,
    filterable: true,
    sortable: true,
    columnsheight: 20,
    rowsheight: 20,
    theme: 'dark',
    columns: [
      { text: 'Date', datafield: 'timestamp', cellsformat: 'S', width: 150 },
      { text: 'Type', datafield: 'type', filtertype: 'checkedlist', width: 70 },
      { text: 'Message', datafield: 'message', align: 'left', cellsalign: 'left'},
    ],
  });

  // --------------------------------------------------------------------------------------
  //  Long / Short Order Form
  // --------------------------------------------------------------------------------------

  $("#lsSizeType").jqxButtonGroup({ mode: 'radio' });
  $('#lsSizeType').jqxButtonGroup('setSelection', 3);

  $('#lsSizeType').on('buttonclick', function () { 
    lsUpdateOrderForm()
  }); 

  $("#lsPriceType").jqxButtonGroup({ mode: 'radio' });
  $('#lsPriceType').jqxButtonGroup('setSelection', 0);
  $('#lsPriceType').on('buttonclick', function () { 
    lsUpdateOrderForm()
  }); 


  function lsUpdateOrderForm() {

    var market = getSelectedMarket()

    var lsSizeOptions = [
      market.base,
      market.quote,
      market.quote == 'USD' ? undefined : 'USD',
      'x',
      '%',
      'Scale'
    ];
    $('#lsMaxSizeSuffix').text(market.quote)
    $('#lsSizeAmount').jqxInput({height: 20, width: 60, minLength: 1});
    $('#lsSizeType').jqxDropDownList({ source: lsSizeOptions, width: 70, height: 20, selectedIndex: 0, autoDropDownHeight: true});
    $('#lsMaxSizeAmount').jqxInput({height: 20, width: 60, minLength: 1});
    $('#lsPriceAmountMin').jqxInput({height: 20, width: 60, minLength: 1});
    $('#lsPriceAmountMax').jqxInput({height: 20, width: 60, minLength: 1});
    $("#lsPriceType").jqxDropDownList({ source: [market.quote, '%'], width: 70, height: 20, selectedIndex: 0, autoDropDownHeight: true});
    $("#lsPriceRelAbs").jqxDropDownList({ source: ['Absolute price', 'Above current market price', 'Below current market price'], width: 230, height: 20, selectedIndex: 0, autoDropDownHeight: true});
    $("#lsLongOrderButton").jqxButton({ template: "success", width: 120, height: 40 });
    $("#lsShortOrderButton").jqxButton({ template: "danger", width: 120, height: 40 });
    $('#lsPostOnlyButton').jqxSwitchButton({ height: 20, width: 81,  checked: false, onLabel: 'Yes', offLabel: 'No' });
  }

  $("#lsOrderQty").jqxSlider({
    showTickLabels: false, mode: "fixed", showButtons: false, height: 30, width: 260, min: 1, max: 10, ticksFrequency: 1, value: 1, step: 1, ticksPosition: 'top'
  });

  $('#lsOrderQty').on('change', function (event) {     
    lsUpdateOrderQty();
  });

  function lsUpdateOrderQty() {
    var val = $('#lsOrderQty').val();
    if (val == 1) {
      $("#lsPriceOrdersLabel").text("Create a single order at")
      $("#lsPriceMaxField").hide();
    } else {
      $("#lsPriceOrdersLabel").text("Create " + val + " layered orders between")
      $("#lsPriceMaxField").show();
    } 
  }

  lsUpdateOrderQty();

  function lsUpdateOrderFormInfo() {
    var market = getSelectedMarket()
    $("#lsSymbol").text(market.symbol);
    $("#lsBase").text(market.base);
    $("#lsQuote").text(market.quote);
    lsUpdateOrderForm();
  }

  function lsCreateOrder(type) {
    var stub = getSelectedStub();
    var symbol = getSelectedSymbol();
    var cmdJson = {
//      command:  "trade:" + stub + ":" + type,
      symbol:   symbol,
    }
    var market = getSelectedMarket();
    var sizeAmount = $('#lsSizeAmount').val();
    var maxSizeAmount = $('#lsMaxSizeAmount').val();
    var sizeType = $('#lsSizeType').val(); 
    switch (sizeType) {
      case market.base    :   cmdJson.base = sizeAmount; break;
      case market.quote   :   cmdJson.quote = sizeAmount; break;
      case 'USD'          :   cmdJson.usd = sizeAmount; break;
      case 'x'            :   cmdJson.size = sizeAmount + 'x'; break;
      case '%'            :   cmdJson.size = sizeAmount + '$'; break;
      case 'Scale'        :   cmdJson.scale = sizeAmount; break;
    }
    if (maxSizeAmount > 0) {
      cmdJson.maxsize = maxSizeAmount;
    }
    var priceRelAbs = $('#lsPriceRelAbs').val();
    switch (priceRelAbs) {
      case 'Absolute price' : var prefix = ''; break;
      case 'Above current market price' : var prefix = '+'; break;
      case 'Below current market price' : var prefix = '-'; break;
    }
    var priceType = $("#lsPriceType").val();
    var suffix = (priceType == market.quote ? '' : '%');
    var orderQty = $('#lsOrderQty').val();
    var priceAmountMin = $('#lsPriceAmountMin').val();
    var priceAmountMax = $('#lsPriceAmountMax').val();
    if (orderQty == 1) {
      if (priceAmountMin != '') {
        cmdJson.price = prefix + priceAmountMin + suffix;
      }
    } else {
      if ((priceAmountMin != '') && (priceAmountMax != '')) {
        cmdJson.price = prefix + priceAmountMin + suffix + ',' + priceAmountMax + suffix + ',' + orderQty;
      }
    }
    $.post(frostybot_rest + '/trade/' + stub + '/' + type, cmdJson)
      .done(function( results ) {
        console.log( results );
        if (results.result == "success") {
          updatePositionsGrid();
          updateOrdersGrid();
        }
      });
  }

  $("#lsLongOrderButton").on('click', function () {
    console.log("long button clicked")
    lsCreateOrder("long");
  }); 

  $("#lsShortOrderButton").on('click', function () {
    console.log("short button clicked")
    lsCreateOrder("short");
  }); 

  $("#lsForm").submit(function(){
    return false;
  });

});
