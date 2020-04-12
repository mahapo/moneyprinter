const fs = require('fs');
const request = require('request');
const asyncNode = require('async');
let url = 'https://min-api.cryptocompare.com/data/histo/minute/daily?'
url += 'api_key=1e955a3db6ebefa38240546e91c3f8add1737ef032c8dd05dfd836d942e0e53e'
url += '&fsym=BTC&tsym=USDT&e=cccagg&date='
const days = 10; //We want to download the last 100 days
const currentTs = Date.now();
const end = currentTs - currentTs%(60*60*24*1000); 
const start = end - 1000*60*60*24*days;
const daysStr = [];
//Generate date strings for download
for (let i=start; i<=end; i=i+1000*60*60*24) {
   let day = new Date(i)
   daysStr.push(day.toISOString().split('T')[0]);
}
asyncNode.eachSeries(daysStr, function(day, dayDone){
   let urlToCall = url + day;
   request(urlToCall, function(err, res, body){
       console.log(body);
       
//    fs.writeFileSync('./data/cryptocompare_BTC_USDT_' + day + '.csv', body, 'utf8');
   dayDone()
   });
});