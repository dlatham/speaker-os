import * as Global from './src/global.js';
import Logger from './src/logger.js';
import Server from './src/server.js';
import Messages from './src/messages.js';
import Bluetooth from './src/bluetooth.js';
import CLI from './src/cli.js';
import User from './src/user.js';
import Connection from './src/connection.js';



(async function() {

	// Main application async starts here:

	Logger.info('Speaker OS is starting...');
	console.log(`
   ____              __           ____  ____
  / __/__  ___ ___ _/ /_____ ____/ __ \\/ __/
 _\\ \\/ _ \\/ -_) _ \`/  '_/ -_) __/ /_/ /\\ \\  
/___/ .__/\\__/\\_,_/_/\\_\\__/_/  \\____/___/  
   /_/                                      
	`);


	Logger.info('Loading the global file...')
	Logger.debug(JSON.stringify(Global));


	Logger.info('Loading current user data...');
	let currentUser = await User.currentUser();

	Logger.info('Loading the connection...');
	let connection = await Connection.initiate();



	Logger.info('Loading bluetooth services...');
	let bluetooth = await Bluetooth.initiate();

	bluetooth.on('ready', ()=> {
		// Turn on the bluetooth if no connection or no user present
		Logger.debug(`Bluetooth ready and checking advertising condition - isConnected: ${connection.isConnected}, currentUser.present: ${currentUser.present}`);
		if(!connection.isConnected || !currentUser.present) bluetooth.startAdvertising();
	});

	bluetooth.on('ssid', (ssid, psk) => {
		Logger.info('New ssid received from bluetooth...');
		Logger.debug(`{ssid: ${ssid}, psk: ${psk}}`);
		connection.setSSID(ssid, psk);
	});





	Logger.info("Testing connection to Speaker Web...");
	let res = await Server.ping();
	Logger.debug(`Response from Speaker Web: ${JSON.stringify(res.data)}`);


	Logger.info("Initializing messages client...");
	let messages = new Messages({currentUser: currentUser});


	Logger.info('Starting CLI...');
	let cli = new CLI({bluetooth: bluetooth});


	// Event handlers
	// ----------------------------------------------------
	// GLOBAL EVENT HANDLERS FOR THE APPLICATION START HERE
	//
	//

	currentUser.on('cleared', ()=> {
		Logger.info('User cleared, enabling bluetooth advertising...')
		bluetooth.startAdvertising();
	});


}());