// This is the message system that handles inbound and outbound
// MQTT as well as authentication with the message service
// provided by Ably:
// https://ably.com/documentation/

import Ably from 'ably';
import * as Global from './global.js';
import Logger from './logger.js';
import Chron from 'node-cron';
import User from './user.js';
import EventEmitter from 'events';


export default class MessageClient extends EventEmitter {

	constructor(options={}){

		super();

		this.currentUser = 		options.currentUser || {};
		this.token = 			null;			// The token is received async from storage in connect()
		this.uuid = 			Global.uuid; 	// Not currently being used
		this.client = 			null;			// This is where we store the Ably client
		this.heartbeat = 		null;			// This is where we store the heartbeat chron job
		this.listenChannel = 	null;			// This is where we store the listener for the Ably channel
		this.connect();
	}

	// Main connection function that authenticates against Ably using a stored
	// token from node-persist in the /config directory. If the token is expired,
	// Ably handles calling Speaker Web for a new token as we are passing along the
	// authUrl in the auth call to Ably.

	async connect(){
		try {
			this.token = await Global.key('token');
			Logger.info("Connecting to Ably message service...");
			this.client = new Ably.Realtime({
				clientId: Global.mac, 
				token: this.token,
				authUrl: 'https://mystayapp.ngrok.io/devices/v1/tokens', 
				authMethod: 'POST',
				authHeaders: {
					'x-device-id': Global.mac
				}
			});

			// Here we are setting up the various listeners for Ably realtime
			// client connection state events:
			// https://ably.com/documentation/realtime/connection
			// These should all be bound to this class in order
			// to call methods on the class itself:

			this.client.connection.on(this.stateChange.bind(this));
			this.client.connection.on('connected', this.connected.bind(this));
			this.client.connection.on('disconnected', this.disconnected.bind(this));

		} catch(err){
			Logger.error(err);
		}
	}


	// This watches for all state changes with the Ably realtime client. It can
	// be used for simple logging or handling retry logic, etc. 
	//
	//

	stateChange(state){
		Logger.info(`Ably realtime state changed to: ${state.current}`);
	}


	// This is the callback for when the Ably realtime client successfully connects
	// to the Ably service from connect() above. It is used to setup Chron jobs for heartbeats
	// and also send a 'connected' message to the 'state' topic for the device.

	connected(state){

		// Send a connected state to Ably in the "state" channel
		Logger.info("Messages connected, sending state [connected]...");
		this.send('connected', 'state');

		// Create the heartbeat chron job which publishes to the heartbeat channel
		Logger.info("Messages are connected so setting up heartbeat chron...");
		let chronJob = () => {
			Logger.debug("Running heartbeat chron job...");
			this.send(null, 'heartbeat');
		}
		this.heartbeat = Chron.schedule('*/1 * * * *', chronJob.bind(this));
		Logger.info(this.heartbeat);

		// Subscribe to the channel dedicated for this device using the mac address
		Logger.info(`Subscribing to events for channel [${Global.mac}]`);
		this.listenChannel = this.client.channels.get(Global.mac);
		this.listenChannel.subscribe(this.messageReceived.bind(this));


	}


	// This is the callback for when the Ably client disconnects from
	// the realtime service. It should be used for cleanup activities e.g.
	// canceling the heartbeat Chron job but be aware that the client can
	// disconnect many times during normal operation so these shouldn't be too heavy

	disconnected(state){
		if(this.heartbeat) this.heartbeat.destroy();
		if(this.listenChannel) this.listenChannel.unsubscribe();
	}


	// This is the callback for when a message is received. It should handle logging
	// of the message and processing the appropriate callback based on the message
	// topic. The channel is the mac address but a 'name' should be passed in order
	// to handle. It shouldn't fail for strings or JSON objects:

	messageReceived(message){
		Logger.info("Message received:");
		Logger.info(`name: ${message.name}`);
		Logger.info(`data: ${message.data}`);

		if(!message.name) {
			Logger.warn("Message received without a name. Ignoring.");
			return null;
		}

		if(!this[message.name]) {
			Logger.warn(`Message received with name [${message.name}] which is not a method on the MessageClient class.`);
			return null;
		}

		this[message.name](message.data);
	}


	// This is the main function for sending a message it should be called from
	// anywhere inside the class as this.send

	async send(message, channel='unknown'){

		try {
			let body = {
				mac: Global.mac,
				device_name: Global.device_name,
				//public_ip: await Global.ip.public(),
				//private_ip: Global.ip.private,
				message: message || null
			}
		

			Logger.info(`Sending message to topic [${channel}]`);
			Logger.debug(JSON.stringify(body));

			this.client.channels.get(channel).publish(Global.mac, body, err => {
				if(err){ Logger.error(err); } else { Logger.info(`Event published to topic [${channel}]`); }
			});

		} catch(err){
			Logger.error(err);
		}

	}

	// First we define all of the message handlers. These are each passed to the
	// MessageClient when it is successfully connected. Each of these messages should
	// occur on the channel designated for this device (the MAC address)


	ping(){
		Logger.debug(`Message with ping request being responded to by pong...`);
		this.send('pong', Global.mac);
	}

	async setUser(user){
		Logger.info('Message received to set a new user.');

		// Unclear if this is necessary as the documentation says that JSON object types
		// are accepted but when testing with the browser based dev tools they didn't work.
		user = JSON.parse(user);
		
		Logger.debug(JSON.stringify(user));
		this.currentUser = await this.currentUser.set(user);
		return this

	}

	async clearUser(){
		Logger.info('Message received to clear the current user.');
		await this.currentUser.clear();
		return null;
	}

}
