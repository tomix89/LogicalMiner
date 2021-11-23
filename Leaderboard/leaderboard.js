const zeroPad = (num, places) => String(num).padStart(places, '0')

window.onload = function() {
    run();
};

function run() {
    let resultField = document.getElementById("resultField");
    resultField.textContent = "Loading...";

    let querry = 'https://api.alienworlds.io/v1/alienworlds/mines?landowner=auurg.wam' +
        '&from=2021-11-21T06:00:00' +
        '&to=2021-12-05T19:00:00' +
        '&sort=desc' +
        '&limit=5000';

    fetch(querry)
        .then(response => response.json())
        .then(json => {

            let minerDict = {};

            let maxSingleMine = {
                miner: "",
                time: new Date('01 Jan 1970 00:00:00 GMT'),
                amount: 0.0
            };

            if (json && json.results && json.results.length > 0) {
				
				if (json.results.length >= 4999) {
					resultField.textContent = "API is sending incomplete data"
					return;					
				}
				
                for (let i = 0; i < json.results.length; i++) {
                    let mined = json.results[i].bounty / 10000;
                    let time = json.results[i].block_timestamp;
                    let miner = json.results[i].miner;

                    // if miner is already in
                    if (miner in minerDict) {
                        minerDict[miner].mined += mined;
                        minerDict[miner].count++;
                    } else {
                        let struct = {mined: mined, count: 1};
                        minerDict[miner] = struct;
                    }

                    if (maxSingleMine.amount < mined) {
                        maxSingleMine.amount = mined;
                        maxSingleMine.time = new Date(time);
                        maxSingleMine.miner = miner;
                    }

                }

                console.log("Total items returned: " + json.results.length);
                console.log("Unique miners: " + Object.keys(minerDict).length);

                // create array from dict
                var items = Object.keys(minerDict).map(function(key) {
                    return [key, minerDict[key]];
                });

                // sort the array based on the mined sum
                items.sort(function(first, second) {
                    return second[1].mined - first[1].mined;
                });

                loadTableData(items);
                resultField.textContent = "Max amount by single mine:" + "\n" +
                    maxSingleMine.miner + "\n" +
                    maxSingleMine.amount.toFixed(4) + " TLM" + "\n" +
                    maxSingleMine.time.toISOString().replace('T', ' ').replace('Z', '') + " UTC" + "\n" +
                    "\n\n" +
					"Max sum. mined:" + "\n";
					resultField.textContent += items[0][0] + "\n" +
                    items[0][1].mined.toFixed(4) + " TLM" + "\n" +
					"\n\n" +
                    "Max mine count:" + "\n";
                // sort the array based on the mine count
                items.sort(function(first, second) {
                    return second[1].count - first[1].count;
                });
                resultField.textContent += items[0][0] + "\n" +
                    items[0][1].count + 
				 "\n\n" +
				 "--------------------------------------" + 
				 "\n\n" +
				 "Total number of miners:" + "\n" +
				 items.length + 
				 "\n\n" +
				 "Total number of mine attempts:" + "\n" +
				 json.results.length;


            } else {
                resultField.textContent = "Alien Wolds API is busy (or error happened).\nTry a few seconds later (reload - F5). API responded: " + json;
            }
        }).catch(error => {
            resultField.textContent = "ERROR: " + error;
        });
}

function loadTableData(items) {
    const table = document.getElementById("testBody");
    items.forEach(item => {
        let row = table.insertRow();
        let cell0 = row.insertCell(0);
        cell0.innerHTML = item[0];
        let cell1 = row.insertCell(1);
        cell1.innerHTML = item[1].mined.toFixed(4) + " TLM";
        let cell2 = row.insertCell(2);
        cell2.innerHTML = item[1].count;
    });
}
