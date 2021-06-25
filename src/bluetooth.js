// This is the framework for hanbdling all bluetooth
// connections from the react-native apps to the device
// for configuration management. It doesn't currently handle
// any kind of audio streaming service.

//import bleno from 'bleno';
import * as Global from './global.js';
import Logger from './logger.js';
import ChildProcess from 'child_process';
import EventEmitter from 'events';
import User from './user.js';
var ssid; var password;

// Do not forget that we need to take down the bluetooth service and
// enable the HCI0 adapter:
// sudo service bluetooth stop
// sudo hciconfig hci0 up
//
// https://blog.skyrise.tech/bluetooth-raspberry-pi-bleno-part-1-ibeacon

// Here we want to confirm that the service is ready for us to use.
// This means that we need to disable the bluetooth service but
// bring up the hci0 device.
// https://www.systutorials.com/docs/linux/man/8-hciconfig/

ChildProcess.exec('sudo systemctl stop bluetooth', (error, stdout, stderr) => {

	if(error) {
		Logger.error(`Unable to stop the raspi bluetooth service: ${error.message}`);
		return;
	}

	if(stderr) {
		Logger.error(`Unable to stop the raspi bluetooth service: ${error.message}`);
		return;
	}

	ChildProcess.exec('sudo hciconfig hci0 up', (error, stdout, stderr) => {

		if(error) {
			Logger.error(`Unable to bring up bluetooth service on hci0: ${error.message}`);
			return;
		}

		if(stderr) {
			Logger.error(`Unable to bring up bluetooth service on hci0: ${error.message}`);
			return;
		}

	});


});

// Services should use 16-bit identifiers when available using the following resource:
// https://btprodspecificationrefs.blob.core.windows.net/assigned-values/16-bit%20UUID%20Numbers%20Document.pdf



export default class Bluetooth extends EventEmitter {

	constructor(options={}){
		super();

		// Here we want to initiate bleno after the class has been constructed. This allows us to
		// prevent some race conditions where the bleno events were being emitted before the class
		// was ready to go. Unfortunately bleno starts to initiate as soon as it is imported...

		this.bleno = null;
		this.state = null;
		this.listeners = {
			state: null,
			advertising: null
		};

	}

	static async initiate(options={}){
		let bluetooth = new Bluetooth(options);
		await bluetooth.initiate();
		return bluetooth;
	}

	async initiate(){
		Logger.debug('Importing bleno into the Bluetooth class...');
		this.bleno = (await import('bleno')).default;
		//Logger.debug(this.bleno);
		this.listeners.state = this.bleno.on('stateChange', this.stateChange.bind(this));
		this.listeners.advertising = this.bleno.on('advertisingStart', this.advertisingStart.bind(this));
	}

	startAdvertising(){
		Logger.info('Request to start bluetooth advertising...');
		Logger.debug(`Current bleno status: ${this.bleno.state}`);
		if( this.bleno.state != 'poweredOn' ) throw('BLE not powered on for advertising');
		this.bleno.startAdvertising('SPEAKER-OS', ['180a']);
	}

	stateChange(state){
		Logger.debug(`Bluetooth state changed to: ${state}`);
		this.state = state;
		//this.emit('stateChange', state);
		if(state === 'poweredOn'){
			Logger.debug('Bluetooth emitting [ready]');
			this.emit('ready');
		}
	}

	advertisingStart(error){
		Logger.info('Starting bluetooth advertising...');
		if(error) {
			Logger.error(error);
			this.bleno.stopAdvertising();
			return null;
		}
		this.bleno.setServices(this.services);
	}

