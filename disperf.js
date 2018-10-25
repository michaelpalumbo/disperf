#!/usr/bin/env node
const express = require('express'); 
const fs = require("fs");
const { exec } = require('child_process')
const sendmail = require('sendmail')()
const date = require('date-and-time');
const shell = require("vorpal")();
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const path = require("path");


var reportJSON = [];
// let now = new Date();

bandwidth = 100000000
increment = 100000000

var startDate = date.format(new Date(), 'YYYY-MM-DD_HH-mm-ss')
// CLI args: 
var interval = 30 * 60 * 1000;
// keep track of number of intervals run since start.
var intervalCount = 0;
// default max number of intervals. default at 48, set this using '-n 24'
var numIntervals = 336;
// location and name for the report output
var reportFile = __dirname + '/report_' + date.format(new Date(), 'YYYY-MM-DD_HH-mm-ss') + '.txt'
var fileName = 'report_' + date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + '.txt'
var chartData = 'client/data/report_' + date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + '.csv'

// the log from all stdout/stderr messages, to be sent to client upon connection. 
var logfile = 'client/data/sessionlog.csv'
// grab the ip to ip connection details
var connection; //iperf connection details

var report; //container for the report to be sent by email... 
//track number of times iperf runs in an attempt

// websocket stuff:

let sessionId = 0;
let sessions = [];
// runs = 1;

const client_path = path.join(__dirname + '/client')
// client hosting
const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
	res.sendFile(path.join(client_path, 'index.html'));
});
//app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app);
// add a websocket service to the http server:
const wss = new WebSocket.Server({ server });

// launch the client in chrome:
exec('/usr/bin/open -a "/Applications/Google Chrome.app" \'http://localhost:8080\'')

// send a (string) message to all connected clients:
function send_all_clients(msg) {
	wss.clients.forEach(function each(client) {
		client.send(msg);
	});
}

// whenever a client connects to this websocket:
wss.on('connection', function(ws, req) {
  // it defines a new session:
let session = {
  id: sessionId++,
  socket: ws,
};
sessions[session.id] = session;
console.log("server received a connection, new session " + session.id);
console.log("server has "+wss.clients.size+" connected clients");

const location = url.parse(req.url, true);
// You might use location.query.access_token to authenticate or share sessions
// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)


  // get list of chart reports for client:
  var chartFiles = fs.readdirSync(__dirname + '/client/data/');


msg = JSON.stringify({
  //session: session.id,
  date: Date.now(),
  type: "fileList",
  value: chartFiles
})
wss.clients.forEach(function each(client) {

  
  client.send(msg);
});

ws.on('error', function (e) {
  if (e.message === "read ECONNRESET") {
    // ignore this, client will still emit close event
  } else {
    console.error("websocket error: ", e.message);
  }
});

// what to do if client disconnects?
ws.on('close', function(connection) {
  console.log("session", session.id, "connection closed");
  delete sessions[session.id];
});

// respond to any messages from the client:
ws.on('message', function(e) {
  //console.log(e)
  if(e instanceof Buffer) {
    // get an arraybuffer from the message:
    const ab = e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);
    console.log("session", session.id, "received arraybuffer", ab);
    // as float32s:
    console.log(new Float32Array(ab));
  } else {
    // get JSON from the message:
    try {
      let msg = JSON.parse(e);
      console.log("session", session.id, "received JSON", msg);
      handleMessage(msg, session);

    } catch (e) {
      console.log('bad JSON: ', e);
    }
  }
});



// // Example sending binary:
// const array = new Float32Array(5);
// for (var i = 0; i < array.length; ++i) {
// 	array[i] = i / 2;
// }
// ws.send(array);
});

server.listen(8080, function() {
console.log('server listening on %d', server.address().port);
});

function handleMessage(msg, session) {
	console.log("message from client: " + msg)
	switch (msg.type) {

		case "getFile": {
      requestedFile = fs.readFileSync(__dirname + '/client/data/' + msg.value, 'utf8')

      update = JSON.stringify({
        //session: session.id,
        date: Date.now(),
        type: "loadFile",
        value: requestedFile
      })
      wss.clients.forEach(function each(client) {
  
        
        client.send(update);
      });

		}
	

		break
		
	}
}

