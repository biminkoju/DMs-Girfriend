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
const timezones = {
	'Asia/Kathmandu': 5.75, // Adjust for the timezone offset from UTC
};
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
	if (message.author.bot) return;

	if (message.content === 'dm.ping') {
		message.reply(`Websocket heartbeat: ${client.ws.ping}ms.`);
	}

	if (!message.mentions.users.first()) return;
	if (message.mentions.users.first().id !== client.user.id) return;

	const messageText = message.content.split(' ').slice(1).join(' ');
	if (!messageText) return;

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
			const chat = await characterAI.createOrContinueChat(
				process.env.CHARACTERAI_ID
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
		message.channel.sendTyping();
		await message.reply(response.text); // Send the Character AI bot response in the Discord channel
	} catch (error) {
		console.error('Error handling command:', error);
		await message.reply('There was a problem handling the command.'); // Send error message in case of failure
	}
});

function sendScheduledMessage(message) {
	try {
		const userIDs = ['711803671155048499', '724624773447024702'];
		userIDs.forEach((userID) => {
			const user = client.users.cache.get(userID);
			if (user) {
				user.send(message).catch((error) => {
					console.error(
						`Failed to send scheduled message to user ${userID}:`,
						error
					);
				});
			}
		});
	} catch (error) {
		console.error('Error sending scheduled message:', error);
	}
}

