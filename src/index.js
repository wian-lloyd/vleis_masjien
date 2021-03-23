'use strict';
const fetch = require('node-fetch');
const fs = require('fs');
const Discord = require('discord.js');
const nodepackage = require('../package.json');

require('dotenv').config();

module.exports =
class DiscordBot {
	meats = require('../data/meats.json');
	client = new Discord.Client();

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
	constructor(TOKEN, color, joinRoles = []) {
		this.color = color;

		this.client
			.login(TOKEN);
		this.client
			.on('ready', () => this.startup());
		this.client
			.on('message', msg => {
				if (!msg.author.bot) this.command(msg);
			});
		// this.client
		// 	.on('guildMemberAdd', (guildMember) => {
		// 		joinRoles.forEach(role => {
		// 			guildMember.addRole(
		// 				guildMember.guild.roles.find(({name, id}) => id === role)
		// 			);
		// 		});
		// 	});

	}

	async startup() {

		(() =>
			{
				let P = ['\\', '|', '/', '-'], x = 0;
				return setInterval(() => {
					process.stdout.write(`${'\r'} ${P[x++]} Running ${this.client.user.tag}`);
					x &= 3;
				}, 200);
			}
		)();

		this.activity = ['Starting up...', 'WATCHING'];
		this.status = 'dnd';

		setTimeout(() =>
			{
				this.activity = ['$about', 'LISTENING'];
				this.status = 'online';
			},
			10000
		);

	}

	/**
	 * @param {Discord.Message} msg
	 */
	async command(msg) {
		const [cmd, ...args] = msg.content.split(' ');

		if (cmd && cmd.substring(0, 1) === '$')
		{
			switch (cmd)
			{
				case '$about':
					this.about(msg);
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
		// this.activity = ['Processing command', 'WATCHING'];
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
						value: '**$about** - this commmand,\n**$meat** - get random meat, \n **$ping**, *amount*, *delay* - pong, \n **$poll**, *title(no spaces)*, *options 1-9*, - create a new poll, \n **%inspire** - send much needed inspiration',
					},
					{
						name: 'Github repository:',
						value: `${github}`,
					},
					{
						name: 'Author:',
						value: `${JSON.stringify(author).name}`,
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

// new DiscordBot(process.env.TOKEN2, "7289DA", ['719563727313305600']);

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