function send_log(data){
  console.log("\n\n\n\n\n\n\n\n\nsending...")
  msg = JSON.stringify({
    //session: session.id,
    date: Date.now(),
    type: "log",
    value: data
  })
  wss.clients.forEach(function each(client) {
    client.send(msg);
  });
}

// interactive shell! 

// use this to exit the script using 'end'. this will trigger a send of the report to Doug and Michael
shell
  .command('end', 'Outputs "closing iperf session".')
  .action(function(args, callback) {
    fs.writeFileSync(reportFile, 'disperf manually terminated by user at ' + date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss'),function(err){
    });
    console.log('emailing log report... please wait');
    sendmail({
      from: 'info@palumbomichael.com',
      to: 'dvnt.sea@gmail.com, info@palumbomichael.com',
      subject: 'disperf report',
      text: ('disperf manually exited. see logfile at ' + reportFile + '\n\n' + report)
    }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
      console.log('\n\nScript end. See logfile at ' + reportFile)

      // exit script after email sent
      process.exit()
    });
    
    callback();
  });
// show disperf shell cmd
shell
  .delimiter('disperf$')
  .show();

// print the report while disperf is running
shell
  .command('log', 'Outputs "retrieving log, please wait".')
  .action(function(args, callback) {
    report = fs.readFileSync(reportFile, 'utf8')
      console.log(report)
  callback();
  })
// show disperf shell cmd
shell
  .delimiter('disperf$')
  .show();

// send a report to Doug during the disperf session
shell
  .command('sendreport', 'Outputs "sending incomplete report to Doug and Michael".')
  .action(function(args, callback) {
    report = fs.readFileSync(reportFile, 'utf8')
    console.log('emailing log report... please wait');
    sendmail({
      from: 'info@palumbomichael.com',
      to: 'dvnt.sea@gmail.com, info@palumbomichael.com',
      subject: 'mid-session disperf report',
      text: ('User requested mid-session report sent: ' + reportFile + '\n\n' + report)
    }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
      console.log('\n\n' + reportFile + ' sent to dvnt.sea@gmail.com and info@palumbomichael.com')
    });
    
    callback();
  });
// show disperf shell cmd
shell
  .delimiter('disperf$')
  .show();

// launch the disperf webapp
shell
  .command('stats', 'Outputs "view stats in webapp".')
  .action(function(args, callback) {
  exec('/usr/bin/open -a "/Applications/Google Chrome.app" \'http://localhost:8080\'')

  });
// show disperf shell cmd
shell
  .delimiter('disperf$')
  .show();


// list the available commands
shell 
  .command('help', 'Outputs "list the available commands".')
  .action(function(args, callback) {
    console.log('\n\n  log  --  prints the entire report for this session up to this moment\n  end  --  exit the script early but still trigger the sending of the report to Doug and Michael\n  sendreport  --  send the most recent-version (yet uncomplete) version of the report to Doug and Michael\nstats -- open the disperf webapp')
  })
// show disperf shell cmd
shell
  .delimiter('disperf$')
  .show();

  /*
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
*/

console.log('report interval set to ' + interval / 60 / 1000 + ' minutes')
console.log('number of intervals set to ' + numIntervals)

