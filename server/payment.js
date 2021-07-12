const CryptoAccount = require("send-crypto");

async function createwallet(){
    const privateKey = CryptoAccount.newPrivateKey();
    const account = new CryptoAccount(privateKey);
    var address = await account.address("BTC");
    console.log(address);
    console.log(privateKey);
    console.log("---------------------------------");
    return {address:address,private:privateKey}
}

module.exports = { createwallet }