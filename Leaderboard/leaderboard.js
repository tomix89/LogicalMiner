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

            if (json && json.results && json.results.length > 0) {
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
                }

                console.log("Total items returned: " + json.results.length);
                console.log("Unique miners: " + Object.keys(minerDict).length);

                // create array from dict
                var items = Object.keys(minerDict).map(function(key) {
                    return [key, minerDict[key]];
                });

                // sort the array based on the second element
                items.sort(function(first, second) {
                    return second[1].mined - first[1].mined;
                });

                loadTableData(items);
                resultField.textContent = "";
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
