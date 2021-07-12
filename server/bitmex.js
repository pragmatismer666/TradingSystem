const Crypto = require('crypto');
const fetch = require('node-fetch');
var ema = require('exponential-moving-average');

const { filewrite, sendemail, sleep, getRes, postRes, fixOrder} = require('./common');

async function checkOrders(dir, key,secret){
  var expires = parseInt(Date.now()/1000) + 5;
  var signature = Crypto.createHmac('sha256',secret).update('GET/api/v1/order?symbol=XBT&filter=%7B%22open%22%3A%22true%22%7D&reverse=false' + expires.toString()).digest('hex');
  var headers = {
    'Accept':'application/json',
    'api-expires':expires.toString(),
    'api-key':key,
    'api-signature':signature
  };
  var options = {
    hostname: 'www.bitmex.com',
    path: '/api/v1/order?symbol=XBT&filter=%7B%22open%22%3A%22true%22%7D&reverse=false',
    method: 'GET',
    headers:headers
  }
  var url = 'https://www.bitmex.com/api/v1/order?symbol=XBT&filter=%7B%22open%22%3A%22true%22%7D&reverse=false';
  var text = await getRes(url, options);
  try {
    filewrite(dir, " ----- checkOrders : Order length : " + text.length);
  } catch (error) {
    filewrite(dir, " ----- checkOrders : Order length : " + text);
  }
  return text;
}
 
async function getEntry(dir, key,secret){
  try {
    var expires = parseInt(Date.now()/1000) + 5;
    var signature = Crypto.createHmac('sha256',secret).update('GET/api/v1/position?filter=%7B%22symbol%22%3A%20%22XBTUSD%22%7D' + expires.toString()).digest('hex');
    var headers = {
      'Accept':'application/json',
      'api-expires':expires.toString(),
      'api-key':key,
      'api-signature':signature
    };
    var options = {
      hostname: 'www.bitmex.com',
      path: '/api/v1/position?filter=%7B%22symbol%22%3A%20%22XBTUSD%22%7D',
      method: 'GET',
      headers:headers
    }
    var url = 'https://www.bitmex.com/api/v1/position?filter=%7B%22symbol%22%3A%20%22XBTUSD%22%7D';
    var text = await getRes(url,options);
    filewrite(dir, " --------------- getEntry : text.length : " + text.length.toString());
    if (text.length > 0){ return text[0]; }
    else { return false; } 
  } catch (error) {
    filewrite(dir, " ------------- getEntry : text.length - error : \n" + text);
    return false;
  }
}

async function bitgetamount(key,secret){
  var expires = parseInt(Date.now()/1000) + 10;
  var signature = Crypto.createHmac('sha256',secret).update('GET/api/v1/user/wallet' + expires.toString()).digest('hex');
  var headers = {
    'Accept':'application/json',
    'api-expires':expires.toString(),
    'api-key':key,
    'api-signature':signature
  };
  var options = {
    hostname: 'www.bitmex.com',
    path: '/api/v1/user/wallet',
    method: 'GET',
    headers:headers
  }
  var url = 'https://www.bitmex.com/api/v1/user/wallet';
  var text = await getRes(url,options);
  await sleep(1000);
  if (text == false){
    return false;
  }
  return text.amount;
}

