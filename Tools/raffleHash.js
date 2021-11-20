const zeroPad = (num, places) => String(num).padStart(places, '0')

function run() {
    let resultField = document.getElementById("resultField");
    let tx_hash_text_hex = document.getElementById("tx_hash").value.trim();
    let ticket_cnt = parseInt(document.getElementById("ticket_cnt").value.trim());
    let prize_cnt = parseInt(document.getElementById("prize_cnt").value.trim());

    resultField.textContent = "";

    var rawHash = sjcl.codec.hex.toBits(tx_hash_text_hex);
    resultField.textContent += "Original tx_hash to start with: " + sjcl.codec.hex.fromBits(rawHash) + "\n";
    resultField.textContent += "\n";

    var tcktCntBn = BigInt(ticket_cnt);

    for (i = 0; i < prize_cnt; i++) {

        rawHash = sjcl.hash.sha256.hash(rawHash)
        console.log(rawHash)
        txt_hash = sjcl.codec.hex.fromBits(rawHash)
        console.log(txt_hash)

        var bigNm = BigInt("0x" + txt_hash)
        var winnerMod = bigNm % tcktCntBn

        resultField.textContent += "[" + zeroPad(i+1,2) + "] SHA265: " + txt_hash + "\n";
        resultField.textContent += "winner ID: " + winnerMod + "\n";
        resultField.textContent += "\n";
    }
}