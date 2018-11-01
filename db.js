// // to start mongodb: ../../../usr/local/cellar/mongodb/3.4.10/bin/mongod --dbpath ../database_gestures/diagnostics




const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'myproject';
 
// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
 
  const db = client.db(dbName);
  insertDocuments(db, function() {
    client.close();
  });
  // client.close();
});

const insertDocuments = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('disperfReports');
  // Insert some documents
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
}


// const mongoose = require('mongoose'); // An Object-Document Mapper for Node.js
// const assert = require('assert'); // N.B: Assert module comes bundled with Node.js.
// mongoose.Promise = global.Promise; // Allows us to use Native promises without throwing error.

// // Connect to a single MongoDB instance. The connection string could be that of a remote server
// // We assign the connection instance to a constant to be used later in closing the connection
// const db = mongoose.connect('mongodb://localhost:27017/report-manager', {useNewUrlParser: true });

// // Converts value to lowercase
// function toLower(v) {
//   return v.toLowerCase();
// }

// // Define an iperf report Schema
// const iperfReport = mongoose.Schema({
//   attempt: { type: Number },
//   dateISO: { type: String },
//   bandwidth: { type: String },
//   send: [
//     { interval:
//       [{type: String, set: interval}, {type: String, set: unit}]
//     }, 
//     { transfer:
//       { type: String }
//     }, 
//     { bandwidth:
//       { type: String }
//     }, 
//     { write:
//       { type: Number }
//     }, 
//     { error:
//       { type: Number }
//     }, 
//     { pps:
//       { type: Number }
//     }
//   ],
//   receive: [
//     { interval:
//       { type: String }
//     }, 
//     { transfer:
//       { type: String }
//     }, 
//     { bandwidth:
//       { type: String }
//     }, 
//     { write:
//       { type: Number }
//     }, 
//     { error:
//       { type: Number }
//     }, 
//     { pps:
//       { type: Number }
//     }
//   ]
// });

// // Define model as an interface with the database
// const dbReport = mongoose.model('Report', iperfReport);

// /**
//  * @function  [addReport]
//  * @returns {String} Status
//  */
// const addReport = (report) => {
//   dbReport.create(report, (err) => {
//     assert.equal(null, err);
//     console.info('New report added');
//     db.disconnect();
//   });
// };

// /**
//  * @function  [getReport]
//  * @returns {Json} dbReports
//  */
// const getReport = (name) => {
//   // Define search criteria. The search here is case-insensitive and inexact.
//   const search = new RegExp(name, 'i');
//   dbReport.find({$or: [{firstname: search }, {lastname: search }]})
//   .exec((err, report) => {
//     assert.equal(null, err);
//     console.info(report);
//     console.info(`${report.length} matches`);
//     db.disconnect();
//   });
// };

// // Export all methods
// module.exports = { addReport, getReport };