async function bitgetwallet(dir, key,secret){
  var expires = parseInt(Date.now()/1000) + 10;
  var signature = Crypto.createHmac('sha256',secret).update('GET/api/v1/user/walletSummary' + expires.toString()).digest('hex');
  var headers = {
    'Accept':'application/json',
    'api-expires':expires.toString(),
    'api-key':key,
    'api-signature':signature
  };
  var options = {
    hostname: 'www.bitmex.com',
    path: '/api/v1/user/walletSummary',
    method: 'GET',
    headers:headers
  }
  var url = 'https://www.bitmex.com/api/v1/user/walletSummary';
  var text = await getRes(url,options);
  await sleep(1000);
  if (text == false ){ return [0, 0]; }
  else {
    var total = 0; var profit = 0;
    try {
      for(var i=0;i<text.length;i++){
        if (text[i].currency == "XBt" && text[i].transactType == "Total" ){ total = text[i].amount; }
        else if ( text[i].currency == "XBt" && text[i].transactType == "RealisedPNL"  && text[i].symbol == "XBTUSD" ){ profit = text[i].amount; }
      }
    } catch (error) {
      filewrite(dir, " ------------- bitgetwallet  :  Get problem : " + text + "   " + key );
      console.log( " ------------- bitgetwallet  :  Get problem : ", text, key );
    }
    filewrite(dir, " ------------- bitgetwallet  : total, profit in getwallet : " + total + "   " + profit )
    console.log(" ------------- bitgetwallet  : total, profit in getwallet : " , total, profit);
    return [total, profit];
  }
}
  
async function bitdelall(dir, key,secret){
  try{
    var posexpir = (parseInt(Date.now()/1000) + 5).toString();
    var possignature = Crypto.createHmac('sha256',secret).update('POST/api/v1/order/closePosition' + posexpir + "symbol=XBTUSD").digest('hex');
    var poshea = {
      'Accept':'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'api-expires':posexpir,
      'api-key':key,
      'api-signature':possignature
    };
    await postRes("https://www.bitmex.com/api/v1/order/closePosition","symbol=XBTUSD",poshea);
    filewrite(dir, " -------- bitdelall  :  position existed  :  ");
  }
  catch{
    filewrite(dir, " -------- bitdelall  :  position IsOpen Error  :  ");
  }
  try {
    var delexpir = (parseInt(Date.now()/1000) + 10).toString();
    var delsignature = Crypto.createHmac('sha256',secret).update('DELETE/api/v1/order/all' + delexpir + "symbol=XBTUSD").digest('hex');
    var delhea = {
      'Accept':'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'api-expires':delexpir,
      'api-key':key,
      'api-signature':delsignature
    };
    await fixOrder("DELETE","https://www.bitmex.com/api/v1/order/all","symbol=XBTUSD", delhea);
    await sleep(1000);
  } catch (error) {
    filewrite(dir, " -------- bitdelall  :  error  :  " + error);
  }
}

