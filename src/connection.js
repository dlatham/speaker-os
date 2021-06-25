// This framework monitors the internet connection state of the
// device and triggers events when that state changes. We can also
// see the difference between a wifi state and a hardwired state

import Wifi from 'rpi-wifi-connection';
import OS from 'os';
import EventEmitter from 'events';
import * as Global from './global.js';
import Logger from './logger.js';
import PublicIp from 'public-ip';

// The raspberry pi contains multiple network interfaces and wifi needs to be enabled
// in order to be available for some of this to work. There is an error log that happens if it isn't
// enabled. See the bottom of the file for an example of what OS.networkInterfaces() returns...
// https://nodejs.org/api/os.html#os_os_networkinterfaces
// 

export default class Connection extends EventEmitter {

	constructor(options={}){

		super();

		this.wifi = new Wifi({debug: true});
		//this.state = null;
		this.uuid = null;
		this.ssid = null;
		this.password = null;
		this.mac = OS.networkInterfaces().eth0[0].mac;
		this.ip = {
			private: this.privateIp,
			public: null
		};


	}

	static async initiate(options={}){

		let connection = new Connection(options);
		await connection.initiate();
		return connection;

	}

	async initiate(){
		Logger.info('Initiating connection...');
		this.uuid = await Global.key('uuid');
		this.ssid = await Global.key('ssid');
		this.psk = await Global.key('psk');
		if(this.ssid && this.password){
			await this.wifi.connect({ssid: this.ssid, psk: this.psk});
		}
		this.ip.public = await PublicIp.v4();
	}

	// Here we want to choose the priority network connection.
	// We will always default to ethernet if it is found and has
	// and address provisioned by the gateway:

	get interface(){
		if(OS.networkInterfaces().eth0 && OS.networkInterfaces().eth0[0].address){
			return 'eth0';

		}
		if(OS.networkInterfaces().wlan0 && OS.networkInterfaces().wlan0[0].address){
			return 'wlan0';
		}
		return null;
	}

	get privateIp(){
		return this.interface ? OS.networkInterfaces()[this.interface][0].address : null;
	}

	get isConnected(){
		return this.ip.public ? true : false;
	}

	get isRegistered(){
		return this.uuid ? true : false;
	}

	get onEthernet(){
		return OS.networkInterfaces().eth0 && OS.networkInterfaces().eth0[0].address ? true : false
	}

	get onWifi(){
		return OS.networkInterfaces().wlan0 && OS.networkInterfaces().wlan0[0].address ? true : false
	}

	get status(){
		return {
			interface: this.interface,
			uuid: this.uuid,
			ssid: this.ssid,
			password: this.psk ? true : false,
			isConnected: this.isConnected,
			isRegistered: this.isRegistered,
			onEthernet: this.onEthernet,
			onWifi: this.onWifi
		}
	}

	async setSSID(ssid, psk){
		try {
			Logger.info(`Request to set SSID with to [${ssid}] using password: ${psk}`);
			await this.wifi.connect({ssid: ssid, psk: psk});
			this.ssid = ssid;
			this.psk = psk;
			await Global.set('ssid', ssid);
			await Global.set('psk', psk);
		} catch(err){
			Logger.error(err);
			Logger.debug(`Error: ${this.ssid}, ${this.psk}`);
			throw(err);
		}
	}


}

// {
//   lo: [
//     {
//       address: '127.0.0.1',
//       netmask: '255.0.0.0',
//       family: 'IPv4',
//       mac: '00:00:00:00:00:00',
//       internal: true,
//       cidr: '127.0.0.1/8'
//     },
//     {
//       address: '::1',
//       netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
//       family: 'IPv6',
//       mac: '00:00:00:00:00:00',
//       internal: true,
//       cidr: '::1/128',
//       scopeid: 0
//     }
//   ],
//   eth0: [
//     {
//       address: '10.83.0.104',
//       netmask: '255.255.0.0',
//       family: 'IPv4',
//       mac: 'b8:27:eb:56:bd:46',
//       internal: false,
//       cidr: '10.83.0.104/16'
//     },
//     {
//       address: 'fe80::576a:7f6d:ad04:315d',
//       netmask: 'ffff:ffff:ffff:ffff::',
//       family: 'IPv6',
//       mac: 'b8:27:eb:56:bd:46',
//       internal: false,
//       cidr: 'fe80::576a:7f6d:ad04:315d/64',
//       scopeid: 2
//     }
//   ]
// }
