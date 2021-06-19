import * as Global from 'speaker-os/global';
import Logger from 'speaker-os/logger';
import Server from 'speaker-os/server';
import Messages from 'speaker-os/messages';
import Bluetooth from 'speaker-os/bluetooth';



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

	// await Storage.init({
	// 	dir: 'config'
	// });

	Logger.info('Storage has been initialized.');
	Logger.info('Loading the global file...')

	Logger.debug(JSON.stringify(Global));

	Logger.info("Testing connection to Speaker Web...");

	let res = await Server.ping();

	Logger.debug(`Response from Speaker Web: ${JSON.stringify(res.data)}`);

	Logger.info("Initializing messages client...");

	let messages = new Messages

	//Logger.info("Sending connected status...");

	//messages.send('connected');

	
	// var token = await Global.key('token');
	// debug(`Token received from storage: ${token}`)
	// info('Connecting to Ably messaging service...');
	// const MessageClient = new Ably.Realtime({
	// 	clientId: Global.mac, 
	// 	token: token,
	// 	authUrl: 'https://mystayapp.ngrok.io/devices/v1/tokens', 
	// 	authMethod: 'POST',
	// 	authHeaders: {
	// 		'x-device-id': Global.mac
	// 	}
	// })

	// MessageClient.connection.on(stateChange => {
	// 	info(`Ably realtime state changed to: ${stateChange.current}`);
	// })

	// MessageClient.connection.on('disconnected', stateChange => {
	// 	// reason passes an ErrorInfo: https://ably.com/documentation/realtime/types#error-info
	// 	warn(`Ably disconnected with message: ${stateChange.reason.message}`)

	// })

	// MessageClient.connection.on('connected', ()=> {
	// 	debug(`Successfully connected to Ably with token: ${MessageClient.auth.tokenDetails.token}`);
	// 	if(token != MessageClient.auth.tokenDetails.token){ 
	// 		info('New token generated...')
	// 		info("Saving token locally...");
	// 		Global.save('token', MessageClient.auth.tokenDetails.token).then(res => { debug(`Token saved: ${JSON.stringify(res)}`); }); 
	// 	}
	// 	// Listen for messages on the channel for this device:
	// 	const listenChannel = MessageClient.channels.get(Global.mac);
	// 	listenChannel.subscribe(function (message) {
	// 		info('Received event...');
	// 		info(message.name); // 'greeting'
	// 		info(message.data); // 'Hello World!'
	// 	});


	// });

	// MessageClient.connection.on('failed', function() {
	//   console.log('FAILED CONNECTION to Ably');
	// });



	// http.createServer(function (request, response) {
	// 	response.writeHead(200, {'Content-Type': 'application/json'});
	// 	response.end(JSON.stringify(res));
	// }).listen(8081);
	// console.log('Server running at http://127.0.0.1:8081/');

}());