async function bitdelopp(dir, key,secret,orderopt,values,orders,strategy){
  try {
    var result = await getEntry(dir, key,secret);
    if ( result == false ){ return ;}
    filewrite(dir, " ----- bitdelopp  :  start with position.");
    var m_price = 0;
    var deldata;
    var profitorder;
    var delexpir = (parseInt(Date.now()/1000) + 10).toString();
    for (var m =0;m<orders.length;m++){
      if(values.data[0].orderID === orders[m].orderID){
        m_price = Math.round(orders[m].price);
        try {
          if ( result.currentQty === 0 || result.avgEntryPrice === 0){
            result = {avgEntryPrice:m_price,currentQty:100};
          }
        } catch (error) {
          result = {avgEntryPrice:m_price,currentQty:100};
        }
        if (orders[m].side === "Sell"){
          deldata = 'symbol=XBTUSD&filter=%7B%22side%22%3A%20%22Buy%22%7D';
          if (strategy === "strategy1"){
            profitorder = "symbol=XBTUSD&side=Buy&orderQty="+Math.abs(result.currentQty).toString()+"&price="+(Math.floor(result.avgEntryPrice) - parseInt(orderopt.take)).toString()+"&ordType=Limit";
          }
          else if (strategy === "strategy2"){
            profitorder = "symbol=XBTUSD&side=Buy&orderQty="+Math.abs(result.currentQty).toString()+"&price="+(m_price - parseInt(orderopt.top) + parseInt(orderopt.bottom)).toString()+"&ordType=Limit";
          }
        }
        else{
          deldata = 'symbol=XBTUSD&filter=%7B%22side%22%3A%20%22Sell%22%7D';
          if (strategy === "strategy1"){
            profitorder = "symbol=XBTUSD&side=Sell&orderQty="+Math.abs(result.currentQty).toString()+"&price="+(Math.floor(result.avgEntryPrice) + parseInt(orderopt.take)).toString()+"&ordType=Limit";
          }
          else if (strategy === "strategy2"){
            profitorder = "symbol=XBTUSD&side=Sell&orderQty="+Math.abs(result.currentQty).toString()+"&price="+(m_price + parseInt(orderopt.top) - parseInt(orderopt.bottom)).toString()+"&ordType=Limit";
          }
        }
        var delsignature = Crypto.createHmac('sha256',secret).update('DELETE/api/v1/order/all' + delexpir + deldata).digest('hex');        
        var delhea = {
          'Accept':'application/json',
          'Content-Type':'application/x-www-form-urlencoded',
          'api-expires':delexpir,
          'api-key':key,
          'api-signature':delsignature
        };
        await fixOrder("DELETE",'https://www.bitmex.com/api/v1/order/all',deldata,delhea);
        delexpir = (parseInt(Date.now()/1000) + 10).toString()
        var profitsignature = Crypto.createHmac('sha256',secret).update('POST/api/v1/order' + delexpir.toString() + profitorder).digest('hex');
        var profithea = {
          'Accept':'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'api-expires':delexpir,
          'api-key':key,
          'api-signature':profitsignature
        };
        var check = await postRes('https://www.bitmex.com/api/v1/order',profitorder,profithea);
        filewrite(dir, " -------  bitdelopp  ------ order  :  " +  JSON.stringify(check));
        break;
      }              
    }    
  } catch (error) {    
    filewrite(dir, " -------  bitdelopp  ------ error  :  " +  error);
  }
  return ;
}

async function bitmultiorder1(dir, key,secret,orderopt,amount){
  filewrite(dir, " ------ bitmultiorder1 ***  start  : " + JSON.stringify(amount));
  var text = await getRes("https://www.bitmex.com/api/v1/quote?symbol=xbt&count=1&reverse=true",{});
  var orderData = [];
  var m_buyp = text[0].bidPrice;
  var m_sellp = text[0].bidPrice;
  var m_margin = text[0].bidPrice/100;
  var baseQty = text[0].bidPrice*amount/10000000000;
  var m_QtySell = Math.floor(baseQty/100)*100;
  if ( m_QtySell < 100 ){ m_QtySell = 100; }
  var m_QtyBuy = Math.floor(baseQty/100)*100;
  if ( m_QtyBuy < 100 ){ m_QtyBuy = 100; }
  console.log(orderopt.buyd.length)
  for(let i = 0;i<orderopt.buyd.length;i++){
    m_buyp = m_buyp - m_margin * parseFloat(orderopt.buyd[i]);
    m_sellp = m_sellp + m_margin * parseFloat(orderopt.selld[i]);
    var buyorder = {"symbol":"XBTUSD","side":"Buy","ordType":"Limit","orderQty":m_QtyBuy,"price": Math.round(m_buyp)};  //parseFloat((bidprice + margin).toFixed(1))
    var sellorder = {"symbol":"XBTUSD","side":"Sell","ordType":"Limit","orderQty":m_QtySell,"price":Math.round(m_sellp)};  //parseFloat((bidprice + margin).toFixed(1))
    m_QtyBuy = Math.floor(baseQty*parseFloat(orderopt.sells[i])/100)*100;
    if (m_QtyBuy<100){m_QtyBuy=100;}
    m_QtySell = Math.floor(baseQty*parseFloat(orderopt.sells[i])/100)*100;
    if (m_QtySell<100){m_QtySell=100;}
    orderData.push(sellorder);
    orderData.push(buyorder);
  }
  filewrite(dir, JSON.stringify(orderData));
  filewrite(dir, " ------ bitmultiorder1 ***  start end *** -----------");
  var orderexpires = parseInt(Date.now()/1000) + 10;
  var realorder = "orders=" + JSON.stringify(orderData);
  var ordersignature = Crypto.createHmac('sha256',secret).update('POST/api/v1/order/bulk' + orderexpires.toString() + realorder).digest('hex');
  var orderhea = {
    'Accept':'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'api-expires':orderexpires.toString(),
    'api-key':key,
    'api-signature':ordersignature
  };
  var result = await postRes('https://www.bitmex.com/api/v1/order/bulk',realorder,orderhea);
  await sleep(1000);
  if ( JSON.stringify(result).includes("error")){return false;}
  else { return result; }
}

