const zeroPad = (num, places) => String(num).padStart(places, '0')

window.onload = function() {
    run();
};

async function run() {
    let resultField = document.getElementById("resultField");
    resultField.textContent = "Loading...";

    const from = new Date("2021-11-21T06:00:00Z");
    const to = new Date("2021-12-05T20:59:59.999Z")
    let data = await downloadData(from, to);
    let uid = 0;

    const curr_event_lbl = document.getElementById("curr_event");
    curr_event_lbl.innerHTML = "Current Event:\n" +
        from.toISOString().replace('T', ' ').substring(0, 19) + " UTC" +
        "  -  " +
        to.toISOString().replace('T', ' ').substring(0, 19) + " UTC";

    // test for null
    if (data) {
        let items = []; // array to store the uids in
        let minerDict = {}; // to track unique miners

        for (let i = 0; i < data.length; i++) {
            let time = Number(data[i].created_at_time);
            let miner = data[i].sender_name;
            let cnt = data[i].assets.length

            for (let asset = 0; asset < cnt; asset++) {
                items.push({uid: uid, miner: miner, time: time });
                uid++;
            }

            // if miner is already in
            if (miner in minerDict) {
                minerDict[miner] += cnt;
            } else {
                minerDict[miner] = cnt;
            }
        }

        console.log("Total items returned: " + data.length + " from that NFT count: " + uid);
        loadTableData(items);

        resultField.textContent = "Total tickets: " + uid + "\n" +
            "Total unique senders: " + Object.keys(minerDict).length +
            "                "; // dummy space to have at least some width

    }
}

function loadTableData(items) {
    const table = document.getElementById("testBody");
    items.forEach(item => {
        let row = table.insertRow();
        let cell0 = row.insertCell(0);
        cell0.innerHTML = item.uid;
        let cell1 = row.insertCell(1);
        cell1.innerHTML = item.miner;
        let cell2 = row.insertCell(2);
        cell2.innerHTML = new Date(item.time).toISOString().replace('T', ' ').substring(0, 19) + " UTC";
    });
}


// from is past, to is future
// we are polling newest to oldest
async function downloadData(from, to) {

    let doPollMore = true;
    let page = 1;
    let retVal = []; // here comes the json.results
    const pollSize = 100;

    while (doPollMore) {

        // theoretically we3 are wasting resources to not to define the 'from' parameter for the request
        // because then the full sized poll will be returned (limit)
        // BUT AW has a bug, when the 'from' and 'to' is really near, and there are no action inside that interval
        // the API fails to return anything instead of returning an empty array in the response
        let querry = 'https://wax.api.atomicassets.io/atomicassets/v1/transfers?recipient=logicalraffl' +
            '&template_id=350665' +
            '&collection_name=logicalmnfts' +
            '&before=' + to.getTime() +
            '&after=' + from.getTime() +
            '&page=' + page +
            '&limit=' + pollSize +
            '&order=asc&sort=created'; // sorted by time - oldest first - mowing page from past

        console.log(querry);

        await fetch(querry)
            .then(response => response.json())
            .then(json => {
                if (json && json.data && json.data.length > 0) {

                    retVal = retVal.concat(json.data);

                    // if we have a full poll, then there are more data
                    doPollMore = json.data.length == pollSize;
                    page++;

                } else {
                    resultField.textContent = "AtomicHub API returned wrong answer.\nTry a few seconds later (reload - F5)";
                    return null;
                }
            }).catch(error => {
                resultField.textContent = "ERROR: " + error;
                return null
            });
    }

    return retVal;
}