// Cron job to send scheduled messages every hour
const scheduledMessageJob = new cron.CronJob(
	'0 * * * *', // Run every hour
	() => {
		const currentHour =
			new Date().getUTCHours() + timezones['Asia/Kathmandu'];

		if (currentHour >= 5 && currentHour < 12) {
			var goodMorningtexts = [
				'Good morning, love! Wishing you a day as bright and wonderful as your smile.',
				"Rise and shine, babe! Can't wait to see you today.",
				"Good morning, my favorite person. You're the first thing on my mind every morning.",
				'Hey there! Just wanted to say I love you and hope your day is amazing.',
				"Morning, handsome! Here's to a day filled with happiness and success.",
				'Sending you a virtual hug and a good morning kiss. Have a great day!',
				'Good morning, sweetheart. You make every morning brighter just by being you.',
				"Wake up, sleepyhead! It's a new day, and I'm so grateful to share it with you.",
				'Hope your morning is as wonderful as you are to me. Love you!',
				'Good morning, my love. Thinking of you brightens my day.',
				'Morning, sunshine! I hope your day is filled with laughter and joy.',
				"Good morning, my love. Just a reminder: you're amazing!",
				"Rise and shine, handsome! Can't wait to see you later.",
				'Sending you morning hugs and kisses. Have a wonderful day!',
				"Good morning, babe. You're the reason my mornings are so bright.",
				'Hey there! Wishing you a day as wonderful as you make mine.',
				'Morning, sweetheart. Thinking of you makes every day better.',
				'Good morning to the guy who makes my heart skip a beat.',
				'Wake up, sleepyhead! Ready to conquer another day together?',
				"Good morning, love. You're on my mind and in my heart.",
				'Hey love, hope your day starts with a smile just like mine does thinking of you.',
				"Morning, babe! Let's make today as amazing as our love.",
				"Good morning, my prince charming. You're the reason I wake up smiling.",
				'Rise and shine, my love. The world is waiting for someone as awesome as you.',
				'Morning hugs and kisses to my favorite person. Have a fantastic day!',
				"Good morning, handsome. You're the best part of my mornings.",
				'Hey there! Just a little reminder that I love you more than words can say.',
				"Morning, my love. Here's to a day filled with endless possibilities.",
				'Good morning, sweetheart. Thank you for being the light in my life.',
				"Rise and shine, babe. I'm so lucky to wake up next to you every day.",
			];
			sendScheduledMessage(
				goodMorningtexts[
					Math.floor(Math.random() * goodMorningtexts.length)
				]
			);
		} else if (currentHour >= 12 && currentHour < 18) {
			var goodEveningTexts = [
				'Good evening my love! I hope you had a wonderful day.',
				'Hey babe, just wanted to say good evening and that I miss you.',
				'Evenings are always better knowing that I have you in my life.',
				'Wishing you a peaceful evening and a relaxing night ahead.',
				'Hope your evening is as beautiful as you are to me.',
				'Sending you hugs and kisses to brighten up your evening.',
				'As the day ends, I just wanted to remind you how much I love you.',
				"Good evening sweetheart! I'm looking forward to seeing you soon.",
				'Thinking of you and wishing you a lovely evening, my dear.',
				'I love you more with each passing evening.',
				'May your evening be filled with happiness and joy, just like you bring into my life.',
				'Evenings are sweeter when I think about you. Good evening!',
				"Just a quick reminder before you sleep: you're amazing and I love you.",
				"Sending you all my love this evening. Can't wait to see you again.",
				"Good evening handsome! Hope you're having a great day.",
				'Evenings are my favorite because they mean I get to dream about you.',
				'Hope your evening is as wonderful as the love we share.',
				'Wishing you a cozy evening with warm thoughts of us.',
				'Hey love, sending you a virtual hug this evening.',
				"Just checking in to say good evening and I'm thinking of you.",
				"I'm so grateful to have you in my life. Good evening!",
				'Evening skies remind me of the colors of your love.',
				"Here's to a relaxing evening and a restful night ahead.",
				'I hope your evening is filled with relaxation and peace, my love.',
				'Thinking of you and sending you good evening wishes.',
				"Good evening my love! Remember, you're always in my thoughts.",
				'You make every evening special just by being you.',
				'Sending you warmth and love on this beautiful evening.',
				'Hope your evening is as lovely as your smile.',
				'Wishing you a peaceful evening filled with love and happiness.',
			];
			sendScheduledMessage(
				goodEveningTexts[
					Math.floor(Math.random() * goodEveningTexts.length)
				]
			);
		} else if (currentHour >= 18 || currentHour < 5) {
			var goodNightTexts = [
				'Goodnight my love! Dream sweet dreams of us.',
				'Wishing you the sweetest dreams tonight. Goodnight!',
				'Sending you hugs and kisses to carry you through the night. Goodnight!',
				"Goodnight sweetheart. I'm so lucky to have you in my life.",
				'Dreaming of you tonight and every night. Goodnight!',
				'I love you more than words can say. Goodnight and sweet dreams.',
				"As you lay down to sleep, know that you're in my heart always. Goodnight!",
				'Just wanted to say goodnight and remind you how much I care about you.',
				"I can't wait to wake up next to you. Goodnight my love.",
				'Goodnight handsome! Sleep tight and dream of us.',
				'May your dreams be filled with happiness and your heart with love. Goodnight!',
				'Thinking of you as I drift off to sleep. Goodnight my dear.',
				"Wishing you a peaceful night's sleep and dreams filled with me!",
				"You're the last thing I think about before I fall asleep. Goodnight!",
				"Sweet dreams my love. I can't wait to see you again.",
				"Goodnight sweetheart. I'm counting down the hours until I can see you.",
				'Dreaming of a future filled with you. Goodnight!',
				"Goodnight my love. Sleep well knowing you're always on my mind.",
				'Sending you all my love and goodnight kisses.',
				"I'm so grateful for you. Goodnight and sleep tight.",
				"Dreaming of the day we'll never have to say goodnight again.",
				'May your dreams be as beautiful as your heart. Goodnight!',
				"Goodnight my prince. You're my happily ever after.",
				'Wishing you the most restful sleep and the sweetest dreams. Goodnight!',
				"Sleep peacefully knowing you're loved more than words can express.",
				"You're the last thought on my mind before I drift off to sleep. Goodnight!",
				'Goodnight to the man who makes my heart sing.',
				"Dream big, sleep tight, and know you're loved with all my might. Goodnight!",
				'Every night with you is like a dream come true. Goodnight my love.',
				'May your dreams be filled with everything you desire. Goodnight!',
				"Goodnight my dear. Can't wait to see you in my dreams.",
			];

			sendScheduledMessage(
				goodNightTexts[
					Math.floor(Math.random() * goodNightTexts.length)
				]
			);
		}
	},
	null,
	true,
	'Asia/Kathmandu' // Timezone
);

scheduledMessageJob.start();
// Logging in the client
client.login(process.env.TOKEN);
