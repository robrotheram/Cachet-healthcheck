var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var app = express();
var Config = require("./Config.json");
console.log(Config);

var request = require("request");
var cheerio = require("cheerio");

function getHTML(host,xpath,expected,obj) {
  request("http://"+host, function (error, response, body) {
    if (!error) {
      var $ = cheerio.load(body);
      if($(xpath).text() == expected){
          sendStatus(obj,1);
          obj.status = 1;
          if(obj.incidentSent != undefined){
              obj.incidentSent = false;
          }
      }else{
          if(obj.status == undefined){obj["status"] = 2;}
          if(obj.status > 4){
              obj["status"] = 4;
              createIncident(obj);
          }
          sendStatus(obj,obj.status);
          obj.status++;
      }
    } else {
        if(obj.status == undefined){obj["status"] = 2;}
        if(obj.status > 4){
            obj["status"] = 4;
            createIncident(obj);
        }
        sendStatus(obj,obj.status);
        obj.status++;
    }
  });
}
var net    = require('net'), Socket = net.Socket;
var checkPort = function(port, host, callback) {
  var socket = new Socket(), status = null;
  // Socket connection established, port is open
  socket.on('connect', function() {status = 'open';socket.end();});
  socket.setTimeout(1500);// If no response, assume port is not listening
  socket.on('timeout', function() {status = 'closed';socket.destroy();});
  socket.on('error', function(exception) {status = 'closed';});
  socket.on('close', function(exception) {callback(null, status,host,port);});
  socket.connect(port, host);
}


function createIncident(obj) {
    if(obj.incidentSent != undefined){
        if(obj.incidentSent){
            return;
        }
    }
    var request = require('request');
    var requestData ={
        "name": obj.URL+" is Experiencing Issues",
        "message": obj.URL+ " has not responded to a automated ping in over 5 mins",
        "status": 1,
        "visible": 1,
        "component_id": obj._id,
        "component_status": 4,
        "notify": true,
        "vars": []
    };
    var formData = JSON.stringify(requestData);
    var contentLength = requestData.length;
    request({
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/json',
            'X-Cachet-Token': Config.config.TokenURL
        },
        uri: 'http://'+Config.config.APTURL+'/api/v1/incidents/',
        body: formData,
        method: 'POST'
    }, function (err, res, body) {
        console.log("Incident Request sent");
        obj["incidentSent"] = true;
    });
}



function sendStatus(obj,status){
    var request = require('request');
    var requestData ={
        "status": status,
        "enabled": true
    };
    var formData = JSON.stringify(requestData);
    var contentLength = requestData.length;
    request({
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/json',
            'X-Cachet-Token': Config.config.TokenURL
        },
        uri: 'http://'+Config.config.APTURL+'/api/v1/components/'+obj._id,
        body: formData,
        method: 'PUT'
    }, function (err, res, body) {
        console.log("Rquest sent");
    });
}

function check() {
    Config.routes.forEach(function (obj) {
        if(obj.TYPE=="HTML"){
            getHTML(obj.URL, obj.XPATH, obj.EXPECTED, obj);
        }else{
            checkPort(obj.PORT, obj.URL, function(error, status, host, port){
                if(status == "open"){
                    sendStatus(obj,1);
                    obj.status = 1;
                    if(obj.incidentSent != undefined){
                        obj.incidentSent = false;
                    }
                }else{
                    if(obj.status == undefined){obj["status"] = 2;}
                    if(obj.status > 4){
                        obj["status"] = 4;
                        createIncident(obj);
                    }
                    sendStatus(obj,obj.status);
                    obj.status++;
                }
            });
        }
    })
}
check();
setInterval(function(){
    check();
}, 10 * 1000);

module.exports = app;
