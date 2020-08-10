require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const TOKEN = process.env.TOKEN;
var meats = require('./meats.json')

client.login(TOKEN);

let botDetails;

// Running message.
client.on('ready', () => {

	botDetails = {
		intro: `Hello world! I am ${client.user.tag}`,
		description: 'I am a lean mean meat machine!',
		github: 'www.google.com',
		creator: ['Wian Lloyd 🐦', '@LloydWian'],
		colour: 'D34F73',
		version: 'v1.0.0',
	};

	client.user.setActivity('$about', { type: 'LISTENING' });

	console.log(`
		_____  
	    ^..^     \9
	    (oo)_____/ 
		WW  WW
	`);

	const twirlTimer = (function() {
		let P = ["\\", "|", "/", "-"];
		let x = 0;
		return setInterval(function() {
			process.stdout.write(`${"\r"} ${P[x++]} Running ${client.user.tag}`);
			x &= 3;
		}, 200);
	})();

});


const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

// Commands.
client.on('message', msg => {
	const params = msg.content.split(' ');

	const date = new Date();
	const hour = date.getHours();
	const minute = date.getMinutes() +1;
	const day = date.getDate();
	const month = date.getMonth() +1;
	const year = date.getFullYear();

	const timestamp = `${year}/${month}/${day} ${hour}:${minute}`;
	
	const cmd = params[0];
	const arg = params[1];

	if (cmd && cmd.substring(0, 1) === '$') {

		const {
			intro,
			description,
			github,
			creator,
			colour,
			version,
		} = botDetails;

		switch (cmd) {
			case '$vm':
				if (arg) {

					const sender = msg.author;
					const senderId = sender.toString().substring(2, sender.toString().length - 1);
					const senderGuildMember = msg.guild.members.find(member => member.id === senderId);

					switch (arg.toLowerCase()) {
						case 'vleis':
							fs.appendFile('logs.txt', ` \n ${timestamp} | ${senderGuildMember.user.username} ordered some meats.`, err => console.error(err));

							msg.react('🍖');
							const { meat, image, desc, wiki } = meats[getRandomInt(meats.length)];

							return msg.reply({
								embed: {
									"title": meat,
									"color": parseInt(`0x${colour}`),
									"image": {
										"url": image
									},
									"fields": [
										{
											"name": "Description:",
											"value": desc
										}
									],
									"footer": {
										"text": wiki
									}
								}
							});

						default: return msg.reply('UnKnoWn ARguemT');
					}

				} else {
					return msg.reply('į̷̨̗̮̳̫͖͕̟̟̤̱̂̂͋̌̎͂͌̍̇͘̕͜ͅń̴̨̡̡̨̰̣̘̳̞͖̳̻̎̈́v̵̧̼͕̰̼̹͕̠͉̻͗̋̿̎͋̏͂͒͌̈̿̾̃̚͝â̷̳̱̺̍̈́̄̇̚͝ļ̶̛̮̮͎̜̝̞̼̗͚̬̮̼̠̐̆̃͋͜ĭ̶̛͕̮̅̉̐͝͠d̴̡̙̤̖͛̾̈́̎̏̽ ̵̛̛̖̪̬̻̤̱̻̹͇̘̝̣̒̃̐̉͐͒͂͝͝ͅf̷̧͚͔̼͚͚̺͒̇̇̈́̀͝͝l̷̨̨̺͓͓͇̦̲̭̗͖̦̪͊̊͜ḙ̸̻̜̗̩͠s̷̙̬͓̩̺͐͑̓̅̅̓̅̓̄̒͗͘h̵̼̟̮̠̑̑̾͌̃̉̄̓͘̕͘͠');
				};
			case '$about':
				return msg.reply({
					embed: {
						"title": intro,
						"color": parseInt(`0x${colour}`),
						"fields": [
							{
								"name": "Description:",
								"value": description
							},
							{
								"name": "Commands:",
								"value": '**$about** - this commmand, \n**$vm vleis** - wys jou vleis'
							},
							{
								"name": "Github repository:",
								"value": `${github}`
							},
							{
								"name": "Creator:",
								"value": `${creator[0]}: ${creator[1]}`
							}
						],
						"footer": {
							"text": version
						}
					}
				});
			default: return arg ? msg.reply(`Command: ${cmd}, Argument: ${arg}`) : msg.reply(`Command: ${cmd}`);
		}

	}
});