async function bitupdatetp(dir, key,secret,tporder,orderopt){
  try {
    filewrite(dir, " ---- bitupdatetp  :  start  ---- ");
    var result = await getEntry(dir, key,secret);
    if ( result == false ){ return tporder; }
    filewrite(dir, " ---- bitupdatetp  :  tporder  ----  :  " + Object.keys(tporder) + "  :  " + tporder.price + "  :  " + tporder.orderQty);
    var expir = (parseInt(Date.now()/1000) + 5).toString();
    var orderdata;
    if (Object.keys(tporder).includes("side") && Object.keys(tporder).includes("orderID")){
      if (tporder.side === "Buy"){ tporder.price = Math.floor(result.avgEntryPrice) - parseInt(orderopt.take); }
      else { tporder.price = Math.floor(result.avgEntryPrice) + parseInt(orderopt.take); }
      tporder.orderQty = Math.abs(result.currentQty);
      orderdata = "symbol=XBTUSD&orderID="+tporder.orderID+"&orderQty="+(tporder.orderQty).toString()+"&price="+(tporder.price).toString();
      var upsignature1 = Crypto.createHmac('sha256',secret).update('PUT/api/v1/order' + expir.toString() + orderdata).digest('hex');
      var updatehea = {
        'Accept':'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-expires':expir,
        'api-key':key,
        'api-signature':upsignature1
      };
      await fixOrder("PUT",'https://www.bitmex.com/api/v1/order',orderdata,updatehea);      
    }
    else {
      if (result.currentQty > 0){ orderdata = "symbol=XBTUSD&side=Sell&orderQty="+(Math.abs(result.currentQty)).toString()+"&price="+(Math.floor(result.avgEntryPrice) + parseInt(orderopt.take)).toString(); }
      else { orderdata = "symbol=XBTUSD&side=Buy&orderQty="+(Math.abs(result.currentQty)).toString()+"&price="+(Math.floor(result.avgEntryPrice) - parseInt(orderopt.take)).toString(); }
      var upsignature2 = Crypto.createHmac('sha256',secret).update('POST/api/v1/order' + expir.toString() + orderdata).digest('hex');
      var ntphea = {
        'Accept':'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-expires':expir,
        'api-key':key,
        'api-signature':upsignature2
      };
      tporder = await postRes('https://www.bitmex.com/api/v1/order',orderdata, ntphea);
    }
    filewrite(dir, " ---- bitupdatetp  :  end  ----  :  " + JSON.stringify(tporder));
  } catch (error) {
    filewrite(dir, " ---- bitupdatetp  :  error  ----  :  " + error);
  }
  return tporder;
}

