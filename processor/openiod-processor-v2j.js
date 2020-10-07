/*
** Module: openiod-processor-v2j.js
**  Module to process source data
**
**
**
*/

/*

Id: openiod-processor-v2j
Processor module for vtec pull service.
This module validates and transforms attribute from the external system

Copyright (C) 2020  André van der Wiel / Scapeler https://www.scapeler.com

This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or
send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.along with this program.
If not, see <https://www.gnu.org/licenses/>.

*/

"use strict";
// **********************************************************************************
// add module specific requires

const axios = require('axios')
const influx = require('influx');

// **********************************************************************************

var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOFOI 			: { "message": 'Feature of Interest missing'	, "returnCode": 501 }
	, NOMODEL 			: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
}
var self = this;
var logger;
var _sourceData;
var _defaults;
var _openIoDConfig

var influxInstance

var clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var mapFields = function(source,dataBlock,mapping,fields) {
	var _fields=fields
	for (var key in dataBlock) {
		if (mapping[key] != '_exclude_') {
			var newKey = mapping[key]
			if(source.sourceController[key]) {
				var targetValue = source.sourceController[key](dataBlock[key])
				if (targetValue != undefined) _fields[newKey]=clone(targetValue)
			} else {
				logger.info(' No validation for attribute '+ key);
				_fields[newKey]=dataBlock[key];
			}
		}
	}
	return _fields
}

var sendDataToTargetAsPromise = function(service,data) {
	var _target= service.target
	var _source= service.source
	influxInstance = new influx.InfluxDB({
		host: _target.host,
		port: _target.port,
		protocol: _target.protocol,
		database: _target.database,
		username: _target.user,
		password: _target.password,
		schema: _target.schema
	})
	var inData = data.Item;
	var fieldName, mapping, dataBlock

	if (_source.sourceController) {
		_source.sourceController.init(service,data,_openIoDConfig);
	}

	var measurement = {}

	if (_source.sourceController.getDefaults) {
		_source.sourceController.setDefaults();
		measurement = _source.sourceController.getDefaults();
	}
	measurement.measurement		= _target.schema[0].measurement
	measurement.tags = {
		sensorid: inData.deviceID,
		project: _target.project
	}
	measurement.fields = {}
	var timestampDate = new Date(inData.timestamp)
	measurement.timestamp = timestampDate

  measurement.fields = mapFields(_source,inData.data.locationData,_source.attributeMap.locationData.attributes,measurement.fields)
	measurement.fields = mapFields(_source,inData.data.sensorData,_source.attributeMap.sensorData.attributes,measurement.fields)
	measurement.fields = mapFields(_source,inData.data.meteoData,_source.attributeMap.meteoData.attributes,measurement.fields)

	if (1==1) {
		logger.info(measurement)
//		logger.info(measurement.fields)

		// test empty object ECMA 5+:
		// because Object.keys(new Date()).length === 0;
		// we have to do some additional check
		if (Object.keys(measurement.fields).length === 0 && measurement.fields.constructor === Object ) {
//		if (measurement.fields=={} ) {
			logger.info('No valid attributes found, record wil be skipped ')
			return '406' //406 not acceptable
		}
		return influxInstance.writePoints([
			measurement
		])
		.catch(err => {
			logger.info('ERROR Write to InfluxDB: ' + err) //err.res.statusCode)
			logger.info(measurement.fields)
//				res.status(500)
//				.send(err.stack)
//			logger.info('helaas een status ' + err.res.statusCode)
			return 'error' //err.res.statusCode;
		})
	}

//				where host = ${Influx.escape.stringLit(os.hostname())}
//				order by time desc
/*
	logger.info('Toon laatste records in Influx database:')
	influxInstance.query('select * from m_ApriSensor order by time desc limit 3')
	.then(result => {
		logger.info(result);
		//res.json(result)
	})
	.catch(err => {
		logger.info(err)
		//res.status(500).send(err.stack)
		return;
	})
*/

}

var getStationsAsPromise = function(service) {
	logger.info('getStationsAsPromise')
	var _source= service.source
	var _url = _source.protocol+"://"+_source.host+":"+_source.port+_source.prefixPath+_source.path
	logger.info(_url)

	var options = {
		hostname: _source.host,
		port: 		_source.port,
		path: 		_source.prefixPath+_source.path,
		method: 	_source.method,
		headers: {
				 //'Content-Type':'application/json',
				 'accept': 'application/json',
				 'x-api-key': _source.token
			 },
		url:_url
	};

	return axios.get(_url,options)
}
var getStationDataAsPromise = function(service, id) {
	logger.info('getStationDataAsPromise')
	var _source= service.source
	var _url = _source.protocol+"://"+_source.host+":"+_source.port+_source.prefixPath+_source.path + id
	logger.info(_url)
	var options = {
		hostname: _source.host,
		port: 		_source.port,
		path: 		_source.prefixPath+_source.path,
		method: 	_source.method,
		headers: {
				 //'Content-Type':'application/json',
				 'accept': 'application/json',
				 'x-api-key': _source.token
			 },
		url:_url
	};
	return axios.get(_url,options)
}

module.exports = {
	init: function (service,openIoDConfig) {
		_openIoDConfig = openIoDConfig
		//logger.info('Init process module for service '+service.serviceName);
		logger = openIoDConfig.logger
		logger.info('Logger exported')
		getStationsAsPromise(service) // returns promise
		.then(function(value) {
			logger.info(value.data)
			var ids = value.data.data
			ids.reduce((p, _ ,i)=>
				p.then( _ => new Promise(resolve => {
					getStationDataAsPromise(service,ids[i])
					.then(function(idData) {
						//console.dir(idData.data.data.Item.data)
						sendDataToTargetAsPromise(service,idData.data.data)
						resolve()
					})
				}
				))
			,Promise.resolve());
		})
	}
}
//"use strict";
// **********************************************************************************
