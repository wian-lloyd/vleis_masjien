'use strict';
const fetch = require('node-fetch');
const dedent = require('dedent-js');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const Discord = require('discord.js');
const nodepackage = require('../package.json');
const firebaseAdmin = require('firebase-admin');
const firebaseAdminServiceAccount = require('../service-account');
const cron = require('node-cron');

require('dotenv').config();

module.exports = class DiscordBot {
	meats = require('../data/meats.json');
	client = new Discord.Client();
	afs;
	initialized = false;
	reminders = [];

	dogHeaders = {
		headers: {
			"x-api-key": process.env.DOGTOKEN
		}
	}

	/**
	 * @param {string} TOKEN 
	 * @param {string} color 
	 * @param {string[]} joinRoles 
	 */
	constructor(TOKEN, color) {
		this.color = color;

		firebaseAdmin.initializeApp({
			credential: firebaseAdmin.credential.cert(firebaseAdminServiceAccount.account)
		});

		this.afs = firebaseAdmin.firestore();

		this.client
			.login(TOKEN);
		this.client
			.on('ready', () => {
				this.activity = ['Starting up...', 'WATCHING'];
				this.status = 'dnd';
				this.client.channels
					.find(({id}) => id === '861541793812185099')
					.send(`I'm back online!`);
			});
		this.client
			.on('message', async msg => {
				if (!msg.author.bot) {
					this.command(msg);
				} else if (!this.initialized) {

					this.initialized = true;
					this.guildId = msg.guild.id;

					this.activity = ['$about', 'LISTENING'];
					this.status = 'online';

					this.reminders = (await this.afs.collection(`guilds/${this.guildId}/reminders`).get()).docs.map(doc => {
						return {
							id: doc.id,
							...doc.data(),
						}
					});


					this.reminders.forEach(reminder => {

						/*
							* * * * * *
							| | | | | |
							| | | | | day of week
							| | | | month
							| | | day of month
							| | hour
							| minute
							second ( optional )
						*/

						const ping = moment(reminder.times['GMT+2'].ping * 1000);
						const time = moment(reminder.times['GMT+2'].time * 1000);

						// Schedule for ping
						cron.schedule(`${ping.minute()} ${ping.hour()} ${time.date()} ${ping.month() + 1} *`, () => {
							msg.channel.send(`${reminder.attendees} 👋 \n This is your reminder that you have the meeting "${reminder.name}" in ${reminder.ping} at <t:${ping.unix()}:F>. ⏳ \n It's in the channel ${reminder.channels} 💪`);
						});
						
						// Schedule for reminder
						cron.schedule(`${time.minute()} ${time.hour()} ${time.date()} ${ping.month() + 1} *`, () => {
							msg.channel.send(`${reminder.attendees} ⚠ \n You're on for "${reminder.name}" at <t:${ping.unix()}:F>. ⏳ \n It's in the channel ${reminder.channels} 🍻 \n Go do great things!`);
							if (!reminder.recurring) {
								this.removeReminder(msg, reminder.id);
							}
						});
					});

				}
			});
	}

	/**
	 * @param {Discord.Message} msg
	 */
	async command(msg) {
		const [cmd, ...args] = msg.content.split(' ');
		// this.activity = ['Processing command', 'WATCHING'];

		if (cmd && cmd.substring(0, 1) === '$')
		{
			switch (cmd)
			{
				case '$about':
					this.about(msg);
					break;
				case '$help':
					this.help(msg, args);
					break;
				case '$ping':
					this.ping(msg, args);
					break;
				case '$meat':
					this.meat(msg);
					break;
				case '$poll':
					this.poll(msg, args);
					break;
				case '$inspire':
					this.inspire(msg, args);
					break;
				case '$joke':
					this.joke(msg, args);
					break;
				case '$remind':
					this.remind(msg, args);
					break;
				case '$reminders':
					this.listReminders(msg, args);
					break;
				case '$remind-remove':
					this.removeReminder(msg, args);
					break;
				// case '$dog':
				// 	this.dog(msg, args);
				// 	break;
				// case '$finddog':
				// 	this.findDog(msg, args);
				// 	break;
				default:
					msg.react('❌');
					msg.reply('Unknown command!');
					break;
			}
		}
	}

	/**
	 * @param {Discord.Message} msg
	 */
	about(msg) {
		msg.react('ℹ');

		const
		{
			name,
			version,
			description,
			github,
			author,
			license
		} = nodepackage;

		return msg.reply({
			embed:
			{
				title: `Hello world! I am ${this.client.user.tag}`,
				color: parseInt(`0x${this.color}`),
				fields:
				[
					{
						name: 'NPM Package Name:',
						value: name,
					},
					{
						name: 'Description:',
						value: description,
					},
					{
						name: 'Commands:',
						value: dedent(`
							◆ **$about** - this commmand;
							◆ **$ping**, *<AMOUNT>*, *<DELAY>* - pong;
							◆ **$poll**, *<TITLE(no spaces)>*, *<OPTIONS 1-9>*, - create a new poll;
							◆ **$inspire** - send much needed inspiration;
							◆ **$joke** - send a horrible joke;
							◆ **$help**, <COMMAND> - verbose explanation on a command;
							◆ **$remind** - set a reminder, use this command for more info: \`\`$help $remind\`\`;
							◆ **$remind-remove**, <REMINDER_ID> - remove a reminder, id: \`\`$reminders\`\`;
							◆ **$reminders** - list all the reminders for this guild!;
						`),
					},
					{
						name: 'Github repository:',
						value: `${github}`,
					},
					{
						name: 'Author:',
						value: `${JSON.stringify(author)}`,
					},
					{
						name: 'License:',
						value: `${license}`,
					}
				],
				footer:
				{
					text: version,
				}
			}
		});
	}

	/**
	 * @param {Discord.Message} msg
	 * @param {Number} arg
	 */
	ping(msg, [repeat, delay = 1000,...options] = args) {
		delay = parseInt(delay);
		repeat = parseInt(repeat);
		if (repeat && !isNaN(repeat) & !isNaN(delay))
		{
			if (repeat > 20) repeat = 20;
			msg.reply(`Ping will pong ${repeat} times! :O`);

			const intervalId = setInterval(() => {
				if (repeat === 0) return clearInterval(intervalId);
				msg.channel.send(`pong! ` + '`' + delay + '` ms');
				repeat--;
			}, delay);
		}
		else
		{
			return msg.reply('pong!');
		}

	}

	/**
	 * @param {Discord.Message} msg
	 * @param {string[]} args
	 */
	async help(msg, [cmd] = args) {
		await msg.react('ℹ');
		switch(cmd) {
			case "$remind":
				await msg.reply(dedent(`
					\`\`\`
						NAME:
						$remind

						DESCRIPTION:
						Set a reminder for later. You can set it to recurr.

						USAGE:
						$remind @A FRIENDLY USER #A COMFY CHANNEL -n: AN AWESOME REMINDER! -t: YYYY-DD-MM HH:mm

						PARAMETERS:
						╔════════════╦═══════════════╦═══════════════╦══════════════════════════════════════════════════════════╗
						║ option     ║ name          ║ optional      ║ description                                              ║
						╠════════════╬═══════════════╬═══════════════╬══════════════════════════════════════════════════════════╣
						║ n/a        ║ n/a           ║ Y             ║ @ of users to remind. Add as many as you need.           ║
						║ n/a        ║ n/a           ║ Y             ║ # of channel the meeting is in. Add as many as you need. ║
						║ -n         ║ name          ║ N             ║ Name of reminder.                                        ║
						║ -t         ║ time          ║ N             ║ Date & time. YYYY-MM-DD HH:mm                            ║
						║ -z         ║ zone          ║ Y             ║ Time zone. GMT+2[SA](default), GMT+1[UK]                 ║
						║ -r         ║ recurring     ║ Y             ║ N/y. Is the reminder recurring?                          ║
						║ -d         ║ description   ║ Y             ║ Description of reminder.                                 ║
						║ -p         ║ ping          ║ Y             ║ Amount of time to notify before set -t:/-time:           ║
						╚════════════╩═══════════════╩═══════════════╩══════════════════════════════════════════════════════════╝
					\`\`\`
				`));
				break;
			default:
				await msg.reply("This command doesn't exist or we haven't set up more details for it yet!");
				break;
		}
	}


	parseReminderOptions(options, markers = []) {
		const parsedOptions = {};
		let currentOption;

		options.forEach((option, i) => {
			if (markers.includes(option)) {
				currentOption = option;
				parsedOptions[option] = [];
			} else {
				if (parsedOptions[currentOption]) {
					parsedOptions[currentOption].push(option);
				}
			}
		});

		const joinedOptions = {};

		Object
			.entries(parsedOptions)
			.forEach(([option, value]) => {
				joinedOptions[option] = value.join(' ');
			});

		return joinedOptions;
	}

	/**
	 * @param {Discord.Message} msg
	 * @param {string[]} args
	 */
	async removeReminder(msg, [id] = args) {
		await msg.react('♻');
		try {
			await this.afs.doc(`guilds/${this.guildId}/reminders/${id}`).delete();
		} catch (error) {
			await msg.react('⚠');
		}
	}

	/**
	 * @param {Discord.Message} msg
	 * @param {string[]} args
	 */
	async listReminders(msg, [...options] = args) {
		await msg.react('👁‍🗨');

		const updatedReminders = (await this.afs.collection(`guilds/${this.guildId}/reminders`).get()).docs.map(doc => {
			return {
				id: doc.id,
				...doc.data(),
			}
		})

		if (updatedReminders.length) {
			const reminderList = [
				`ID, NAME, GMT+1, GMT+2, PING, CREATED, CREATED BY \n`,
				...updatedReminders.map(({ id, name, times, ping, created: { date, by: { displayname } } }) => {
					return `\`\`${id}\`\`, ${name}, ${times['GMT+1'].emoji} <t:${times['GMT+1'].time}:f>, ${times['GMT+2'].emoji} <t:${times['GMT+2'].time}:f>, ${ping}, <t:${date}:f>, ${displayname} \n`;
				})
			];
	
			await msg.channel.send(`${reminderList}`);
		} else {
			
			await msg.channel.send(`No upcoming reminders. Create a reminder by typing \`\` $remind \`\``);
		}

	}

	/**
	 * @param {Discord.Message} msg
	 * @param {string[]} args
	 */
	async remind(msg, [...options] = args) {
		msg.react('📆');
		this.activity = ['the calendar...', 'WATCHING'];

		const markers = [
			'-n',
			'-t',
			'-z',
			'-p',
			'-d',
			'-r'
		];

		const parameters = this.parseReminderOptions(options, markers);

		const name = parameters['-n'];
		const description = parameters['-d'];
		const time = parameters['-t'] && moment(parameters['-t']);
		const ping = parameters['-p'] ? parameters['-p'] : '15m';
		let pingMoment;
		let pingDateFormat = 't';
		const zone = parameters['-z'] ? parameters['-z'] : 'GMT+2';
		const recurring = parameters['-r'] ? parameters['-r'] : false;
		const attendees = options.filter(option => option.includes('<@!'));
		const channels = options.filter(option => option.includes('<#'));

		if (ping) {
			if (ping.includes('m')) {
				pingMoment = moment(time).subtract(ping.replace('m', ''), 'minute');
				pingDateFormat = 't';
			}
			if (ping.includes('h')) {
				pingMoment = moment(time).subtract(ping.replace('h', ''), 'hour');
				pingDateFormat = 'f';
			}
			if (ping.includes('d')) {
				pingMoment = moment(time).subtract(ping.replace('d', ''), 'day');
				pingDateFormat = 'f';
			}
		}

		// console.log({name, description, time, ping, pingMoment, zone, recurring, attendees, channels})

		if (!name || !time) {
			await msg.reply(`You need to specify at least a ${!name ? 'name' : 'time'} for a valid reminder!`);
		}
		else {
			const msgAuthorGuildMember = (await msg.guild.fetchMember(msg.author));
			const response = {
				embed: {
					title: `Reminder for "${name}" created.`,
					color: parseInt(`0x${this.color}`),
					fields:
					[
						{
							"name": "Time zone:",
							"value": ` :flag_za: \`\`GMT+2\`\` \n :flag_gb: \`\`GMT+1\`\` `,
							"inline": true
						},
						{
							"name": "Time:",
							"value": `<t:${time.unix()}:f> \n <t:${(time.subtract(1, 'hour')).unix()}:f>`,
							"inline": true
						},
						{
							"name": `Ping (${ping}):`,
							"value": `<t:${pingMoment.unix()}:${pingDateFormat}> \n <t:${(moment(pingMoment).subtract(1, 'hour')).unix()}:${pingDateFormat}>`,
							"inline": true
						},
						{
							"name": "Recurring:",
							"value": ` ${recurring ? '✅ Yes' : '❎ No'} `,
						},
						{
							name: 'Attendees:',
							value: `${attendees.length ? attendees : msg.author}`,
						},
						{
							name: 'Channels:',
							value: `${channels.length ? channels : msg.channel}`,
						},
						{
							name: "Is this info incorrect? If you're facing unexpected issues, please log them here.",
							value: `https://github.com/wian-lloyd/discord-bot/issues`,
						},
					],
					author: {
						name: `${msgAuthorGuildMember.displayName}`,
						icon_url: `${msg.author.avatarURL}`
					},
					footer: {
						text: `${this.client.user.tag} v${nodepackage.version}`,
					}
				}
			}

			if (description) response.embed.fields.unshift({
				"name": "Description:",
				"value": `${description}`,
			});

			msg.reply(response);

			const document = {
				name,
				description: description ? description : '',
				recurring: !!recurring,
				attendees,
				channels,
				ping,
				guildId: msg.guild.id,
				created: {
					date: moment().unix(),
					by: {
						id: msg.author.id,
						userame: msg.author.username,
						displayname: msgAuthorGuildMember.displayName,
						avatarURL: msg.author.avatarURL,
					}
				},
				times: {
					'GMT+1': {
						emoji: ':flag_gb:',
						time: (moment(time).subtract(1, 'hour')).unix(),
						ping: (moment(pingMoment).subtract(1, 'hour')).unix(),
					},
					'GMT+2': {
						emoji: ':flag_za:',
						time: moment(time).unix(),
						ping: moment(pingMoment).unix(),
					},
				}
			}

			this.activity = ['Firestore', 'LISTENING'];

			try {
				await this.afs.collection(`guilds/${msg.guild.id}/reminders`).add(document);
			} catch (error) {
				console.log(error);
			}

		}

		this.activity = ['$about', 'LISTENING'];
	}

	/**
	 * @param {Discord.Message} msg
	 */
	async inspire(msg, [...options] = args) {
		msg.react('💌');
		this.activity = ['zenquotes.io', 'WATCHING'];
		const [{ q, a }] = await (await fetch('https://zenquotes.io/api/random')).json();
		await msg.reply(`${q} - ${a}`);
		this.activity = ['$about', 'LISTENING'];
	}

	/**
	 * @param {Discord.Message} msg
	 */
	async joke(msg, [...options] = args) {
		msg.react('🤡');
		this.activity = ['icanhazdadjoke.com', 'WATCHING'];
		const { attachments: [ { fallback } ]} = await (await fetch('https://icanhazdadjoke.com/slack')).json();
		await msg.reply(`${fallback}`);
		this.activity = ['$about', 'LISTENING'];
	}

	/**
	 * @param {Discord.Message} msg
	 */
	async dog(msg, [...options] = args) {
		msg.react('🐕');
		this.activity = ['api.thedogapi.com', 'WATCHING'];
		const [{
			breeds: [
				{
					weight,
					height,
					id,
					name,
					country_code,
					bred_for,
					breed_group,
					life_span,
					temperament
				}
			],
			url,
		}] = await (await fetch('https://api.thedogapi.com/v1/images/search', this.dogHeaders)).json();
		this.activity = ['$about', 'LISTENING'];
	}

	/**
	 * @param {Discord.Message} msg
	 */
	async findDog(msg, [dog, ...options] = args) {
		dog = dog.toLowerCase().trim();
		msg.react('🐕');
		this.activity = ['api.thedogapi.com', 'WATCHING'];
		dog = await (await fetch(`https://api.thedogapi.com/v1/images/search?q=${dog}`, this.dogHeaders)).json();
		this.activity = ['$about', 'LISTENING'];
	}

	randomInt(max) {
		return Math.floor(Math.random() * Math.floor(max));
	}

	/**
	 * @param {Discord.Message} msg 
	 */
	meat(msg) {
		msg.react('🍖');

		const
		{
			meat,
			image,
			desc,
			wiki
		} = this.meats[this.randomInt(this.meats.length)];

		return msg.reply(
			{
				embed:
				{
					title: meat,
					color: parseInt(`0x${this.color}`),
					image:
					{
						url: image
					},
					fields:
					[
						{
							name: 'Description:',
							value: desc
						},
					],
					footer:
					{
						text: wiki
					}
				}
			}
		);
	}

	/**
	 * @param {Discord.Message} msg 
	 * @param {string[]} args
	 */
	async poll(msg, [title, ...options] = args) {

		let emoji =
		[
			'1️⃣', '2️⃣', '3️⃣',
			'4️⃣', '5️⃣', '6️⃣',
			'7️⃣', '8️⃣', '9️⃣' 
		];

		const poll = await msg.channel.send(
			{
				embed:
				{
					title,
					color: parseInt(`0x${this.color}`),
					fields:
					[
						{
							name: 'Options:',
							value: options.map((option, i) => {
								return `${emoji[i]} - ${option}`;
							}).join('\n\n ')
						}
					]
				}
			}
		);

		options.forEach((_, i) => poll.react(`${emoji[i]}`));
	}

	/**
	 * @param {string[]} activity
	 */
	set activity([activity, type]) {
		this.client.user.setActivity(activity, { type });
	}

	/**
	 * @param {string} status
	 */
	set status(status) {
		this.client.user.setStatus(status);
	}
}



