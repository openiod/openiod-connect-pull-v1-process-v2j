/*
** Module: openiod-controller-v2j.js
**  Module to validate and convert source data
**
**
**
*/

/*

Id: openiod-controller-v2j
Controller module for vtec pull service.
This module validates and transforms attributes from the external system

Copyright (C) 2020  André van der Wiel / Scapeler https://www.scapeler.com

This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or
send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.along with this program.
If not, see <https://www.gnu.org/licenses/>.

*/


"use strict";
// **********************************************************************************
// add module specific requires

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
var _sourceData;
var _defaults;
var logger

var milliKelvinToCelsius = function(n){
	return Math.round((n/1e3-273.15)*100)/100
};
var celciusToMilliKelvin = function(n){
	return Math.round((parseFloat(n) + 273.15) * 1000)
};
var convertGPS2LatLng = function(gpsValue){
	var b31_28 	= gpsValue>>28;
	var b27_0		= gpsValue-(b31_28<<28);
	var northSouth = b31_28>>3;
	var N_U = b31_28 - (northSouth<<3);
	var degrees = b27_0 >> 20;
	var minutes = (b27_0 - (degrees<<20))/1000000;
	var result = northSouth==1?(degrees+minutes)*-1:degrees+minutes;
	return result;
};
var _latitude;
var _longitude;
var getLocation = function(location,lat,lon) {
	var _tmpLocation = location;
	_tmpLocation.value.coordinates[0]	= _latitude;
	_tmpLocation.value.coordinates[1]	= _longitude;
	return _tmpLocation;
};

var windDirections = {
	"N":0,
	"NO":45,
	"O":90,
	"ZO":135,
	"Z":180,
	"ZW":225,
	"W":270,
	"NW":315
}

module.exports = {
	init: function (service,sourceData,openIoDConfig) {
		logger=openIoDConfig.logger
		logger.info('Init validation module for service '+service.name);
//		this.setDefaults();
//		this.setData(sourceData);
//		_latitude 					= undefined;
//		_longitude 					= undefined;

//		getStations(service)
	},
	setDefaults(){
		_defaults = new Object();
//		_defaults.source = "https://josene.intemo.com/docs/index.html";
	},
	getDefaults(){
		return _defaults;
	},
	setData:function(sourceData){
		_sourceData = sourceData;
	},
	windDirection:function(n){
		if (windDirections[n]) return windDirections[n]*1000
		else return undefined
	},
	windSpeed:function(n){
		return parseFloat(n)*1000
	},
	humidity:function(n){
		return parseFloat(n)
	},
	battery:function(n){
		return Math.round(parseFloat(n)*1000)
	},
	temperature:function(n){
		return celciusToMilliKelvin(parseFloat(n))
	},
	particle_0_3:function(n){
		return parseFloat(n)
	},
	particle_0_5:function(n){
		return parseFloat(n)
	},
	particle_1_0:function(n){
		return parseFloat(n)
	},
	particle_2_5:function(n){
		return parseFloat(n)
	},
	particle_5_0:function(n){
		return parseFloat(n)
	},
	particle_10_0:function(n){
		return parseFloat(n)
	},
	pc_0_3:function(n){
		return parseFloat(n)
	},
	pc_0_5:function(n){
		return parseFloat(n)
	},
	pc_1:function(n){
		return parseFloat(n)
	},
	pc_2_5:function(n){
		return parseFloat(n)
	},
	pc_5:function(n){
		return parseFloat(n)
	},
	pc_10:function(n){
		return parseFloat(n)
	},
	pm_1:function(n){
		return parseFloat(n)
	},
	pm_10:function(n){
		return parseFloat(n)
	},
	pm_2_5:function(n){
		return parseFloat(n)
	},
	altitude:function(n){
		return parseFloat(n)
	},
	latitude:function(n){
		return parseFloat(n)
	},
	longitude:function(n){
		return parseFloat(n)
	}
/*	,
	s_latitude:function(n){
		_latitude = convertGPS2LatLng(n);
		if (_latitude != undefined && _longitude!= undefined) return getLocation(_location,_latitude,_longitude);
		else return undefined;
	},
	s_longitude:function(n){
		_longitude = convertGPS2LatLng(n);
		if (_latitude != undefined && _longitude!= undefined) return getLocation(_location,_latitude,_longitude);
		else return undefined;
	}
*/
}

//"use strict";
// **********************************************************************************
