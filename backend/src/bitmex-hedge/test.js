import Account from "./Account";

const config = {
    apiKey: "8YuBMSTwjf-lfWFAeCNlI6a4",
    secret: "V790WXM7kk6FGHySz9nXWVTkqFjq6VviGla6y1bv2FoostOb",
    urls: {
      api: "https://testnet.bitmex.com"
    }
};

(async function() {
    let account = new Account(config);
    await account.init()
    console.log(await account.getBalance());
    
})();
