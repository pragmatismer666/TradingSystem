const Crypto = require('crypto');
const fetch = require('node-fetch');

var id ="cOvdr3WzhmkMYZjV5CGFVg8L";
var sec = "zl11t6J17T_p5bkPqwW77mfkEpyYZFxTSSDcZvl7UhdgOvl2";

var test = setTimeout( async() => {await bitgetwallet(id, sec)}, 1000);

async function getRes(url,options){
    var result = false;
    await fetch(url,options)
      .then(res=>res.json()) 
      .then((text) => {
        // console.log(text);
        result = text;
      })
      .catch((error) => {
        console.log(error);
      })
    return result;
  }


async function bitgetwallet(key,secret){
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
    if (text == false){ return "false"; }
    else {
      var total; var profit;
      console.log(text);
      for(var i=0;i<text.length;i++){
        if (text[i].currency == "XBt"){
          if (text[i].transactType == "Total"){ total = text[i].amount; }
          else if ( text[i].transactType == "RealisedPNL"  && text[i].symbol == "XBTUSD" ){ profit = text[i].amount; }
        }
      }
      console.log(" ----------------------------- total, profit in getwallet : " , total, profit);
      return [total, profit];
    }
  }