async function bitmultiorder2(dir, key,secret,orderopt,amount){
  try {
    filewrite(dir, " -----  bitmultiorder2   :   start  --- \n" + amount);
    var text = await getRes("https://www.bitmex.com/api/v1/quote?symbol=xbt&count=1&reverse=true",{});
    var orderData = [];
    var m_price = text[0].bidPrice;
    var baseQty = m_price*amount*parseFloat(orderopt.balance)/10000000000;
    var orderQty = Math.floor(baseQty/100)*100;
    if ( orderQty < 100 ){ orderQty = 100; }
    var m_top = parseInt(orderopt.top);
    var m_bottom = parseInt(orderopt.bottom);
    var m_margin = m_top - m_bottom;
    if (m_price >= m_top){
      m_top = m_price + 100;
      m_bottom = m_top - m_margin;
    }
    else if (m_top > m_price && (m_price > m_top - 20) ){
      m_top = m_top + 20;
      m_bottom = m_bottom + 20;
    }
    else if (m_price <= m_bottom){
      m_bottom = m_price - 100;
      m_top = m_bottom + m_margin;
    }
    else if (m_bottom < m_price && (m_price < m_bottom + 10)){
      m_bottom = m_bottom - 20;
      m_top = m_top - 20;
    }
    for(let i=0;i<8;i++){
      var sellorder = {"symbol":"XBTUSD","side":"Sell","ordType":"Limit","orderQty":orderQty,"price": Math.round(m_top + i*m_margin)};  //parseFloat((bidprice + margin).toFixed(1))
      var buyorder = {"symbol":"XBTUSD","side":"Buy","ordType":"Limit","orderQty":orderQty,"price":Math.round(m_bottom - i*m_margin)};  //parseFloat((bidprice + margin).toFixed(1))
      orderQty = Math.floor(baseQty * parseFloat(orderopt.size)/100)*100;
      if ( orderQty < 100 ){ orderQty = 100; }
      orderData.push(sellorder);
      orderData.push(buyorder);
    }
    filewrite(dir, JSON.stringify(orderData));
    filewrite(dir, " ----- ***************** bitmultiorder2   :   start ***************** --- ");
    var orderexpires = parseInt(Date.now()/1000) + 10;
    var realorder = "orders=" + JSON.stringify(orderData);
    var ordersignature = Crypto.createHmac('sha256',secret).update('POST/api/v1/order/bulk' + orderexpires.toString() + realorder).digest('hex');
    var orderhea = {
      'Accept':'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'api-expires':orderexpires.toString(),
      'api-key':key,
      'api-signature':ordersignature
    };
    var result = await postRes('https://www.bitmex.com/api/v1/order/bulk',realorder,orderhea);
    await sleep(1000);
    if ( JSON.stringify(result).includes("error")){return false;}
    else { return result; }
  } catch (error) {
    filewrite(dir, " -----  bitmultiorder2   :   error  --- ");
    return false;
  }  
}
  
async function bitupdatetp2(dir, key,secret,tporder,orderopt){
  try {
    filewrite(dir, " -----  bitupdatetp2   :   start  --- ");
    var result = await getEntry(dir, key,secret);
    if ( result == false ){ console.log("postion is false in bitupdatetp2.", key); return tporder; }
    if ( tporder.side === "Buy" ){ tporder.price = Math.floor(result.avgEntryPrice) - parseInt(orderopt.top) + parseInt(orderopt.bottom); }
    else { tporder.price = Math.floor(result.avgEntryPrice) + parseInt(orderopt.top) - parseInt(orderopt.bottom); }
    tporder.orderQty = Math.abs(result.currentQty);
    console.log(" ------------------------------------ bitstrategy2 bitupdatetp2 part", key, tporder);
    filewrite(dir, " -----  bitupdatetp2   :   mid value  --- " + key + "  " + tporder);
    var expir = (parseInt(Date.now()/1000) + 10).toString();
    var orderdata = "symbol=XBTUSD&orderID="+tporder.orderID+"&orderQty="+(tporder.orderQty).toString()+"&price="+tporder.price.toString();
    var upsignature = Crypto.createHmac('sha256',secret).update('PUT/api/v1/order' + expir.toString() + orderdata).digest('hex');
    var updatehea = {
      'Accept':'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'api-expires':expir,
      'api-key':key,
      'api-signature':upsignature
    };
    await fixOrder("PUT","https://www.bitmex.com/api/v1/order",orderdata,updatehea);    
    await sleep(1000); 
  } catch (error) {
    filewrite(dir, " -----  bitupdatetp2   :   error  --- " + error);
  }
  return tporder;
}

