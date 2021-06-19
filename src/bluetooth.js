// This is the framework for hanbdling all bluetooth
// connections from the react-native apps to the device
// for configuration management. It doesn't currently handle
// any kind of audio streaming service.

import bleno from 'bleno';
import * as Global from './global.js';
import Logger from './logger.js';
var ssid; var password;

// Do not forget that we need to take down the bluetooth service and
// enable the HCI0 adapter:
// sudo service bluetooth stop
// sudo hciconfig hci0 up
//
// https://blog.skyrise.tech/bluetooth-raspberry-pi-bleno-part-1-ibeacon


// DEVICE SERVICE

const ManufacturerInformation = new bleno.Characteristic({
	uuid: '2a29',
	properties: ['read'],
	value: 'Speaker OS',
	descriptors: [
		new bleno.Descriptor({
			uuid: '2901',
			value: 'Speaker OS Manufacturer'
		})
	]
});

const DeviceInformation = new bleno.Characteristic({
	uuid: '2a24',
	properties: ['read'],
	value: Global.device_name,
	descriptors: [
		new bleno.Descriptor({
			uuid: '2901',
			value: 'Speaker OS Model'
		})
	]
});

const DeviceService = new bleno.PrimaryService({
	uuid: '180a', // Device service
	characteristics: [
		ManufacturerInformation,
		DeviceInformation
	]
});

// USER SERVICE

const UserID = new bleno.Characteristic({
	uuid: '2a9a', // User index
	properties: ['read'],
	value: '00x0'
});

const UserCreatedAt = new bleno.Characteristic({
	uuid: '2aed', // date UTC
	properties: ['read'],
	value: '00x0'
});

const UserService = new bleno.PrimaryService({
	uuid: '181c', // User Data service
	characteristics: [
		UserID,
		UserCreatedAt
	]
})

// NETWORK SERVICE

const SSID = new bleno.Characteristic({
	uuid: '13333333333333333333333333330001',
	properties: ['read', 'write'],
	descriptors: [
		new bleno.Descriptor({
			uuid: '2901',
			value: 'Gets or sets the current WIFI SSID'
		})
	],
	onReadRequest: function(offset, callback){
		Logger.debug("Bluetooth read requested for WIFI SSID service");
		if (offset) {
			console.log("Read offset")
			callback(this.RESULT_ATTR_NOT_LONG, null);
		} else {
			if(!ssid){
				callback(this.RESULT_SUCCESS, '00');
			} else {
				let res = Buffer.from(ssid);
				callback(this.RESULT_SUCCESS, res.toString('hex'));
			}
		}
	},
	onWriteRequest: function(data, offset, withoutResponse, callback) {
		Logger.info("New SSID provided:");
		Logger.info(data);
		Logger.info(data.toString());
		if (offset) {
			console.log("Offset");
			callback(this.RESULT_ATTR_NOT_LONG);
		}
		else if (data.length < 1) {
			console.log("Data length too short");
			callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
		}
		else {
			console.log("Setting SSID")
			ssid = data.toString();
			callback(this.RESULT_SUCCESS);
		}
	}
})

const NetworkService = new bleno.PrimaryService({
	uuid: '13333333333333333333333333333337',
	characteristics: [
		SSID
	]
});

bleno.on('stateChange', function(state) {
    Logger.info('Bluetooth on stateChange: ' + state);
    if (state === 'poweredOn') {
      bleno.startAdvertising('SPEAKER-OS', ['180a']);
    } else {
      bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function(error){
	Logger.info("Bluetooth Advertising Start");
	if(!error){
		bleno.setServices([
			DeviceService,
			UserService,
			NetworkService
		]);
	}
});

export default class Bluetooth {

	constructor(options={}){

	}



}
