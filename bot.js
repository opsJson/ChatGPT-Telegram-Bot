const WHITELIST = ["myusername1", "another_user2"];

const {Telegraf} = require("telegraf");
const bot_token = "bot-token"
const openai_token = "openai-token"
const maxChars = 8200;
const chats = {};

const bot = new Telegraf(bot_token);

bot.on("message", async ctx => {
	if (!WHITELIST.includes(ctx.message.from.username)) {
		ctx.sendMessage("You are not whitelisted on this chat.");
		return;
	}
	
	const user = ctx.message.from.id;
	let chat = chats[user];
	if (!chat) chat = [];
	
	chat.push({
		role: "user",
		content: ctx.message.text
	});
	
	let counter;
	while (counter > maxChars) {
		counter	= 0;
		chat.forEach(c => {
			counter += c.content.length;
		});
		if (counter > maxChars) chat.shift();
		counter	= 0;
		chat.forEach(c => {
			counter += c.content.length;
		});
	}
	
	const response = await chatgpt(chat);
	
	chat.push({
		role: "assistant",
		content: response
	});
	
	chats[user] = chat;
	
	ctx.sendMessage(response);
	
	console.log(chat);
});

bot.launch();

async function chatgpt(chat) {
	try {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${openai_token}`
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: chat
			})
		});
		
		const response_json = await response.json();
		if (response_json.error) return response_json.error.message;
		return response_json.choices[0].message.content;
	}
	catch(e) {
		console.error(e);
		return null;
	}
}