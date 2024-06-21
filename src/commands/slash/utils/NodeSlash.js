const SlashCommand = require("../../../structures/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");

const command = new SlashCommand()
  .setName("nodes")
  .setDescription("See latest node status.")
  .setCategory("Util")
  .setRun(async (client, interaction, options) => {
    interaction.reply({
      content: `\`🟢 Connected | ⚪ Active Node | 🔴 Disconnected\``,
    });

    const prettyBytes = (await import("pretty-bytes")).default;
    const player = client.manager.players.get(interaction.guild.id);
    let colors;
    client.manager.nodeMap.forEach((x) => {
      if (player && player.node.name == x.name) colors = "•";
      else if (x.disconnect) colors = "+";
      else colors = "-";

      const lavauptime = moment
        .duration(x.stats.uptime)
        .format(" d [days], h [hours], m [minutes], s [seconds]");

      let msg = new EmbedBuilder().setColor(client.embedColor)
        .setDescription(`\`\`\`diff\n
${colors} ID      :: ${x.name}
${colors} State   :: ${x.stats ? "Connected" : "Disconnected"}
${colors} Core    :: ${x.stats.cpu.cores} Core(s)
${colors} Memory  :: ${prettyBytes(x.stats.memory.used)}/${prettyBytes(
        x.stats.memory.reservable
      )}
${colors} Uptime  :: ${lavauptime}
${colors} Players :: ${x.stats.playingPlayers}/${x.stats.players}\`\`\``);

      return interaction.channel
        .send({
          embeds: [msg],
        })
        .catch(console.log);
    });
  });

module.exports = command;