async function bitcheckvol(dir, key, secret,  option){
  try{
    filewrite(dir, " -----  bitcheckvol   :   start  --- ");
    var trades = await getRes("https://www.bitmex.com/api/v1/trade/bucketed?binSize="+ option.vol_size +"&partial=false&symbol=XBTUSD&count=" + option.vol_count+ "&reverse=true",{});
    var arrc = [];
    for (var i=0;i<trades.length;i++){
      arrc.push(trades[i].close);
    }
    var emaValue = ema(arrc, {range:parseInt(option.vol_count)});    
    var side = "";
    var text = await getRes("https://www.bitmex.com/api/v1/quote?symbol=xbt&count=1&reverse=true",{});
    filewrite(dir, " -----  bitcheckvol   :   ema ---- \n" + parseFloat(emaValue[0]) + "   " + text[0].bidPrice + "   " + option.Inverse + "   " + option.buy_sell);
    if (option.Inverse == "true"){
      if ((parseFloat(emaValue[0]) > text[0].bidPrice) && (option.buy_sell == "both" || option.buy_sell == "buy")){ side = "Buy"; }
      else if ((parseFloat(emaValue[0]) < text[0].bidPrice) && (option.buy_sell == "both" || option.buy_sell == "sell")) { side = "Sell"; }
    }
    else {
      if ((parseFloat(emaValue[0]) > text[0].bidPrice) && (option.buy_sell == "both" || option.buy_sell == "sell")){ side = "Sell"; }
      else if ((parseFloat(emaValue[0]) < text[0].bidPrice) && (option.buy_sell == "both" || option.buy_sell == "buy")) { side = "Buy"; }
    }
    var amount = await bitgetamount(key,secret);
    filewrite(dir, " -----  bitcheckvol   :   amount, side ---- " + amount + "   " + side);
    if (amount <= 0 || side == "" ){
      return false;
    }
    var result = await bitmultiorder3(dir, key, secret, option, amount, side, text[0].bidPrice);
    console.log(" ---------------------------------------------- end bitcheckvol");
    return result;
  }
  catch ( error ){
    filewrite(dir, " -----  bitcheckvol   :   error ---- " + error);
    return false;
  }
}