// // Commands.
// client.on('message', (msg) => {
// 	const params = msg.content.split(' ');

// 	const date = new Date();
// 	const hour = date.getHours();
// 	const minute = date.getMinutes() + 1;
// 	const day = date.getDate();
// 	const month = date.getMonth() + 1;
// 	const year = date.getFullYear();

// 	const timestamp = `${year}/${month}/${day} ${hour}:${minute}`;

// 	const cmd = params[0];
// 	const arg = params[1];

// 	if (cmd && cmd.substring(0, 1) === '$') {
// 		const { intro, description, github, creator, colour, version } = botDetails;

// 		switch (cmd) {
// 			case '$vm':
// 				if (arg) {
// 					const sender = msg.author;
// 					const senderId = sender.toString().substring(2, sender.toString().length - 1);
// 					const senderGuildMember = msg.guild.members.find((member) => member.id === senderId);

// 					switch (arg.toLowerCase()) {
// 						case 'vleis':
// 							fs.appendFile('logs.txt', ` \n ${timestamp} | ${senderGuildMember.user.username} ordered some meats.`, (err) => console.error(err));

// 							msg.react('🍖');
// 							const { meat, image, desc, wiki } = meats[getRandomInt(meats.length)];

// 							return msg.reply({
// 								embed: {
// 									title: meat,
// 									color: parseInt(`0x${colour}`),
// 									image: {
// 										url: image,
// 									},
// 									fields: [
// 										{
// 											name: 'Description:',
// 											value: desc,
// 										},
// 									],
// 									footer: {
// 										text: wiki,
// 									},
// 								},
// 							});

