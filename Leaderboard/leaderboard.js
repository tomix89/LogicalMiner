const zeroPad = (num, places) => String(num).padStart(places, '0')

window.onload = function() {
    run();
};

async function run() {
    let resultField = document.getElementById("resultField");
    resultField.textContent = "Loading...";

    const from = new Date("2021-12-19T19:02:00Z")
    const to = new Date("2022-01-03T19:00:00Z")
    let results = await downloadData(from, to);
    let usedResultsCnt = 0;

    const curr_event_lbl = document.getElementById("curr_event");
    curr_event_lbl.innerHTML = "Mines are counted in:\n" +
                               from.toISOString().replace('T', ' ').substring(0, 19)  + " UTC" +
                               "  -  " +
                               to.toISOString().replace('T', ' ').substring(0, 19) + " UTC";

    // test for null
    if (results) {
        let minerDict = {};
        let maxSingleMine = {
            miner: "",
            time: new Date('01 Jan 1970 00:00:00 GMT'),
            amount: 0.0
        };

        for (let i = 0; i < results.length; i++) {
            let mined = results[i].bounty / 10000;
            let time = results[i].block_timestamp;
            let miner = results[i].miner;

            if (new Date(time) < from) {
                usedResultsCnt = i + 1;
                break;
            }

            // if miner is already in
            if (miner in minerDict) {
                if (minerDict[miner].time < time) {
                    minerDict[miner].time = time
                }
                minerDict[miner].mined += mined;
                minerDict[miner].count++;
            } else {
                let struct = {mined: mined, time: time, count: 1};
                minerDict[miner] = struct;
            }

            if (maxSingleMine.amount < mined) {
                maxSingleMine.amount = mined;
                maxSingleMine.time = new Date(time);
                maxSingleMine.miner = miner;
            }
        }

        console.log("Total items returned: " + results.length + " from that used: " + usedResultsCnt);
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
            usedResultsCnt;
    }

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
        let cell3 = row.insertCell(3);
        cell3.innerHTML = timeSince(item[1].time);
    });
}


// from is past, to is future
// we are polling newest to oldest
async function downloadData(from, to) {

    let doPollMore = true;
    let lastPolledGlobSeq = Number.MAX_VALUE;
    let retVal = []; // here comes the json.results

    while (doPollMore) {

        // theoretically we3 are wasting resources to not to define the 'from' parameter for the request
        // because then the full sized poll will be returned (limit)
        // BUT AW has a bug, when the 'from' and 'to' is really near, and there are no action inside that interval
        // the API fails to return anything instead of returning an empty array in the response
        let querry = 'https://api.alienworlds.io/v1/alienworlds/mines?landowner=auurg.wam' +
            '&sort=desc' +
            '&limit=3333';

        if (lastPolledGlobSeq == Number.MAX_VALUE) {
            // we don't know where we are - use date
            querry += '&to=' + to.toISOString();
        } else {
            // we are polling repeatedly - use global sequence to not to have dupes
            querry += '&global_sequence_to=' + lastPolledGlobSeq;
        }
        console.log(querry);

        await fetch(querry)
            .then(response => response.json())
            .then(json => {
                if (json && json.results && json.results.length > 0) {

                    retVal = retVal.concat(json.results);
                    lastPolledGlobSeq = json.results[json.results.length - 1].global_sequence;

                    if (new Date(json.results[json.results.length - 1].block_timestamp) < from) {
                        doPollMore = false;
                    }
                } else {
                    resultField.textContent = "Alien Wolds API returned wrong answer.\nTry a few seconds later (reload - F5)";
                    return null;
                }
            }).catch(error => {
                resultField.textContent = "ERROR: " + error;
                return null
            });
    }

    return retVal;
}
// based on
// https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site/23259289#23259289
var timeSince = function(date) {
    if (typeof date !== 'object') {
        date = new Date(date);
    }

    var seconds = Math.floor((new Date() - date) / 1000);
    var intervalType;

    var interval = Math.floor(seconds / 604800);
    if (interval >= 1) {
        intervalType = 'week';
    } else {
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            intervalType = 'day';
        } else {
            interval = Math.floor(seconds / 3600);
            if (interval >= 1) {
                intervalType = "hour";
            } else {
                interval = Math.floor(seconds / 60);
                if (interval >= 1) {
                    intervalType = "minute";
                } else {
                    interval = seconds;
                    intervalType = "second";
                }
            }
        }
    }

    if (interval > 1 || interval === 0) {
        intervalType += 's';
    } else {
        intervalType = ((intervalType === 'hour') ? 'an ' : 'a ') + intervalType;
    }

    return intervalType + ' ago';
};