	get services(){

		if(!this.bleno) return null;
		let that = this;

		return [

			// DEVICE SERVICE
			// These are read only services that get information about the device
			// and the current characteristics of the software running on the device.
			// This also provides registration state with SpeakerWeb.

			new this.bleno.PrimaryService({
				uuid: '180a', // Device service
				characteristics: [

					// Manufacturer name information
					// characteristic

					new this.bleno.Characteristic({
						uuid: '2a29', // Manufacturer name string
						properties: ['read'],
						value: 'Speaker OS',
						descriptors: [
							new this.bleno.Descriptor({
								uuid: '2901',
								value: 'Speaker OS Manufacturer'
							})
						]
					}),

					// Model number characterstic to share the
					// Global.device_name when we support multiple speakers

					new this.bleno.Characteristic({
						uuid: '2a24', // Model number string
						properties: ['read'],
						value: Global.device_name,
						descriptors: [
							new this.bleno.Descriptor({
								uuid: '2901',
								value: 'Speaker OS Model'
							})
						]
					}),
					
					// UUID string characteristic
					// This determines if the device has been registered with Speaker Web
					// and is ready to be user provisioned.
					new this.bleno.Characteristic({
						uuid: '2a23', // System ID
						properties: ['read'],
						descriptors: [
							new this.bleno.Descriptor({
								uuid: '2901',
								value: 'Device UUID if registered'
							})
						],
						onReadRequest: async function(offset, callback){
							Logger.debug('BLE read request for device UUID:');
							let uuid = Buffer.from((await Global.key('uuid')) || '');
							Logger.debug(uuid.toString());
							callback(that.bleno.Characteristic.RESULT_SUCCESS, uuid.toString('hex'));
						}
					}),


					// Software version characteristic
					// This provides the software version which is hardcoded in Globals
					new this.bleno.Characteristic({
						uuid: '2A26',	// Firmware revision string
						properties: ['read'],
						value: Global.software_version,
						descriptors: [
							new this.bleno.Descriptor({
								uuid: '2901',
								value: 'Firmware version'
							})
						]
					})
				]
			}),

			// USER SERVICE
			// This is a read only service that provides information about the current
			// user assigned on the device if present. This information is pushed to the
			// device using the messages service which requires a connection to the network.


			new this.bleno.PrimaryService({
				uuid: '181c', // User Data service
				characteristics: [

					// UserID integer characteristic
					new this.bleno.Characteristic({
						uuid: '2a9a', // User index
						properties: ['read'],
						//value: (await User.currentUser()).id
						onReadRequest: async (buffer, callback) => {
							Logger.debug('BLE read request for user id:');
							let user = await User.currentUser();
							let user_id = Buffer.from([user.id]);
							Logger.debug(user_id.toString());
							callback(that.bleno.Characteristic.RESULT_SUCCESS, user_id.toString('hex'));
						}
					})
				]
			}),


			// NETWORK SERVICE
			// This service is read write and allows someone to read and update
			// the wlan0 wifi SSID and PSK used by connection.js to connect to the
			// internet when ethernet is not available. This is usually handled
			// during initial consumer setup of the device.

			new this.bleno.PrimaryService({
				uuid: '13333333333333333333333333333337',
				characteristics: [

					// SSID characteristic
					// This provides read and write access to the SSID that the device
					// is connected to
					new this.bleno.Characteristic({
						uuid: '13333333333333333333333333330001',
						properties: ['read', 'write'],
						descriptors: [
							new this.bleno.Descriptor({
								uuid: '2901',
								value: 'Gets or sets the current WIFI SSID'
							})
						],
						onReadRequest: function(offset, callback){
							Logger.debug("BLE read request for WIFI SSID");
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
							if (offset) {
								Logger.error("BLE Offset error when setting SSID");
								callback(this.RESULT_ATTR_NOT_LONG);
							}
							else if (data.length < 1) {
								Logger.warn("BLE SSID data length too short");
								callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
							}
							else {
								// The expected string should be: "{/"ssid/": /"ssid_here/", /"psk/": /"psk_here/"}"
								let results = JSON.parse(data.toString());
								that.emit('ssid', results.ssid, results.psk);
								callback(this.RESULT_SUCCESS);
							}
						}
					})

					// More network services to be added here...
				]
			})


		]

	}

}
