require('dotenv/config');

const { Client, IntentsBitField, MessageComponentInteraction } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const bot = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

bot.on('ready', () => {
  console.log("QuadGPT is online!");
});

let systemPrompt = // System prompt goes here;

bot.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [{
    role: 'system',
    content: systemPrompt,
  }];

  await message.channel.sendTyping();
  let prevMessages = await message.channel.messages.fetch({ limit: 25 });
  prevMessages.reverse();
  prevMessages.forEach((msg) => {
    if (message.content.startsWith('!')) return;
    if (msg.author.id !== bot.user.id && msg.author.bot) return;
    // Toggleable: if (msg.author.id !== message.author.id) return;
    conversationLog.push({
      role: msg.author.id === bot.user.id ? 'assistant' : 'user',
      content: msg.content,
      // Toggleable:
      // role: 'user',
      // content: msg.content
    });

  });

  const result = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: conversationLog,
    temperature: 0.50,
    frequency_penalty: 0.3,
    presence_penalty: 0.3,
  });

  // Truncate the response if it's longer than 2000 characters
  const replyContent = result.data.choices[0].message.content;
  const truncatedReplyContent = replyContent.length > 2000 ? replyContent.substring(0, 1997) + "..." : replyContent;
  message.reply(truncatedReplyContent);
});

bot.login(process.env.TOKEN); // Token is in .env file
