process.env.UV_THREADPOOL_SIZE=200;
const express = require('express');
const Joi = require('@hapi/joi');
const Crypto = require('crypto');
const fetch = require('node-fetch');
var WebSocket = require('bitmex-websocket');
const CryptoAccount = require("send-crypto");
const fs = require("fs");

const { insertItem, getItems,removeItems,distinctItems,distinctQuery, updateQuantity,findone,getItemsAsync} = require('./db');
const { changeOrder, getEntry, checkOrders, bitgetwallet, bitdelall, bitdelopp, bitmultiorder1, bitmultiorder2, bitupdatetp, bitupdatetp2, bitcheckvol, bitgetamount } = require('./bitmex');
const { filewrite, sendemail, sleep, getRes, postRes} = require('./common');
const { createwallet } = require('./payment.js');
const router = express.Router()
// Database
const { ObjectId } = require('mongodb');
var user_coll_name = "tbl_user";
var client_coll_name = "tbl_client";
var delete_coll_name = "tbl_delete";
var pay_coll_name = "tbl_pay";
var strategy_coll_name = ["tbl_strategy1","tbl_strategy2","tbl_strategy3"];
// Static Global
var users = [];
const startNumber = 0;
const endNumber = 30;

const checkdir = setTimeout( async() => {
  if ( fs.existsSync("./log") ){ console.log("exist") ; }
  else {
    fs.mkdir("./log", { recursive: true }, function(err) {
      if (err) { console.log(err);
      } else { console.log("New directory successfully created."); }
    })
  }
}, 100);
var restart = setInterval( async() => {await checkbot()}, 1000*60*60*2);
var profitCheck = setInterval(async()=>{await checkprofit()},1000*60*60*3);
// login-------------------------------------------------
router.post('/api/backend_login', (req, res) => {
  const key = req.body
  var loginflag = 0
  getItems(user_coll_name)
    .then((items) => {
      for(var i=0;i<items.length;i++){
        if((items[i].email === key.email) && (items[i].password === key.password)){   
          loginflag = 1
          res.send(items[i]);
          break;
        }
      }
      if (loginflag === 0){
        res.status(500).end()
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    })
})
// user---------------------------------------------------
router.get('/api/backend_user', async(req, res) => {
  let realClients = [];
  try {
    var clients = await getItemsAsync(user_coll_name);
    for (let i=0;i<clients.length;i++){
      realClients.push({
        name: clients[i].name,
        username:clients[i].username,
        email: clients[i].email,
        pass:clients[i].password,
        m_comis:clients[i].m_comis,
        u_comis:clients[i].u_comis,
        wallet:clients[i].wallet
      });
    }
    res.send(realClients).end();
  } catch (error) {
    res.status(500).end()
  }
})
router.post('/api/backend_add_user', async(req, res) => {
  var namecheck = await findone({$or:[{username:req.body.username},{name:req.body.name}]},user_coll_name);
  var emailcheck = await findone({email:req.body.email},user_coll_name);
  if (emailcheck.length != 0){
    res.send({message:"email exist"}).end();
  }
  else if (namecheck.length != 0){
    res.send({message:"name exist"}).end();
  }
  else{
    req.body.status = "verify";
    req.body.type = "1";
    var title = "Manager Account Registered";
    var regMsg = "You are registered as successfully.";
    // var email = "pragmatismer666@gmail.com"; //req.body.email
    // await sendemail(email,title,regMsg);
    await sendemail(req.body.email,title,regMsg);
    insertItem(req.body,user_coll_name)
      .then(() => { res.send({message:"success"}).end(); })
      .catch((err) => { res.status(500).end(); })
  }
})
router.post('/api/backend_remove_user', async (req, res) => {
  try {
    await removeItems({created_by:req.body.username}, client_coll_name);
    await removeItems({m_user:req.body.username}, pay_coll_name);
    await removeItems({username:req.body.username}, user_coll_name);
    res.send({message:"success"}).end();
  } catch (error) {
    res.send({message:"error"}).end();
  }
})
router.post('/api/update_user', async(req, res) => {
  await updateQuantity({username:req.body.username},req.body,user_coll_name);
  res.send({message:req.body.email + " is updated"}).end();
})
// PAY, WALLET ------------------------------------------------
router.get('/api/pay_detail', async(req, res) => {
  getItems(pay_coll_name)
  .then((items) => {
      items = items.map((item) => ({
        id:item._id,
        user:item.m_user,
        client:item.client,
        balance:item.balance,
        profit:item.profit,
        amount:item.amount,
        wallet:item.wallet,
        updated_at:item.updated_at
      }))
      res.send(items).end();
  })
  .catch((err) => {
      console.log(err);
      res.status(500).end();
  })
})
// Strategy manage ---------------------------------------
router.post('/api/close_trades', async(req, res) => {
  try {
    users = [];
    var result = await findone({$and:[{strategy:req.body.name},{param_id:req.body.param}]},client_coll_name);
    for(var i=0;i<result.length;i++){
      if ( users.includes(result[i].id+"bitmex"+req.body.name)){
        mypop(users,result[i].id+"bitmex"+req.body.name);
      }
      await bitdelall("./log/"+result[i].email.split("@")[0],result[i].id,result[i].sec);
      await updateQuantity({id:result[i].id},{status:"pause"},client_coll_name);
    }
    res.send({message:"success"}).end();
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
})
router.post('/api/delete_param', async(req, res) => {
  var m_param = parseInt(req.body.param.toString().split("parameter")[1]);
  var params = await getItemsAsync("tbl_"+req.body.name);
  for (var i=0;i<params.length;i++){ 
    var paramIndex = parseInt(params[i].param.toString().split("parameter")[1]);
    if ( paramIndex > m_param){  await updateQuantity({param:"parameter"+paramIndex.toString()},{param:"parameter"+(paramIndex-1).toString()},"tbl_" + req.body.name); } 
  }
  removeItems({param:req.body.param},"tbl_"+req.body.name)
  .then( async () => { res.send({message:"success"}); res.status(200).end(); })
  .catch((err) => { console.log(err); res.status(500).end(); })
})
router.post('/api/get_param', async(req, res) => {
  try {
    var result = await findone({param:req.body.param},"tbl_"+req.body.strategy);
    res.send(result).end();
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
})
router.post('/api/update_param', async(req, res) => {
  if (req.body.param === "new"){
    var params = await distinctItems("param","tbl_" + req.body.strategy);
    var newvalue = {};
    if (req.body.strategy === "strategy1"){
      newvalue = {param:"parameter" + (params.length + 1).toString(),buyd:req.body.buyd,buys:req.body.buys,selld:req.body.selld,sells:req.body.sells,take:req.body.take,name:req.body.name};
    }
    else if (req.body.strategy === "strategy2"){
      newvalue = {param:"parameter" + (params.length + 1).toString(),top:req.body.top,bottom:req.body.bottom,distance:req.body.distance,balance:req.body.balance,size:req.body.size,name:req.body.name};
    }
    else if (req.body.strategy === "strategy3"){
      newvalue = {param:"parameter" + (params.length + 1).toString(),vol:req.body.vol, vol_count:req.body.vol_count, vol_size:req.body.vol_size, orders:req.body.orders, qtyrate:req.body.qtyrate, distance:req.body.distance, take:req.body.take, Inverse:req.body.Inverse, buy_sell:req.body.buy_sell,name:req.body.name};
    }
    insertItem(newvalue,"tbl_" + req.body.strategy)
    .then((result) => { res.send({message:req.body.strategy + " parameter" + (params.length + 1).toString() + " is created"}).end(); })
    .catch((err) => { console.log(err); res.status(500).end(); })
  }
  else {
    var upvalue = {};
    if (req.body.strategy === "strategy1"){
      upvalue = {buyd:req.body.buyd,buys:req.body.buys,selld:req.body.selld,sells:req.body.sells,take:req.body.take, name:req.body.name};
    }
    else if (req.body.strategy === "strategy2"){
      upvalue = {top:req.body.top,bottom:req.body.bottom,distance:req.body.distance,balance:req.body.balance,size:req.body.size, name:req.body.name};
    }
    else if (req.body.strategy === "strategy3") {
      upvalue = {vol:req.body.vol, vol_count:req.body.vol_count, vol_size:req.body.vol_size, orders:req.body.orders, qtyrate:req.body.qtyrate, distance:req.body.distance, take:req.body.take, Inverse:req.body.Inverse, buy_sell:req.body.buy_sell, name:req.body.name };
    }
    await updateQuantity({param:req.body.param},upvalue,"tbl_" + req.body.strategy);
    res.send({message:req.body.strategy + " " + req.body.param + " is updated"}).end();
  }
})
// Register page -------------------------------------------------
router.get('/special/strategy1', async(req, res) => {
  getItems("tbl_strategy1")
  .then((items) => {
      items = items.map((item) => ({ param:item.param, name:item.name }));
      res.send(items).end();
  })
  .catch((err) => {
      console.log(err);
      res.status(500).end();
  })
})
router.get('/special/strategy2', async(req, res) => {
  getItems("tbl_strategy2")
  .then((items) => {
    items = items.map((item) => ({ param:item.param, name:item.name }));
    res.send(items).end();
  })
  .catch((err) => {
    console.log(err);
    res.status(500).end();
  })
})
router.get('/special/strategy3', async(req, res) => {
  getItems("tbl_strategy3")
  .then((items) => {
      items = items.map((item) => ({ param:item.param, name:item.name }))
      res.send(items).end();
  })
  .catch((err) => {
      console.log(err);
      res.status(500).end();
  })
})
router.post('/special/client_register', async(req, res) => {
  req.body.exchange = "bitmex";
  let log_register = "./log/register"
  if ( fs.existsSync(log_register) ){
    console.log("exist") ;
  }
  else {
    fs.mkdir(log_register, { recursive: true }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("New directory successfully created.");
      }
    })
  }
  var emailcheck = await findone({email:req.body.email},client_coll_name);
  var namecheck = await findone({username:req.body.username},client_coll_name);
  var managercheck = await findone({username:req.body.created_by},user_coll_name);  // manager username
  var amount = await bitgetwallet(log_register,req.body.id,req.body.sec);
  if (emailcheck.length != 0){ res.send({message:"email exist"}).end(); }
  else if ( namecheck.length != 0){ res.send({message:"username exist"}).end(); }
  else if ( managercheck.length == 0){ res.send({message:"manager no"}).end(); }
  else if ( amount[0]/100000000 < 0.005 ){ res.send({message:"api no"}).end(); }
  else {
    var resultMsg = await sendemail(req.body.email, "Account Registered", "You are registered as successfully.");
    req.body["balance"] = (amount[0]/100000000);
    req.body["status"] = "pause";
    req.body["created_at"] = (new Date()).toISOString();
    req.body["updated_at"] = (new Date()).toISOString();
    if (resultMsg){
      var userpay = {};
      var walletDetail = await createwallet(req.body.username);
      insertItem(req.body,client_coll_name)
      .then(() => {
        userpay.m_user = req.body.created_by;
        userpay.client = req.body.username;
        userpay.wallet = walletDetail.address;
        userpay.private = walletDetail.private;
        userpay.balance = (amount[0]/100000000);
        userpay.profit = (amount[1]/100000000).toString();
        userpay.amount = "0";
        userpay.updated_at = req.body["updated_at"];        
        insertItem(userpay,pay_coll_name)
        .then( async()=>{
          // await start(req.body.email, req.body.id,req.body.sec,req.body.strategy,req.body.param_id);
          res.send({message:"success"}).end();
        })
        .catch((err) => {
          console.log(err);
          res.status(500).end();
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(500).end();
      })
    }
    else {
      res.send({message:"email error"}).end();
    }
  }  
})
// client -------------------------------------------------
router.get('/api/backend_client', async (req, res) => {
  try {
    var clients = await getItemsAsync(client_coll_name);
    var items = [];
    for (let i=startNumber;i<endNumber;i++){
      try{
        var eachparam = await findone({param:clients[i].param_id},'tbl_'+clients[i].strategy);
        items.push({id:clients[i]._id, name:clients[i].username, username:clients[i].name, email: clients[i].email, exchange:clients[i].exchange, keyId:clients[i].id, keysec:clients[i].sec, strategy:clients[i].strategy, param:clients[i].param_id, pname:eachparam[0].name, manager:clients[i].created_by, status:clients[i].status, balance:clients[i].balance});
      }
      catch { console.log( " ---------------------- backend client error : ",error, clients[i] ); }
    }
    res.send(items).end();
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
})
router.get('/api/full_clients', async(req, res) => {
  var strategys = [];
  try {
    for (var i=0;i<strategy_coll_name.length;i++){
      var child = await distinctItems("param",strategy_coll_name[i]);
      for (var j=0;j<child.length;j++){
        var result = await findone({$and:[{strategy:strategy_coll_name[i].split("_")[1]},{param_id:child[j]}]},client_coll_name);
        strategys.push({name:strategy_coll_name[i].split("_")[1],param:child[j],users:result.length.toString()})
      }
    }
    res.send(strategys).end();
  } catch (error) {
    console.log(error);
    res.send(500).end();
  }  
})
router.post('/api/client', async(req, res) => {
  var strategys = [];
  try {
    var manager = await findone({_id:ObjectId(req.body.user_id)},user_coll_name);  
    for (var i=0;i<strategy_coll_name.length;i++){
      var child = await distinctItems("param",strategy_coll_name[i]);
      for (var j=0;i<child.length;j++){
        var result = await findone({$and:[{strategy:strategy_coll_name[i].split("_")[1]},{param_id:child[i]},{created_by:manager[0].username}]},client_coll_name);
        strategys.push({name:strategy_coll_name[i].split("_")[1],users:result.length.toString()});
      }
    }
    res.send(strategys).end();
  } catch (error) {
    console.log(error);
    res.send(500).end();
  }  
})
router.post('/api/edit_client', async(req, res) => {
  console.log(req.body);
  try {
    var emailcheck = await distinctQuery("_id",{email:req.body.email},client_coll_name);
    var managercheck = await findone({username:req.body.created_by},user_coll_name);  // manager username
    var amount = await bitgetwallet("./log/"+req.body.email.split("@")[0],req.body.id,req.body.sec);
    if (emailcheck[0] != req.body._id ){ res.send({message:"email exist"}).end(); }
    else if ( managercheck.length == 0){ res.send({message:"manager no"}).end(); }
    else if (amount[0] == 0){ res.send({message:"api no"}).end(); }
    else {
      var paramCheck = await findone({param:req.body.param_id},"tbl_" + req.body.strategy);
      if (paramCheck.length == 0){ res.send({message:"param no"}).end(); }
      else {
        req.body["balance"] = amount[0]/100000000;
        req.body["status"] = "pause";
        req.body["updated_at"] = (new Date()).toISOString();
        if (users.includes(req.body.id + "bitmex" + req.body.strategy)){ users = mypop(users, req.body.id + "bitmex" + req.body.strategy); }
        delete req.body["_id"];
        await updateQuantity({email:req.body.email},req.body,client_coll_name);
        res.send({message:"Updated as"}).end();
      }
    }
  } catch (error) { res.status(500).end(); }
})
router.post('/api/client_start', async(req, res) => {
  // console.log(req.body);
  let key = req.body.key; let sec = req.body.sec; let strategy =  req.body.strategy; let param = req.body.option;
  var result = await start(req.body.email,key,sec,strategy,param);
  if (result != false){ res.send(result).end(); }
  else { res.send({amount:"0",success:"api"}).end(); }
})
router.post('/api/client_pause', async(req, res) => {
  try {
    var key = req.body.key; var sec = req.body.sec; var strategy =  req.body.strategy;
    await pause("./log/" + req.body.email.split("@")[0] ,key, sec, strategy);
    res.send({message:"success"}).end();
  } catch (error) {
    res.status(500).end();
  }
})
router.post('/api/client_delete',async(req,res) => {
  var result = await findone({_id:ObjectId(req.body.user_id)},client_coll_name);
  delete result[0]["_id"];
  await removeItems({_id:ObjectId(req.body.user_id)},client_coll_name);
  await removeItems({client:result[0].username},pay_coll_name);
  insertItem(result[0],delete_coll_name)
  .then(() => { res.send({message:"success"}).end(); })
  .catch((err) => { res.status(500).end(); }) 
})
router.get('/api/total_pause', async(req, res) => {
  try {
    var others = "";
    var clients = await findone({status:"start"},client_coll_name);
    var clients = await getItemsAsync(client_coll_name);
    for (var i=startNumber;i<endNumber;i++){
      if ( clients[i].status == "start" ){
        try {
          let log_pause = "./log/" + clients[i].email.split("@")[0];
          var pos = await getEntry(log_pause, clients[i].id, clients[i].sec);
          console.log(" ----------------------------------------------- total pause : pos.unrealisedPnl, users[i] : ");
          if ( pos == false ) {  await pause(log_pause, clients[i].id, clients[i].sec, clients[i].strategy); }
          else if ( pos.unrealisedRoePcnt >= -0.005 ) {  await pause(log_pause, clients[i].id, clients[i].sec, clients[i].strategy); }
          else { others = others + "     " + clients[i].email; }
        } catch (error) {
          console.log(" -------------------------- error, problems", error);
        }           
      }
    }
    if ( others === "" ){ res.send({message:'no'}).end(); }
    else {  res.send({message:others}).end(); }
  } catch (error) {
    res.status(500).end();
  }
})
router.get('/api/total_start', async(req, res) => {
  res.status(200).end();
})
router.get('/api/total_sync', async(req, res) => {
  try {
    await checkbot();
    res.send({message:"sync"}).end();
  }
  catch { res.status(500).end(); }
})
// ------------------------------------------------------------------------------------ API END -----------
function mypop ( array, popitem ){
  var new_array = [];
  for(var index=0;index<array.length;index++)
  {
    if(array[index]!==popitem) new_array.push(array[index]);
  }
  array=new_array;
  return array;
}
async function updateBalance(key, sec){
  var amount = await bitgetamount(key,sec);
  console.log(amount);
  if ( amount != false){
    await updateQuantity({id:key},{balance:amount/100000000},client_coll_name);
  }
}
async function start(email, key,sec,strategy,param){
  if ( !users.includes(key+"bitmex"+strategy)){
    try {
      var option = await findone({param:param},"tbl_" + strategy);
      let logpath = "./log/" + email.split("@")[0];
      var bitamount = await bitgetwallet(logpath, key,sec);
      if (bitamount[0]/100000000 > 0.001){
        await updateQuantity({id:key},{status:"start",balance:(bitamount[0]/100000000).toString()},client_coll_name);
        users.push(key + "bitmex" + strategy);
        if ( fs.existsSync(logpath) ){
          console.log("exist") ;
        }
        else {
          fs.mkdir(logpath, { recursive: true }, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("New directory successfully created.");
            }
          })
        }
        let startStr = " --------------- ****** Start ****** ------------ \n" + key + "  :  " + strategy + "  :  " + param;
        filewrite(logpath, startStr);
        if (strategy === "strategy1"){ await bitstrategy1(logpath,key,sec,option[0],param); }
        else if (strategy === "strategy2"){ await bitstrategy2(logpath,key,sec,option[0],param); }
        else if (strategy === "strategy3"){ await bitstrategy3(logpath,key,sec,option[0],param); }
        return {amount:(bitamount[0]/100000000).toString(),success:"No orders"};
      }
      else { 
        await updateQuantity({id:key},{balance:(bitamount[0]/100000000).toString()},client_coll_name);
        return {amount:"0",success:"problem"}; }
    } catch (error) {
      return false;
    }
  }
  else {
    await updateBalance(key, sec);
    return {amount:"0",success:"orders"}; }
}
async function pause(log_pause, key, sec, strategy){
  if (users.includes(key + "bitmex" + strategy)){
    users = mypop(users, key + "bitmex" + strategy);
  }
  await bitdelall(log_pause, key,sec);
  await updateQuantity({id:key},{status:"pause"},client_coll_name);
  await updateBalance(key, sec);
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Bitmex ++++++
// ************************************** bit strategy 1 ******************************
async function bitstrategy1(filedir, key,secret,option,param){
  var orderopt = option;
  var orders = [];
  var orderIDs = [];
  var tporder = {orderID:""};
  var expires = parseInt(Date.now()/1000) + 15;
  var signature = Crypto.createHmac('sha256',secret).update('GET/realtime' + expires.toString()).digest('hex');
  var message = {"op": "authKeyExpires", "args": [key,expires,signature]};
  WebSocket(async function(websocket) { 
    websocket.send(JSON.stringify(message));
    await sleep(1000);
    websocket.send(JSON.stringify({"op": "subscribe", "args": "order"}));
    var timer = setInterval(()=>{
      try { websocket.ping(); } 
      catch (error) { 
        console.log( "bit1 timer error : ", error);
        clearInterval(timer);
      }
    }, 4000);
    websocket.on('message',async function(data) {
      websocket.ping();
      if (!users.includes(key + "bitmex" + "strategy1")){
        await bitdelall(filedir, key, secret);
        clearInterval(timer);
        websocket.close();
      }
      try {             
        var values = JSON.parse(data);
        if (values.table === "order") {
          if (values.action === "partial"){
            if ( values.data.length === 0){
              var amount = await bitgetamount(key,secret);
              if (amount <= 0.001){
                users = mypop(users, key + "bitmex" + "strategy1");
                clearInterval(timer);
                websocket.close();
                return ;
              }
              await updateQuantity({id:key},{balance:(amount/100000000)},client_coll_name);
              orders = [];
              var options = await findone({param:param},"tbl_strategy1");
              orderopt = options[0];
              orders = await bitmultiorder1(filedir, key,secret,orderopt,amount);
              if ( orders != false ){
                orderIDs = [];
                for (var p=0;p<orders.length;p++){
                  orderIDs.push(orders[p].orderID);
                }
              }
              else {
                await pause(filedir, clients[i].id, clients[i].sec, clients[i].strategy);
                return ;
              }
            }
          }
          else if ( values.action != "partial" && values.data.length > 0 ){
            if (values.action === "update" && values.data[0].ordStatus === "Filled"){
              filewrite(filedir, " -------------- values.action, values.data[0].ordStatus  : " + values.action + " : " + values.data[0].orderID + " : " + tporder.orderID);
              if (tporder.orderID === ""){
                await bitdelopp(filedir, key,secret,orderopt,values,orders,"strategy1");
              }
              else if (orderIDs.includes(values.data[0].orderID)){
                tporder = await bitupdatetp(filedir, key,secret,tporder,orderopt);
              }
              else if (values.data[0].orderID === tporder.orderID){
                await bitdelall(filedir, key,secret);
                await sleep(2000);
                var amount1 = await bitgetamount(key,secret);
                await updateQuantity({id:key},{balance:(amount1/100000000)},client_coll_name);
                if (amount1 <= 0.001){
                  users = mypop(users, key + "bitmex" + "strategy1");
                  clearInterval(timer);
                  websocket.close();
                  return ;
                }
                orders = [];
                var options1 = await findone({param:param},"tbl_strategy1");
                orderopt = options1[0];
                orders = await bitmultiorder1(filedir, key,secret,orderopt,amount1);
                if ( orders != false ){
                  orderIDs = [];
                  for (var p=0;p<orders.length;p++){
                    orderIDs.push(orders[p].orderID);
                  }
                  tporder = {orderID:""};
                }
                else {
                  await pause(filedir, key, secret, "strategy1");
                  return ;
                }
              }
            }
            else if (values.action === "insert" && values.data.length === 1){
                tporder = values.data[0];
            }
          }
        }            
      } catch (error) {
        filewrite( filedir, " --------------- bitstrategy1 error : \n" + error);
        await bitdelall(filedir, key,secret);
        await sleep(10000);
        var amount2 = await bitgetamount(key,secret);
        await updateQuantity({id:key},{balance:(amount2/100000000)},client_coll_name);
        if (amount2 <= 0.001){
          users = mypop(users, key + "bitmex" + "strategy1");
          clearInterval(timer);
          websocket.close();
          return ;
        }
        orders = [];
        var options2 = await findone({param:param},"tbl_strategy1");
        orderopt = options2[0];
        orders = await bitmultiorder1(filedir, key,secret,orderopt,amount2);
        if ( orders != false ){
          orderIDs = [];
          for (var p=0;p<orders.length;p++){
            orderIDs.push(orders[p].orderID);
          }
          tporder = {orderID:""};
        }
        else {
          await pause(filedir, key, secret, "strategy1");
          return ;
        }
        tporder = {orderID:""};
        filewrite(filedir, "  ------------ error in strategy  :  " + error);
      }
    });	 
    websocket.on('close', async function(e){
      console.log(e);
      filewrite(filedir, "  ------------ closed in strategy  :  " + new Date().toISOString());
      return ;
    });
  });
}
// ************************************** bit strategy 2 ******************************
async function bitstrategy2(filedir, key,secret,option,param){
  var orderopt = option;
  var orders = [];
  var orderIDs = [];
  var tporder = {orderID:""};
  var expires = parseInt(Date.now()/1000) + 15;
  var signature = Crypto.createHmac('sha256',secret).update('GET/realtime' + expires.toString()).digest('hex');
  var message = {"op": "authKeyExpires", "args": [key,expires,signature]};
  console.log("=================================================================");    
  WebSocket(async function(websocket) { 
    websocket.send(JSON.stringify(message));
    await await sleep(1000);
    websocket.send(JSON.stringify({"op": "subscribe", "args": "order"}));
    var timer = setInterval(()=>{
      try { websocket.ping(); } 
      catch (error) { 
        console.log( "bit2 timer error : ", error);
        clearInterval(timer);
      }
    }, 4000);
    websocket.on('message',async function(data) {
      if (!users.includes(key + "bitmex" + "strategy2")){
        await bitdelall(filedir, key, secret);
        clearInterval(timer);
        websocket.close();
      }
      try {     
        var values = JSON.parse(data);
        if (values.table === "order"){
          if (values.action === "partial"){
            if ( values.data.length === 0){
              var amount = await bitgetamount(key,secret);
              if (amount <= 0.001){
                users = mypop(users, key + "bitmex" + "strategy2");
                clearInterval(timer);
                websocket.close();
                return ;
              }
              await updateQuantity({id:key},{balance:(amount/100000000)},client_coll_name);
              orders = [];
              orderIDs = [];
              var options = await findone({param:param},"tbl_strategy2");
              orderopt = options[0];
              orders = await bitmultiorder2(filedir, key,secret,orderopt,amount);
              if ( orders !== false ){
                for (var i=0;i<orders.length;i++){
                  orderIDs.push(orders[i].orderID);
                }
              }
              else {
                await pause(filedir, key, secret, "strategy2");
                return ;
              }
            }
          }
          else if ( values.action != "partial" && values.data.length > 0 ){
          	if (values.action === "update" && values.data[0].ordStatus === "Filled"){
	          	if (tporder.orderID === ""){
	          	  await bitdelopp(filedir, key,secret,orderopt,values,orders,"strategy2");
	          	}
	          	else if (orderIDs.includes(values.data[0].orderID)){
	              tporder = await bitupdatetp2(filedir, key,secret,tporder,orderopt);
	            }
	            else if (values.data[0].orderID === tporder.orderID){
	              await bitdelall(filedir, key,secret);
                await sleep(10000);
	              var amount1 = await bitgetamount(key,secret);
                await updateQuantity({id:key},{balance:(amount1/100000000).toString()},client_coll_name);
	              if (amount1 <= 0.001){
	                users = mypop(users, key + "bitmex" + "strategy2");
	                clearInterval(timer);
	        		    websocket.close();
	                return ;
	              }
	              orders = [];
	              var options1 = await findone({param:param},"tbl_strategy2");
	              orderopt = options1[0];
				        orders = await bitmultiorder2(filedir, key,secret,orderopt,amount1);
                if ( orders !== false ){
                  orderIDs = [];
                  for (var i=0;i<orders.length;i++){
                    orderIDs.push(orders[i].orderID);
                  }
                  tporder = {orderID:""};
                }
                else {
                  await pause(filedir, key, secret, "strategy2");
                  return ;
                }
	            }
            }
            else if (values.action === "insert" && values.data.length === 1){
                tporder = values.data[0];
            }
          }
        }
      } catch (error) {
        filewrite(filedir, " ---- error in strategy2 : " + error);
      	await bitdelall(filedir, key,secret); await sleep(10000);
	      var amount2 = await bitgetamount(key,secret);
        await updateQuantity({id:key},{balance:(amount2/100000000).toString()},client_coll_name);
	      if (amount2 <= 0.001){
          users = mypop(users, key + "bitmex" + "strategy2");
          clearInterval(timer);
    		  websocket.close();
          return ;
        }
	      orders = [];
	      var options2 = await findone({param:param},"tbl_strategy2");
	      orderopt = options2[0];
		    orders = await bitmultiorder2(filedir, key,secret,orderopt,amount2);
	      if ( orders !== false ){
          orderIDs = [];
          for (var i=0;i<orders.length;i++){
            orderIDs.push(orders[i].orderID);
          }
          tporder = {orderID:""};
        }
        else {
          await pause(filedir, key, secret, "strategy2");
          return ;
        }
      }
    });	 
    websocket.on('close',function(e){
      filewrite(filedir, " ---- closed in strategy2 : ");
      return ;
    });
  });
}
// ************************************** bit strategy 3 ******************************
async function bitstrategy3(filedir, key,secret,option,param){
  var orderopt = option;
  var tporder = {orderID: ""};
  var expires = parseInt(Date.now()/1000) + 15;
  var signature = Crypto.createHmac('sha256',secret).update('GET/realtime' + expires.toString()).digest('hex');
  var message = {"op": "authKeyExpires", "args": [key,expires,signature]};
  var message1 = {"op": "subscribe", "args": "tradeBin"+orderopt.vol_size+":XBTUSD"};
  var message2 = {"op": "subscribe", "args": "order"};
  WebSocket(async function(websocket) { 
    websocket.send(JSON.stringify(message));
    await await sleep(1000);
    websocket.send(JSON.stringify(message1));
    await await sleep(1000);
    websocket.send(JSON.stringify(message2));
    var timer = setInterval(()=>{
      try { websocket.ping(); } 
      catch (error) {
        console.log( "bit3 timer error : ", error);
        clearInterval(timer);
      }
    }, 4000);
    websocket.on('message',async function(data) {
      if (!users.includes(key + "bitmex" + "strategy3")){
        await bitdelall(filedir, key, secret);
        clearInterval(timer);
        websocket.close();
        return ;
      }
      console.log("-----------------------------------------------------------------")
      try {     
        var values = JSON.parse(data); 
        if (values.table === "tradeBin" + orderopt.vol_size){
          try{
            if ( tporder.orderID === "" && values.data[0].volume >= parseInt(orderopt.vol)){
              var position = await getEntry(filedir, key, secret);
              if ( position != false ){
                try { if (position.currentQty != "0"){ await bitdelall(filedir, key, secret); }  }
                catch ( error ){ console.log("position bit3 no error ------------------------- ", position); }
              }
              var options = await findone({param:param},"tbl_strategy3");
              orderopt = options[0];
              var order = await bitcheckvol(filedir, key, secret, orderopt, );
              if (order == false ){ console.log("Side is not valid."); }
              else { tporder = order; var amount2 = await bitgetamount(key,secret); 
                filewrite(filedir, " ------------------------- bitcheckvol  --- result  :  " + order.orderQty + "   " + order.price  + "   " +  order.orderID);
              	await updateQuantity({id:key},{balance:(amount2/100000000)},client_coll_name); 
              }
            }
          } catch(error) {
            filewrite(filedir, " -------- bitstrategy3 tradeBin error  :  " + error);
            await sleep(1000 * 60);
          }
        }
        else if(values.table === "order") {
          if (values.data.length > 0){
            if ((values.action === "update") && (values.data[0].ordStatus === "Filled")){
              if (values.data[0].orderID === tporder.orderID){
                await bitdelall(filedir, key,secret);
                tporder = {orderID:""};
              }
              else if (values.data[0].orderID != tporder.orderID ){
                var anyorder = await bitupdatetp(filedir, key,secret,tporder,orderopt);
                if ( anyorder != false) { tporder = anyorder; }
              } 
            }}
          }
        }  
      catch (error) {
        filewrite(filedir, " ------- bitstrategy3 error  :  " + error);
      }
    });	 
    websocket.on('close',function(e){
      console.log(e);
      filewrite(filedir, " ------- bitstrategy3 closed  :  " + new Date().toISOString());
      return ;
    });
  });
}
// ====================================================================================================== Check Profit
async function checkprofit(){
  var clients = await getItemsAsync("tbl_pay");
  for (var i=startNumber;i<endNumber;i++){
    await sleep(10000);
    try {
      var eachclient = await findone({username:clients[i].client},"tbl_client");
      let log_checkprofit = "./log/"+eachclient[0].email.split("@")[0];
      var wallets = await bitgetwallet(log_checkprofit, eachclient[0].id,eachclient[0].sec);
      if ( wallets[0] == 0 || ( wallets[1]/100000000 == 0 && parseFloat(clients[i].profit) == 0 )) { continue; }
      console.log(" -------------------------- check new profit amount each client: ", wallets[1]/100000000, clients[i].profit, clients[i].wallet, clients[i].client);
      var profit = (wallets[1]/100000000 - parseFloat(clients[i].profit)) * 0.5; // profit is new profit 50%   * 0.5   profit is mine.
      var balance = parseFloat(clients[i].balance);
      if ( parseFloat(clients[i].balance) < wallets[0]/100000000 - profit*2 ) {
        balance = wallets[0]/100000000 - profit*2;
        await updateQuantity({client:clients[i].client},{balance:(wallets[0]/100000000 - profit*2)},pay_coll_name);
      }
      var eachuser = await findone({username:clients[i].m_user}, "tbl_user");
      console.log(" --------------------------- profit, profit*2/balance*100 ,(profit - 0.0005) * parseFloat(eachuser[0].m_comis)/100, (profit - 0.0005) * (1-parseFloat(eachuser[0].m_comis)/100) \n", profit, profit*2/balance*100 ,(profit - 0.0005) * parseFloat(eachuser[0].m_comis)/100, (profit - 0.0005) * (1-parseFloat(eachuser[0].m_comis)/100));
      if ( profit >= 0.0025 && profit/balance*2*100 >= parseFloat(eachuser[0].u_comis) && (profit - 0.0005) * parseFloat(eachuser[0].m_comis)/100 >= 0.001 && (profit - 0.0005) * (1-parseFloat(eachuser[0].m_comis)/100) >= 0.001 ){
        var account = new CryptoAccount(clients[i].private);  
        var walletBal = await account.getBalance("BTC"); await sleep(1000);
        console.log(" -------------------------- Check wallet balance : ", eachclient[0].email, walletBal, profit, parseFloat(eachuser[0].m_comis)/100);
        if ( profit <= walletBal + 0.0002 ){
          var amountAdmin = profit*parseFloat(eachuser[0].m_comis)/100;
          try {
            var adminuser = await findone({username:"RooT858#"},"tbl_user");
            await account.send(adminuser[0].wallet, amountAdmin - 0.0001, "BTC"); await sleep(1000);
          } catch (error) { console.log(" ++ ===  Problem in transaction1." ); }
          try {
            var amountManager = await account.getBalance("BTC"); 
            await account.send(eachuser[0].wallet, amountManager - 0.0001, "BTC"); await sleep(1000);
            // await new Promise((resolve, reject) =>
            //   account.send(eachuser[0].wallet, amountManager, "BTC", {subtractFee: true, fee: 10000})
            //     .on("confirmation", confirmations => { if (confirmations >= 6) { resolve(); } })
            //     .catch(reject)
            //   );
          } catch (error) { console.log(" ++ ===  Problem in transaction2." ); }
          console.log(" ========================= success : payment ", {client:clients[i].client},{balance:(wallets[0]/100000000),profit:(wallets[1]/100000000).toString(), amount:walletBal.toString(),updated_at:(new Date()).toISOString()},pay_coll_name);
          await updateQuantity({client:clients[i].client},{balance:(wallets[0]/100000000), profit:(wallets[1]/100000000).toString(), amount:walletBal.toString(),updated_at:(new Date()).toISOString()},pay_coll_name);
          if (eachclient[0].status === "pause") { await start(eachclient[0].email, eachclient[0].id, eachclient[0].sec, eachclient[0].strategy, eachclient[0].param_id); }
        }
        else {
          console.log( " --------------------------- invoice email detail : ", eachclient[0].email,(parseFloat(eachuser[0].u_comis)).toString(), profit, walletBal, eachuser[0].name, clients[i].wallet );
          await sendemail("pragmatismer666@gmail.com","Payment Request",eachclient[0].email + " get over " + (parseFloat(eachuser[0].u_comis)).toString() + "% profit by Bot.<br>So you need to send " + ( profit - walletBal ).toString() + "BTC to Manager(" + eachuser[0].name + ").<br>Wallet (Address : " + clients[i].wallet + " )");
          await sleep(1000);
          await sendemail(eachclient[0].email,"Payment Request","You get over " + (parseFloat(eachuser[0].u_comis)).toString() + "% profit by Bot.<br>So you need to send " + ( profit - walletBal ).toString() + "BTC to Manager(" + eachuser[0].name + ").<br>Wallet (Address : " + clients[i].wallet + " )");
          if (eachclient[0].status === "start"){
            try {
              pos = await getEntry(logdir,eachclient[0].id, eachclient[0].sec);
              var pos_flag = false;
              if ( pos == false ){ pos_flag = true;}
              else if ( pos.unrealisedRoePcnt >= -0.01 ){ pos_flag = true; }
              if ( pos_flag ){ 
                users = mypop(users, eachclient[0].id + eachclient[0].exchange + eachclient[0].strategy);
                await updateQuantity({username:clients[i].client},{status:"pause"},client_coll_name);
                await bitdelall(logdir, eachclient[0].id, eachclient[0].sec);
              }
            } catch (error) {
              console.log(error, " -----------  check profit pause account");
            }
          }
        }
      }
    } catch (error) {
      console.log(error, " ====  check profit.");
    }
  } 
}
// ====================================================================================================== Check Bot 
async function checkbot(){
  console.log(" =============================== ++++++++++++++++++++++++ =================================" );
  var m_clients = await getItemsAsync(client_coll_name);
  console.log( " ---------------- start status clients number : ", m_clients.length);
  for ( var i = startNumber; i < endNumber; i++ ){
    if ( m_clients[i].status == "start"){
      var pos;
      await sleep(10000);
      try{
        let log_checkbot = "./log/"+m_clients[i].email.split("@")[0];
        filewrite(log_checkbot, " ------ start check bot ------ **** ------------")
        if (users.includes(m_clients[i].id + "bitmex" + m_clients[i].strategy)){
          var orderlen = 16; var option;
          if (m_clients[i].strategy == 'strategy1'){ 
            option = await findone({param:m_clients[i].param_id}, 'tbl_strategy1');
            orderlen = option[0].buyd.length + option[0].selld.length;
          }
          else if ( m_clients[i].strategy == 'strategy2' ){ option = await findone({param:m_clients[i].param_id}, 'tbl_strategy2'); }
          else if ( m_clients[i].strategy == 'strategy3'){ 
            option = await findone({param:m_clients[i].param_id}, 'tbl_strategy3');
            orderlen = parseInt(option[0].orders);
          }
          var existOrders = await checkOrders(log_checkbot, m_clients[i].id, m_clients[i].sec);
          filewrite(log_checkbot, " --------------------- checkbot existOrders.length   :  " + m_clients[i].username + " : " + m_clients[i].strategy + " : " + existOrders.length);
          var run_flag = true;
          if ( existOrders.length > 0 && existOrders.length < orderlen){
            for (let j=1;j<existOrders.length;j++){ if ( existOrders[j].transactTime !== existOrders[0].transactTime ){ run_flag = false; } }
            pos = await getEntry(log_checkbot,m_clients[i].id, m_clients[i].sec);
            filewrite(log_checkbot, " --------------------- checkbot run_flag result   :  " + run_flag + " : \n" + JSON.stringify(pos));
            if ( run_flag ){
              var pos_flag = false;
              if ( pos == false ){ pos_flag = true; }
              else if ( pos.unrealisedRoePcnt >= -0.005 && existOrders.length > 1 ){ pos_flag = true; }
              if ( pos_flag ){
                users = mypop(users, m_clients[i].id + "bitmex" + m_clients[i].strategy);
              }
            }
            else {
              if ( pos == false ){
                users = mypop(users, m_clients[i].id + "bitmex" + m_clients[i].strategy);
              }
              else {
                var takeOrder = existOrders[0];
                for (let k=1;k<existOrders.length;k++){ if ( new Date(existOrders[k].transactTime) > new Date(takeOrder.transactTime) ){ takeOrder = existOrders[k]; } }
                if ( takeOrder.orderQty != pos.currentQty ){ await changeOrder( m_clients[i].id, m_clients[i].sec, m_clients[i].strategy, takeOrder, option[0], pos); }
              }
            }
          }
        }
        else {
          filewrite(log_checkbot, " --------------------- checkbot non include  :  \n" + JSON.stringify(pos));
          pos = await getEntry(log_checkbot,m_clients[i].id, m_clients[i].sec);
          if ( pos == false ) { await start(eachclient[0].email, m_clients[i].id, m_clients[i].sec, m_clients[i].strategy, m_clients[i].param_id); }
          else if ( pos.unrealisedRoePcnt >= -0.005 ) {
            await bitdelall(log_checkbot, m_clients[i].id, m_clients[i].sec); 
            await sleep(1000*60);
            await start(eachclient[0].email, m_clients[i].id, m_clients[i].sec, m_clients[i].strategy, m_clients[i].param_id);
          }
        }
      }
      catch (error){ console.log( " --------------------- check bot m_clients[i].id, m_clients[i].email error ",m_clients[i].id, m_clients[i].email, error); }
    }
  }
}
// ======================================================================================================  Check take profit 
module.exports = router
