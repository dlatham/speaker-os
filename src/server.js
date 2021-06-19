// Provides functionality to connect to the Speaker Web servers
// including authentication and basic calls.

import Axios from 'axios';
import * as Global from './global.js';

Axios.defaults.baseURL = Global.env == 'development' ? 'https://mystayapp.ngrok.io/devices/v1' : 'https://speakeros.com/devices/v1';
Axios.defaults.headers.common['x-device-id'] = Global.mac;


export default {

	post: async (path, body, options={}) => {
		try {
			let response = await Axios.post(path, body);
			return response
		} catch(err){
			console.error(err);
		}

	},

	ping: async () => {
		try {
			let response = await Axios.post(`/ping`, {});
			return response;
		} catch(err){
			console.error(err);
		}
	}


}
