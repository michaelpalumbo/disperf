const fs = require("fs");
const { exec } = require('child_process')
const sendmail = require('sendmail')()
const date = require('date-and-time');

let now = new Date();

bandwidth = 100000000

var startDate = date.format(now, 'YYYY-MM-DD_HH-mm-ss')
// CLI args: 
var interval = 30 * 60 * 1000;
// keep track of number of intervals run since start.
var intervalCount = 0;
// default max number of intervals. default at 48, set this using '-n 24'
var numIntervals = 336;
// location and name for the report output
var reportFile = __dirname + '/report_' + date.format(now, 'YYYY-MM-DD_HH-mm-ss') + '.txt'
var fileName = 'report_' + date.format(now, 'YYYY-MM-DD_HH:mm:ss') + '.txt'
// grab the ip to ip connection details
var connection; //iperf connection details

var report; //container for the report to be ent by email... 
/*
 to do...
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
*/

// function sendemail () {
//   //report = 
//   sendmail({
//     from: 'info@palumbomichael.com',
//     to: 'dvnt.sea@gmail.com, info@palumbomichael.com',
//     subject: 'disperf report',
//     html: JSON.stringify(fs.readFileSync(reportFile, {encoding: 'utf8'})),
//   }, function(err, reply) {
//     console.log(err && err.stack);
//     console.dir(reply);
//   });
//   //  console.log(report)
// }

// send an email every 24 hours to indicate script is running. 86400000ms
runStatusInterval = 86400000
function runStatus(){
  sendmail({
    from: 'info@palumbomichael.com',
    to: 'dvnt.sea@gmail.com, info@palumbomichael.com',
    subject: 'disperf run status',
    text: ('disperf.js started at ' + startDate)
  }, function(err, reply) {
    console.log(err && err.stack);
    console.dir(reply);
  });

  setInterval(function() {
    sendmail({
        from: 'info@palumbomichael.com',
        to: 'dvnt.sea@gmail.com, info@palumbomichael.com',
        subject: 'disperf run status',
        text: ('disperf.js still running, since ' + startDate + '\n\nCurrent attempt: ' + intervalCount)
      }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    });
  }, runStatusInterval);
}

// run the disperf status emailer
runStatus()

console.log('report interval set to ' + interval / 60 / 1000 + ' minutes')
console.log('number of intervals set to ' + numIntervals)

// our scheduling logic
function scheduler() {
  // run iperf once at start
  intervalCount++;
  console.log('Current report interval: ' + intervalCount)
  // create report file and add a header
  fs.writeFileSync(reportFile, 'Dispersion Lab iperf generated report: ' + date.format(now, 'YYYY-MM-DD_HH:mm:ss') + '\nReport interval rate: ' + interval / 60 / 1000 + ' minutes\nNumber of intervals: ' + numIntervals + '\n',function(err){
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
      // email.send(report)
      });
      report = fs.readFileSync(reportFile, 'utf8')
      console.log(report)
      function email () {
      sendmail({
          from: 'info@palumbomichael.com',
          to: 'dvnt.sea@gmail.com, info@palumbomichael.com',
          subject: 'disperf report',
          text: ('see logfile at ' + reportFile + '\n\n' + report)
        }, function(err, reply) {
          console.log(err && err.stack);
          console.dir(reply);
          console.log('\n\nScript end. See logfile at ' + reportFile)

          // exit script after email sent
          process.exit()
        });
      }
      // send email report to Doug and Michael
      email()
    }
  }, interval);
}

// run iperf, check against bandwidth
function iperf() {
  console.log("Bandwidth increment set at " + bandwidth / 1000000 + " Mbps")
  exec('iperf -u -c 171.64.197.158 -p 4464 -e -b ' + bandwidth, (stdout, stderr, err) => {
    // the following requires iperf version 2.0.12:
    array = stderr.match(/[^\r\n]+/g);
    output = stderr
    connection = array[5].split("]")[1]
    header = array[6].split("]")[1]
    data = array[7].split("]")[1]
    string = array[7].split("/sec  ")[1].replace("/", " ")

  fs.appendFileSync(reportFile, '\nInterval: ' + intervalCount + '\n' + date.format(now, 'YYYY-MM-DD_HH:mm:ss') + '\nbandwidth set at: ' + bandwidth / 1000000 + ' Mbps\n' + header + '\n' + data + '\n',function(err){
    if(err)
      console.error(err);
  });
  var numbers = string.match(/\d+/g).map(Number);
  // prevent dividing by zero if no errors
  if (numbers[1] > 0 ) {
    packetLoss = numbers[0] / numbers[1]

    if (packetLoss > 0.5 ){
      bandwidth = (bandwidth + 100000000)
      iperf()
      } else{
        console.log("packet loss cap reached, awaiting next attempt")
        fs.appendFileSync(reportFile, '-- packet loss success/fail ratio of ' + numbers[0] + '/' + numbers[1] + ' exceeds cap, reached @ bandwidth ' + bandwidth / 1000000 + ' Mbps -- \n\nEnd of Interval ' + intervalCount + '\n',function(err){
          if(err)
            console.error(err);
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

// run the scheduler!
scheduler();


