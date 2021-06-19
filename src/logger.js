// Global logger for the SpeakerOS application
// Leverages Winston for multiple transport and formatting options:
// https://github.com/winstonjs/winston

import Winston from 'winston';

const Logger = Winston.createLogger({
	level: 'debug',
	transports: [
		new Winston.transports.Console({
			format: Winston.format.combine(
				Winston.format.cli(),
				Winston.format.errors()
			)
		}),
		new Winston.transports.File({
			filename: '../log/errors.log',
			level: 'error'
		})
	],
	exitOnError: false,

});

export default Logger;


