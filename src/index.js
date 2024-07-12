const {
	Client,
	Intents,
	Message,
	ActivityType,
	GatewayIntentBits,
	Partials,
} = require('discord.js');
const CharacterAI = require('node_characterai');
const cron = require('cron');
require('dotenv/config');
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

//initiating a new client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
	],
	partials: [Partials.Channel, Partials.Message],
});

//on ready events
client.on('ready', () => {
	if (!client.user) {
		return;
	}
	console.log(`Discord Bot ${client.user.username} is online!`);
	console.log(`Node version: ${process.version}`);
	function setPresence() {
		client.user.setPresence({
			status: 'online',
			activities: [
				{
					name: 'love you forever DM',
					type: ActivityType.LISTENING,
				},
			],
		});
	}

	setPresence();
});

//ai chat thing

client.on('messageCreate', async (message, inte) => {
	console.log('message event created');
	//checks for character ai
	if (message.author.bot) return;
	// Stop processing if bot isn't mentioned
	if (!message.mentions.has(client.user.id)) return;
	const messageText = message.content.trim();
	if (!messageText) return;

	message.channel.sendTyping();

	//character ai stuff
	let characterAI = new CharacterAI();

	// Authenticate with CharacterAI
	async function authenticateCharacterAI() {
		try {
			if (!characterAI.isAuthenticated()) {
				await characterAI.authenticateWithToken(
					process.env.CHARACTERAI_AUTH || ''
				);
			}
		} catch (error) {
			console.error('Error authenticating with Character AI:', error);
			throw new Error('Failed to authenticate with Character AI');
		}
	}

	// Create or continue chat with CharacterAI
	async function createOrContinueChat() {
		try {
			await authenticateCharacterAI();
			const chat = await characterAI.authenticateWithToken(
				process.env.CHARACTERAI_AUTH || ''
			);
			return chat;
		} catch (error) {
			console.error(
				'Error creating or continuing chat with Character AI:',
				error
			);
			throw new Error(
				'Failed to create or continue chat with Character AI'
			);
		}
	}

	// Send a message to CharacterAI and get response
	async function getMessage() {
		return await mutex.runExclusive(async () => {
			try {
				const chat = await createOrContinueChat();
				const response = await chat.sendAndAwaitResponse(
					messageText,
					true
				);
				return response;
			} catch (error) {
				console.error('Error sending message to Character AI:', error);
				throw new Error('Failed to send message to Character AI');
			}
		});
	}

	try {
		const response = await getMessage();
		await message.reply(response.text); // Send the Character AI bot response in the Discord channel
	} catch (error) {
		console.error('Error handling command:', error);
		await message.reply('There was a problem handling the command.'); // Send error message in case of failure
	}
});

// for the good morning text

let scheduledMessage = new cron.CronJob(
	'00 30 05 * * *', // Runs every day at 14:29:00 (adjust as needed)
	() => {
		// Send scheduled messages
		sendScheduledMessages();
	},
	null,
	true,
	'Asia/Kathmandu' // Timezone (adjust as needed)
);

scheduledMessage.start();

function sendScheduledMessages() {
	try {
		const userIDs = ['711803671155048499'];
		userIDs.forEach((userID) => {
			const user = client.users.cache.get(userID);
			if (user) {
				user.send('Good Morning <3, Are you awake babe??'); // Replace with your scheduled message content
			}
		});
	} catch (error) {
		console.error('Error sending scheduled message:', error);
	}
}

// logging the fuck in
client.login(process.env.TOKEN);
