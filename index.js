const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;

const app = express();
app.get('/', (req, res) => res.send('🤖 Bot is running!'));
app.listen(3000, () => console.log('🌐 Web server running'));

function createBot() {
  const bot = mineflayer.createBot({
    host: 'soulplayzz.aternos.me', // ✅ DOMAIN is the host (no change needed)
    port: 51061,
    username: 'justachillman',
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);

  bot.once('spawn', async () => {
    console.log('✅ Bot spawned');

    // Equip sword if found
    const sword = bot.inventory.items().find(item => item.name.includes('sword'));
    if (sword) {
      try {
        await bot.equip(sword, 'hand');
        console.log('🗡️ Equipped sword.');
      } catch (err) {
        console.log('❌ Failed to equip sword:', err.message);
      }
    }

    // Anti-AFK movement
    setInterval(() => {
      const yaw = Math.random() * Math.PI * 2;
      bot.look(yaw, 0, true);
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 1000);
    }, 15000);

    // Random chat messages
    const messages = [
      "Hey there!",
      "I'm not AFK 😎",
      "Just exploring!",
      "Subscribe to Soulplayzz!"
    ];
    setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      bot.chat(msg);
    }, 60000);

    // Auto-attack mobs nearby
    setInterval(() => {
      const mob = bot.nearestEntity(entity =>
        entity.type === 'mob' &&
        entity.mobType !== 'Armor Stand' &&
        entity.mobType !== 'Villager' &&
        entity.position.distanceTo(bot.entity.position) < 6
      );

      if (mob) {
        console.log(`🧟 Found ${mob.name}, attacking!`);
        try {
          bot.pvp.attack(mob);
        } catch (err) {
          console.log(`❌ Attack error: ${err.message}`);
        }
      }
    }, 3000);
  });

  // Auto-defend if bot is hit
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity && bot.lastHurtBy) {
      const attacker = bot.lastHurtBy;
      if (attacker && (attacker.type === 'player' || attacker.type === 'mob')) {
        console.log(`⚔️ Attacked by ${attacker.username || attacker.name}, fighting back!`);
        try {
          bot.pvp.attack(attacker);
        } catch (err) {
          console.log(`❌ Error fighting back: ${err.message}`);
        }
      }
    }
  });

  // Stop fighting when enemy dies
  bot.on('entityDead', (entity) => {
    if (entity === bot.lastHurtBy) {
      bot.pvp.stop();
    }
  });

  // Auto-reconnect on disconnect
  bot.on('end', () => {
    console.log('❌ Disconnected. Reconnecting in 5 seconds...');
    setTimeout(createBot, 5000);
  });

  bot.on('kicked', reason => console.log('👢 Kicked:', reason));
  bot.on('error', err => console.log('💥 Error:', err));
}

const mc = require('minecraft-protocol');

mc.ping({ host: 'soulplayzz.aternos.me', port: 51061 }, (err, result) => {
  if (err) {
    console.error("❌ Server not reachable:", err.message);
  } else {
    console.log("✅ Server reachable:", result);
  }
});


createBot();