// 						default:
// 							return msg.reply('UnKnoWn ARguemT');
// 					}
// 				} else {
// 					return msg.reply('į̷̨̗̮̳̫͖͕̟̟̤̱̂̂͋̌̎͂͌̍̇͘̕͜ͅń̴̨̡̡̨̰̣̘̳̞͖̳̻̎̈́v̵̧̼͕̰̼̹͕̠͉̻͗̋̿̎͋̏͂͒͌̈̿̾̃̚͝â̷̳̱̺̍̈́̄̇̚͝ļ̶̛̮̮͎̜̝̞̼̗͚̬̮̼̠̐̆̃͋͜ĭ̶̛͕̮̅̉̐͝͠d̴̡̙̤̖͛̾̈́̎̏̽ ̵̛̛̖̪̬̻̤̱̻̹͇̘̝̣̒̃̐̉͐͒͂͝͝ͅf̷̧͚͔̼͚͚̺͒̇̇̈́̀͝͝l̷̨̨̺͓͓͇̦̲̭̗͖̦̪͊̊͜ḙ̸̻̜̗̩͠s̷̙̬͓̩̺͐͑̓̅̅̓̅̓̄̒͗͘h̵̼̟̮̠̑̑̾͌̃̉̄̓͘̕͘͠');
// 				}
// 			case '$about':
// 				msg.react('🍖');
// 				return msg.reply({
// 					embed: {
// 						title: intro,
// 						color: parseInt(`0x${colour}`),
// 						fields: [
// 							{
// 								name: 'Description:',
// 								value: description,
// 							},
// 							{
// 								name: 'Commands:',
// 								value: '**$about** - this commmand, \n**$vm vleis** - wys jou vleis',
// 							},
// 							{
// 								name: 'Github repository:',
// 								value: `${github}`,
// 							},
// 							{
// 								name: 'Creator:',
// 								value: `${creator[0]}: ${creator[1]}`,
// 							},
// 						],
// 						footer: {
// 							text: version,
// 						},
// 					},
// 				});
// 			default:
// 				return arg ? msg.reply(`Command: ${cmd}, Argument: ${arg}`) : msg.reply(`Command: ${cmd}`);
// 		}
// 	}
// });
