#!/usr/bin/env node
const express = require('express'); 
const fs = require("fs");
const { exec, execSync } = require('child_process')
const sendmail = require('sendmail')()
const date = require('date-and-time');
const shell = require("vorpal")();
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const path = require("path");

console.log(process.argv[2])

switch(process.argv[2]){

    case 'c':
    case 'client':
    execSync('node client.js')

    break;

    case 's':
    case 'server':
    execSync('node server.js')
    break;
    
    case undefined:
    console.log('error: disperf must be run with client or server mode specified e.g. \n"npm start server" \nor \n"npm start client"')
}
