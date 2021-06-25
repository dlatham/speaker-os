// Some global functions for the application

import Storage from 'node-persist';
import * as Logger from './logger.js';
import User from './user.js';
import OS from 'os';

export const software_version = '0.1';
export const device_name = "Bookshelf Speakers 0.1";
export const env = "development";
export const mac = OS.networkInterfaces().eth0[0].mac;



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

export const destroy = async (key) => {
	try {
		await Storage.init({
			dir: 'config'
		});
		return await Storage.removeItem(key);
	} catch(err){
		Logger.error(err.message);
	}
}