// Some global functions for the application
//

import OS from 'os';
import PublicIp from 'public-ip';
import Storage from 'node-persist';
import * as Logger from './logger.js';

export const mac = OS.networkInterfaces().eth0[0].mac;
export const device_name = "Bookshelf Speakers 0.1";
export const uuid = "eff5a5a6-d08d-11eb-b8bc-0242ac130003";
export const env = "development";

export const ip = {

	public: async ()=>  await PublicIp.v4(),
	private: OS.networkInterfaces().eth0[0].address // TODO: Remap this once WIFI is working on the device

}



// Get a key from local storage
export const key = async key => {
	try {
		await Storage.init({
			dir: 'config'
		});
		return await Storage.getItem(key);
	} catch(err){
		Logger.error(err.message);
	}
}

export const save = async (key, value) => {
	try {
		await Storage.init({
			dir: 'config'
		});
		return await Storage.setItem(key, value);
	} catch(err){
		Logger.error(err.message);
	}
}