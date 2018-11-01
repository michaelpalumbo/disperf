#!/usr/bin/env node
const express = require('express'); 
const fs = require("fs");
const { exec, execSync, spawn } = require('child_process')
const sendmail = require('sendmail')()
const date = require('date-and-time');
const shell = require("vorpal")();
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const ip= require('ip');

const path = require("path");

const terminalLink = require('terminal-link');
 
const webApp = terminalLink('disperf diagnostics page', 'localhost:8080');
//console.log(ip.address())
switch(process.argv[2]){

    case 'c':
    case 'client':

    if (!process.argv[3]){
        console.log("error: client mode expecting Server IP. \n\nTry: 'npm start client nnn.nnn.nnn.nnn'")
        process.exit()
    } else{
        console.log('\ntemporary: client mode does not log to console. for stats and stdout see the ' + webApp)
        
        shell
        .command('end', 'Outputs "closing client".')
        .action(function(args, callback) {
            // ensure iperf stops running in background
            process.exit()
        }, 2000);
        // show disperf shell cmd
        shell
        .delimiter('disperf$')
        .show();
        exec('node client.js ' + process.argv[3])


    }
 

    break;

    case 's':
    case 'server':
        console.log('=*=*=*=*=*=\nThis machine\'s public IP is ' + ip.address() + '\n*=*=*=*=*=*=')
        const server = spawn('iperf', ['-s', '-u', '-p', '4464']);
        const serverPID = server.pid
        console.log('\niperf pid', serverPID)
        console.log('\n=*=*=*=*=*=*=*=*=*=*=*=*=*=\nIMPORTANT: \nplease type "end" + Enter, instead of "crtl-c" to exit this script!\n=*=*=*=*=*=*=*=*=*=*=*=*=*=\n' )
        // use this to exit the script using 'end'. this will trigger a send of the report to Doug and Michael
        shell
        .command('end', 'Outputs "closing iperf session".')
        .action(function(args, callback) {
            // ensure iperf stops running in background
            exec('kill ' + serverPID)
            // exit script
            console.log(`exiting... wait a few seconds\n\nstopping pid ${serverPID}`);
            setTimeout(function(){
            console.log(`\n\npid kill ${serverPID} complete\n`);
            process.exit()
        }, 2000);

        });
        // show disperf shell cmd
        shell
        .delimiter('disperf$')
        .show();
        // const server = spawn('node', ['server.js']);

        server.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
      
          // array = data.match(/[^\r\n]+/g);
          //   output = stderr
          //   connection = array[5].split("]")[1]
          //   header = array[6].split("]")[1]
          //   data = array[7].split("]")[1]
          //   string = array[7].split("/sec  ")[1].replace("/", " ")
          // console.log(`array: ${array}`);
      
        });
      
        server.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        
        });
        
        server.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    break;
    
    case undefined:
    console.log('error: disperf must be run with client or server mode specified e.g. \n"npm start server" \nor \n"npm start client <SERVER_IP_ADDRESS>"')
}