async function bitmultiorder3(dir, key, secret, option, amount, side, m_price){
  filewrite(dir, " -----  bitmultiorder3   :   start ---- ");
  var orderData = [];
  var m_Qty = Math.floor(m_price*amount/10000000000*parseFloat(option.qtyrate)/100)*100;
  if ( m_Qty < 100 ){ m_Qty = 100; }
  var marketOrder = "symbol=XBTUSD&side="+ side +"&orderQty=" + m_Qty.toString() + "&ordType=Market";
  var expir = (parseInt(Date.now()/1000) + 10).toString()
  var signature = Crypto.createHmac('sha256',secret).update('POST/api/v1/order' + expir.toString() + marketOrder).digest('hex');
  var marketheader = {
    'Accept':'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'api-expires':expir,
    'api-key':key,
    'api-signature':signature
  };
  await postRes("https://www.bitmex.com/api/v1/order",marketOrder,marketheader);
  try {
    for(let i = 0;i<parseInt(option.orders);i++){
      if (side == "Buy"){ m_price = m_price - parseFloat(option.distance); }
      else { m_price = m_price + parseFloat(option.distance); }
      var order = {"symbol":"XBTUSD","side":side,"ordType":"Limit","orderQty":m_Qty,"price": Math.round(m_price)};  //parseFloat((bidprice + margin).toFixed(1))
      orderData.push(order);
    }
    var orderexpires = parseInt(Date.now()/1000) + 10;
    var realorder = "orders=" + JSON.stringify(orderData);
    var ordersignature = Crypto.createHmac('sha256',secret).update('POST/api/v1/order/bulk' + orderexpires.toString() + realorder).digest('hex');
    var orderhea = {
      'Accept':'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'api-expires':orderexpires.toString(),
      'api-key':key,
      'api-signature':ordersignature
    };
    await postRes('https://www.bitmex.com/api/v1/order/bulk',realorder,orderhea);
    var skip_flag = 0;
    await sleep(1000);
    while ( true )
      try {
        var orderexpires = parseInt(Date.now()/1000) + 10;
        var position = await getEntry(dir, key,secret);
        if ( position == false ){ 
          await sleep(1000);
          position = await getEntry(dir, key,secret);
          if ( position == false ){ return false; }
        }
        var takeOrder = "";
        if ( parseFloat(position.currentQty) > 0 ) { takeOrder = "symbol=XBTUSD&side=Sell&orderQty="+Math.abs(position.currentQty).toString()+"&price="+(Math.floor(position.avgEntryPrice) + parseInt(option.take)).toString()+"&ordType=Limit"; }
        else { takeOrder = "symbol=XBTUSD&side=Buy&orderQty="+Math.abs(position.currentQty).toString()+"&price="+(Math.floor(position.avgEntryPrice) - parseInt(option.take)).toString()+"&ordType=Limit"; }
        var takeSign = Crypto.createHmac('sha256',secret).update('POST/api/v1/order' + orderexpires.toString() + takeOrder).digest('hex');
        var takehea = {    
          'Accept':'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'api-expires':orderexpires.toString(),
          'api-key':key,
          'api-signature':takeSign
        };
        var result = await postRes('https://www.bitmex.com/api/v1/order', takeOrder, takehea);
        filewrite(dir, " -----  bitmultiorder3   :   end ----  :  " + JSON.stringify(result));
        if (Object.keys(result).includes("orderID") && Object.keys(result).includes("price") && Object.keys(result).includes("orderQty")){
          filewrite(dir, " -----  bitmultiorder3   :   break ----  :  " + result);
          break;
        }
        await sleep(1000);
      } catch (error) {
        filewrite(dir, " -----  bitmultiorder3   :   error ----  :  " + error);
        if ( skip_flag > 2){ break; }
        else { skip_flag ++; await sleep(1000*2); }
      }
    if ( JSON.stringify(result).includes("error")){return false;}
    else { return result; }
  } catch (error) {
    return false;
  }
  
}

// ------------------------
async function changeOrder( key, secret, strategy, preOrder, option, pos){
  try {
    // console.log(" ------------------- bitchange Order start ");
    var expir = (parseInt(Date.now()/1000) + 5).toString();
    var m_price;
    if ( strategy == "strategy1" || strategy == "strategy3" ) { 
      if ( preOrder.side == "Buy" ) { m_price = pos.avgEntryPrice - parseInt(option.take); }
      else { m_price = pos.avgEntryPrice + parseInt(option.take); }
    }
    else if ( strategy == "strategy2" ) {
      if ( preOrder.side == "Buy" ) { m_price = pos.avgEntryPrice - parseInt(option.top) + parseInt(option.bottom); }
      else { m_price = pos.avgEntryPrice + parseInt(option.top) - parseInt(option.bottom); }
    }
    console.log(" ------------------- bitchange Order mid value ",pos.currentQty, m_price);
    var orderdata = "orderID="+preOrder.orderID+"&orderQty="+(Math.abs(pos.currentQty)).toString()+"&price="+m_price.toString();
    var upsignature = Crypto.createHmac('sha256',secret).update('PUT/api/v1/order' + expir.toString() + orderdata).digest('hex');
    var updatehea = {
      'Accept':'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'api-expires':expir,
      'api-key':key,
      'api-signature':upsignature
    };
    await fixOrder("PUT",'https://www.bitmex.com/api/v1/order',orderdata,updatehea);      
  } catch (error) { console.log(" ------------------- bitchange Order error ", error); }
}

module.exports = {changeOrder, getEntry, checkOrders, bitgetamount, bitgetwallet, bitdelall, bitdelopp, bitmultiorder1, bitmultiorder2, bitupdatetp, bitupdatetp2, bitcheckvol, bitmultiorder3 };