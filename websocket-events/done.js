const discordDatabase = require('../discorddatabase')
const webcamUtil = require('../utils/webcamUtil')
const thumbnailUtil = require('../utils/thumbnailUtil')
const Discord = require('discord.js');
const variables = require('../websocketevents')

var getModule = (async function(discordClient,channel,guild,user){
    var database = discordDatabase.getDatabase();
    discordClient.user.setActivity("Finished Print",{type: "WATCHING"})
     
    if(typeof channel =="undefined"){
        for(var guildid in database){
            discordClient.guilds.fetch(guildid)
            .then(async function(guild){
                var guilddatabase = database[guild.id]
                var broadcastchannels = guilddatabase.statuschannels
                for(var index in broadcastchannels){
                    var channel = guild.channels.cache.get(broadcastchannels[index]);
                    await sendMessage(channel,user)
                }
            })
            .catch(console.error);
        }
    }else{
        await sendMessage(channel,user)
    }
})

async function sendMessage(channel,user){
    var snapshot = await webcamUtil.retrieveWebcam()
    var thumbnail = await thumbnailUtil.retrieveThumbnail()
    console.log(variables.getPrintFile())
    var statusEmbed = new Discord.MessageEmbed()
    .setColor('#25db00')
    .setTitle('Print Done')
    .setAuthor(variables.getPrintFile())
    .addField('Print Time',variables.getPrintTime(),true)
    .attachFiles([snapshot,thumbnail])
    .setImage(url="attachment://"+snapshot.name)
    .setThumbnail(url="attachment://"+thumbnail.name)
    .setTimestamp()

    if(user==null){
        statusEmbed.setFooter("Automatic")
    }else{
        statusEmbed.setFooter(user.tag, user.avatarURL())
    }

    channel.send(statusEmbed);
}
module.exports = getModule;