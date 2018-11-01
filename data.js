const fs = require("fs");

var files = fs.readdirSync(__dirname + '/client/data/');


console.log(files)