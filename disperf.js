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

console.log(process.argv[2])

switch(process.argv[2]){

    case '-c':
    case '--client':
    exec('node client.js')

    break;

    case '-s':
    case '--server':
    exec('node server.js')
    break;
}