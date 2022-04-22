require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 5000;

const fs = require('fs');
const { prefix } = require('./config.json');
const Discord = require('discord.js');

const createSalesBot = require('./cronjobs/sales')
const createListingsBot = require('./cronjobs/listing')
const projectConfigs = [
  { id: process.env.FIM_ID, slug: process.env.COLLECTION_SLUG_FIM, },
  { id: process.env.IOUS_ID, slug: process.env.COLLECTION_SLUG_IOUS, },
  { id: process.env.CGK_ID, slug: process.env.COLLECTION_SLUG_CGK, },
  { id: process.env.ISID_ID, slug: process.env.COLLECTION_SLUG_ISID, },
  { id: process.env.COSJ_ID, slug: process.env.COLLECTION_SLUG_COSJ, },
  { id: process.env.NF_ID, slug: process.env.COLLECTION_SLUG_NF, },
  { id: process.env.NVC_ID, slug: process.env.COLLECTION_SLUG_NVC, },
];


const client = new Discord.Client();
client.commands = new Discord.Collection();
// client.salesJobs = projectConfigs.map(config => createSalesBot(config.id, config.slug))


const salesJobs = projectConfigs.map(config => createSalesBot(config.id, config.slug))
const listingsJobs = projectConfigs.map(config => createListingsBot(config.id, config.slug))
client.jobs = salesJobs.concat(listingsJobs)

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${ file }`);
  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

// const cronFiles = fs.readdirSync('./cronjobs').filter(file => file.endsWith('.js'));
// for (const file of cronFiles) {
//   const job = require(`./cronjobs/${file}`);
//   // set a new item in the Collection
//   // with the key as the job name and the value as the exported module
//   if (job.enabled) {
//     console.log(`enabling ${job.description}`)
//     client.cronjobs.set(job.name, job);
//   }
// }



// client.on('ready', () => {
//   console.log(`Logged in as ${ client.user.tag }!`);
//   client.jobs.forEach(job => {
//     setInterval(() => job.execute(client), job.interval);
//   });



client.on('ready', () => {
  console.log(`Logged in as ${ client.user.tag }`);
  client.jobs.forEach((job, i) => {
    setTimeout(() => {
      setInterval(() => job.execute(client), 30000)
    }, i * 5000
    )
  })
})


client.on('message', msg => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  const args = msg.content.slice(prefix.length).trim().split(' ');
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  try {
    command.execute(msg, args);
  } catch (error) {
    console.error(error);
    msg.reply('there was an error trying to execute that command!');
  }
})

client.login(process.env.DISCORD_BOT_TOKEN);

app.get('/', (req, res) => {
  res.send('The bot is running')
})

app.listen(port, () => {
  console.log(`Discord Bot app listening at http://localhost:${ port }`)
})