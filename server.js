const fs = require("fs");
// const path = require("path");
// const os = require("os");
const { exec } = require('child_process')
const sendmail = require('sendmail')();


bandwidth = 100000000

// CLI args: 
var interval = 30 * 60 * 1000;
// keep track of number of intervals run since start.
var intervalCount = 48;
// default max number of intervals. default at 48, set this using '-n 24'
var numIntervals = 1;
// location and name for the report output
var reportFile = __dirname + '/report_' + new Date().toISOString() + '.txt'
// grab the ip to ip connection details
var connection; //iperf connection details

/* to do...
// CLI args! There's probably a more efficient way to do this...
if (process.argv[2], process.argv[4]){
  switch (process.argv[2]){
    case "-h":
    case "--help":
    console.log("-i, --interval: set the interval time in minutes between runs of iperf. Default: 30\n-n, --numIntervals: set the number of intervals to run through for an entire report Default: 48)");
    break;

    case "-i":
    case "--interval":
    interval = process.argv[3] * 60 * 1000;
    console.log('report interval set to ' + process.argv[3] + ' minutes')
    break;

    case "-n":
    case "numIntervals":
    numIntervals = process.argv[3];
    console.log('number of intervals set to ' + process.argv[3])
    break;
  }
  switch (process.argv[4]){
    case "-h":
    case "--help":
    console.log("-i, --interval: set the interval time in minutes between runs of iperf. Default: 30\n-n, --numIntervals: set the number of intervals to run through for an entire report Default: 48)");
    break;

    case "-i":
    case "--interval":
    interval = process.argv[5] * 60 * 1000;
    console.log('report interval set to ' + process.argv[3] + ' minutes')
    break;

    case "-n":
    case "numIntervals":
    numIntervals = process.argv[5];
    console.log('number of intervals set to ' + process.argv[3])
    break;
  }
}


function sendemail () {
  report = fs.readFileSync(reportFile, {encoding: 'utf8'})
  console.log(report)
  sendmail({
    // from: 'info@palumbomichael.com',
    // to: 'info@palumbomichael.com ',
    subject: 'disperf report',
    html: report,
  }, function(err, reply) {
    console.log(err && err.stack);
    console.dir(reply);
  });
}
*/
console.log('report interval set to ' + interval / 60 / 1000 + ' minutes')
console.log('number of intervals set to ' + numIntervals)

// our scheduling logic
function scheduler() {
  // run iperf once at start
  intervalCount++;

  console.log('Current report interval: ' + intervalCount)
  
  // create report file and add a header
  fs.writeFileSync(reportFile, 'Dispersion Lab iperf generated report: ' + new Date().toISOString() + '\nReport interval rate: ' + interval / 60 / 1000 + ' minutes\nNumber of intervals: ' + numIntervals + '\n',function(err){
  });

  // generate a report
  iperf()

  // run iperf at every next interval.
  setInterval(function() {
    // reset bandwidth to min. 
    bandwidth = 100000000
    intervalCount++;
    if (intervalCount <= numIntervals) {
      console.log('Current report interval: ' + intervalCount)
      iperf()
      // do your stuff here
    } else {
      // write text file!
      fs.appendFileSync(reportFile, 'connection data:' + connection,function(err){
        if(err)
          console.error(err);
        console.log('Appended!');
      });
      // send an email with the contents of the report to someone (not yet ready)
      // sendemail();

      // exit script
      process.exit()
    }

  }, interval);

}

function iperf() {

  console.log("Bandwidth set at " + bandwidth / 1000000 + " Mbps")
  exec('iperf -u -c 171.64.197.158 -p 4464 -e -b ' + bandwidth, (stdout, stderr, err) => {
    // fs.writeFileSync("report.text"), err, 'utf8')
    array = stderr.match(/[^\r\n]+/g);
    output = stderr
    connection = array[5].split("]")[1]
    header = array[6].split("]")[1]
    data = array[7].split("]")[1]
    string = array[7].split("/sec  ")[1].replace("/", " ")

  fs.appendFileSync(reportFile, '\nInterval: ' + intervalCount + '\n' + new Date().toISOString() + '\nbandwidth set at: ' + bandwidth / 1000000 + ' Mbps\n' + header + '\n' + data + '\n',function(err){
    if(err)
      console.error(err);
    console.log('Appended!');
  });
  var numbers = string.match(/\d+/g).map(Number);
  // prevent dividing by zero if no errors
  if (numbers[1] > 0 ) {
    packetLoss = numbers[0] / numbers[1]

    if (packetLoss > 0.5 ){
      bandwidth = (bandwidth + 100000000)
      iperf()
      } else{
        console.log("packet loss cap reached")
        fs.appendFileSync(reportFile, '-- packet loss success/fail ratio of ' + numbers[0] + '/' + numbers[1] + ' exceeds cap, reached @ bandwidth ' + bandwidth / 1000000 + ' Mbps -- \n\nEnd of Interval ' + intervalCount,function(err){
          if(err)
            console.error(err);
          console.log('Appended!');
        });
        return;
      }
    } else {
      //console.log(" 0 packets lost") 
      bandwidth = (bandwidth + 100000000)
      iperf()
    }

  })


}

scheduler();


