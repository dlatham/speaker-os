// Handlers for the command line interface used when
// using Speaker-OS in a terminal or SSH mode.
import Readline from 'readline';
import Logger from './logger.js';
import ChildProcess from 'child_process';


export default class CLI {

	constructor(options={}){

		// This is passed a function to be confirmed
		// and executed with a Y/n. When it is set it will
		// assume any keystroke other than a 'Y' should be taken
		// as no and return to the standard listener.
		this.confirmable  = null

		// Command line inteface initiation and handler
		Readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);
		process.stdin.on('keypress', this.handleKeystroke.bind(this));

	}

	handleKeystroke(str, keystroke){

		// CTRL+C should take precedence over all other
		// keystrokes so we check this one first:
		if (keystroke.ctrl && keystroke.name === 'c') {
			Logger.info('Speaker OS exiting...');
			process.exit();
		}

		// Check to see if we are in a confirmable
		// loop and handle the confirmation function
		if(this.confirmable){

			if(keystroke.shift && keystroke.name == 'y'){
				this.confirmable(str, keystroke);
			} else {
				console.log('Canceled');
				this.confirmable = null;
			}
			return

		}

		
		// Handler for rebooting the device
		else if(keystroke.ctrl && keystroke.name == 'r') {
			console.log('Are you sure you want to reboot? Y/n');
			this.confirmable = ()=> {
				Logger.info('Speaker-OS is rebooting...');
				ChildProcess.exec('sudo /sbin/shutdown -r now', function (msg) { console.log(msg) })
			};
		} 


		// Handle all other keystrokes
		else {
			console.log(`You pressed the "${str}" key`);
			console.log();
			console.log(keystroke);
			console.log();
		}

	}
}