// our scheduling logic
function scheduler() {
  // run iperf once at start
  intervalCount++;
  console.log('Current report interval: ' + intervalCount)
  // create report file and add a header
  // reportJSON.push(
  //   { header:
  //   { date: date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss'), attempts: numIntervals, attemptRate: interval / 60 / 1000}
  // })
  // console.log(reportJSON)
  fs.writeFileSync(reportFile, 'Dispersion Lab iperf generated report: ' + startDate + '\nReport interval rate: ' + interval / 60 / 1000 + ' minutes\nNumber of intervals: ' + numIntervals + '\n',function(err){
  });
  fs.writeFileSync(chartData, 'date,interval,timeUnit,transferred,transferUnit,bandwidth,bandwidthUnit,writeError,pps,ppsLabel\n',function(err){
  });
  fs.writeFileSync('client/data/data.csv', 'date,interval,timeUnit,transferred,transferUnit,bandwidth,bandwidthUnit,writeError,pps,ppsLabel\n',function(err){
  });

  fs.writeFileSync('client/data/logfile.csv', '',function(err){
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
  // keep track of number of times iperf runs in attempt
  
  console.log("Bandwidth increment set at " + bandwidth / 1000000 + " Mbps")
  exec('iperf -u -c 171.64.197.158 -p 4464 -e -b ' + bandwidth, (stdout, stderr, err) => {
    // the following requires iperf version 2.0.12:
    array = stderr.match(/[^\r\n]+/g);
    output = stderr
    connection = array[5].split("]")[1]
    header = array[6].split("]")[1]
    data = array[7].split("]")[1]
    string = array[7].split("/sec  ")[1].replace("/", " ")
    // send to client in this order:
    send_log(data)
    send_log(header)
    send_log(connection)
    send_log(date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss'))
    
    
    
    
    fs.appendFileSync(reportFile, '\nInterval: ' + intervalCount + '\n' + date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + '\nbandwidth set at: ' + bandwidth / 1000000 + ' Mbps\n' + header + '\n' + data + '\n',function(err){
      if(err)
        console.error(err);
    });

    // create a csv of the reportFile for the client graph. remove extra spaces, then replace all remaining single-spaces with commas
    csv = data.replace(/ +(?= )/g,'').replace(/ /g, ',');



    fs.appendFileSync(chartData, date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + csv + '\n',function(err){
      if(err)
        console.error(err);
    });
    console.log(date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + '\n' + csv)
    fs.appendFileSync('client/data/data.csv', date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + csv + '\n',function(err){      
      if(err)
        console.error(err);
    });

    // fs.appendFileSync('client/data/logfile.csv', date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + '\n' + header + '\n' + data + '\n',function(err){      
    //   if(err)
    //     console.error(err);
    // });


    
    // send_all_clients("graphUpdate")

    update = JSON.stringify({
      //session: session.id,
      date: Date.now(),
      type: "graphUpdate",
      value: "graphUpdate"
    })
    wss.clients.forEach(function each(client) {

      
      client.send(update);
    });
    // session.socket.send(JSON.stringify({
    //   session: session.id,
    //   date: Date.now(),
    //   type: "graphUpdate",
    //   value: "graphUpdate"
    // }));

    attempt = intervalCount
    
    // TODO: get the json reporting going as well, then setup sending it to mongodb
    // report2json(attempt, runs, bandwidth)
    // runs++
    // console.log(JSON.stringify(reportJSON, null, 2))
    var numbers = string.match(/\d+/g).map(Number);
    console.log('\n\n\n\n' +bandwidth)
    if (bandwidth > 1000000000 ){
      console.log("Dispersion Lab theoretical limit of 1Gbps reached, awaiting next attempt")
      send_log("Dispersion Lab theoretical limit of 1Gbps reached, awaiting next attempt")
      return
    }
    // prevent dividing by zero if no errors
    if (numbers[1] > 0 ) {
      packetLoss = numbers[0] / numbers[1]

      if (packetLoss > 0.5 ){
        bandwidth = (bandwidth + increment)
        iperf()
        } else{
          console.log("packet loss cap reached, awaiting next attempt")
          send_log(date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss') + '\npacket loss success/fail ratio of ' + numbers[0] + '/' + numbers[1] + ' exceeds cap, reached @ bandwidth ' + bandwidth / 1000000 + ' Mbps -- \n\nEnd of Interval ' + intervalCount + '\n')
          fs.appendFileSync(reportFile, '-- packet loss success/fail ratio of ' + numbers[0] + '/' + numbers[1] + ' exceeds cap, reached @ bandwidth ' + bandwidth / 1000000 + ' Mbps -- \n\nEnd of Interval ' + intervalCount + '\n',function(err){
            if(err)
              console.error(err);
          });
          return;
        }
      }       
      else {
        //console.log(" 0 packets lost") 
        bandwidth = (bandwidth + increment)
        iperf()
      }
  })
}

// run the scheduler!
scheduler();

// function report2json(attempt, run, bandwidth) {
//   reportJSON.push({ 
//     startDate: startDate,
//     reportDate: date.format(new Date(), 'YYYY-MM-DD_HH:mm:ss'),
//     attempt: attempt,
//     run: run,
//     bandwidth: bandwidth
//     })
//   console.log(reportJSON)
// }



