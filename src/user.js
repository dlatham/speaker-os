// User is where the logic for the CurrentUser is stored.
// The user information is configured on SpeakerWeb and pushed
// to the device via a Message in Ably Realtime.
import * as Global from './global.js';
import EventEmitter from 'events';


export default class User extends EventEmitter {

	constructor(options={}) {

		super();

		this.id = null;
		this.email = null;
		this.fname = null;
		this.lname = null;

		if(!options.skip_get) this.getUser();

	}

	get formatted() {
		return {
			id: this.id,
			email: this.email,
			fname: this.fname,
			lname: this.lname
		}
	}

	get present() {
		return this.id ? true : false;
	}

	// Get the user stored using node-persist
	// There is no need to get this from the server
	// as this data is pushed to the device when registered.

	async getUser() {

		try {

			let user = await Global.key('user');
			if(user){
				for(const key in user){
					this[key] = user[key]
				}
			}
			this.emit('initialized', this.formatted);
		} catch(err){
			Logger.error(err.message);
		}
	}

	static async set(user){

		let currentUser = new User({skip_get: true});
		await currentUser.set(user);
		return currentUser;
	}

	async set(user){
		for(const key in user) {
			this[key] = user[key];
		}
		await Global.save('user', user);
		this.emit('set', this.formatted)
		return this;
	}

	async clear() {

		await Global.destroy('user');
		this.id = null;
		this.email = null;
		this.fname = null;
		this.lname = null;
		this.emit('cleared', this.formatted);


	}

	static async currentUser() {

		try {
			let currentUser = new User({skip_get: true});
			await currentUser.getUser();
			return currentUser;
		} catch(err){
			Logger.error(err);
		}

	}

}
