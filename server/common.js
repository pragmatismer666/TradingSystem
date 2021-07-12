
const sgMail = require('@sendgrid/mail');
const fetch = require('node-fetch');
const fs = require("fs");
var path = require('path');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey("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");

function filewrite(filepath, content){
  try {
    if ( !fs.existsSync(filepath) ){
      fs.mkdir(filepath, { recursive: true }, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("New directory successfully created.");
        }
      });
    }
    let realpath = filepath + "/" + new Date().toISOString().slice(0, 10) + ".txt";
    if (!fs.existsSync(realpath)){
      fs.writeFileSync(realpath, content + "   :    " + new Date().toISOString(), { mode: 0o755 });
    }
    else {
      fs.appendFileSync(realpath, "\n\n" + content + "   :    " + new Date().toISOString(), { mode: 0o755 });
    }
  } catch(err) {
    // An error occurred
    console.error(err);
  }
}

async function sendemail(email,sub,content){
    // console.log(email,sub,content);
    var success_flag = true;
    const msg = {
        to: email,
        from: 'bitcoinbotts@gmail.com',
        subject: sub,
        text: content,
        html: '<div><strong>' + content + '</strong></div>',
    };
    sgMail
    .send(msg)
    .then(() => {
        success_flag = true;
    })
    .catch((error) => {
        console.error(error);
        success_flag = false;
    })
    return success_flag;
}
  
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  
async function postRes(url,options,headers){
  var result;
  await fetch(url,{
    method:"POST",
    body:options,
    headers:headers
  })
    .then(res=>res.json()) 
    .then((text) => {
      result = text;
      // console.log(result);
    })
    .catch((error) => {
      console.log(error);
    });
  return result;
}

async function fixOrder(m_method, url, data, headers){
  await fetch(url,{
    method:m_method,
    body:data,
    headers:headers
  })
    .then(res=>res.json()) 
    .then((text) => {
      result = text;
    })
    .catch((error) => {
      console.log(error);
  });
  await sleep(1000);
  return result;
}

module.exports = { filewrite, sendemail, sleep, getRes, postRes, fixOrder };