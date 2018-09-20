const fs = require("fs");
// const path = require("path");
// const os = require("os");
const { exec } = require('child_process')


bandwidth = 100000000
report = {};

function iperf() {
  console.log("\nbandwidth set at " + bandwidth + " bps")
  exec('iperf -u -c 171.64.197.158 -p 4464 -e -b ' + bandwidth, (stdout, stderr, err) => {
    // fs.writeFileSync("report.text"), err, 'utf8')
    array = stderr.match(/[^\r\n]+/g);
    output = stderr

    console.log(array[6].split("]")[1])
    console.log(array[7].split("]")[1])
    string = array[7].split("/sec  ")[1].replace("/", " ")
    var numbers = string.match(/\d+/g).map(Number);
    // prevent dividing by zero if no errors
    if (numbers[1] > 0 ) {
      packetLoss = numbers[0] / numbers[1]

      if (packetLoss > 0.5 ){
        bandwidth = (bandwidth + 100000000)
        iperf()
      } else{
        console.log("packet loss cap reached")
        return;
      }
    } else {
      console.log(" 0 packets lost")
      bandwidth = (bandwidth + 100000000)
      iperf()
    }
    // report = JSON.stringify({

      // date: stderr[0],
      // localIP: stderr[1],
      // localPort: stderr[2],
      // remoteIP: stderr[3],
      // remotePort: stderr[4],
      // interval: stderr[5],
      // transfer: stderr[6],
      // bandwidth: stderr[7],
    })


}
iperf()
