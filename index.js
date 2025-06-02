const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const mc = require('minecraft-protocol');

const SERVER_HOST = 'soulplayzz.aternos.me';
const SERVER_PORT = 51061;
const USERNAME = 'justachillman';

const app = express();
app.get('/', (_, res) => res.send('🤖 Bot is running!'));
app.listen(3000, () => console.log('🌐 Web server running'));

function pingServer(callback) {
  mc.ping({ host: SERVER_HOST, port: SERVER_PORT }, (err, result) => {
    if (err) {
      console.error("❌ Server not reachable:", err.message);
      callback(false);
    } else {
      console.log("✅ Server reachable:", result.version.name);
      callback(true);
    }
  });
}

function createBot() {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: USERNAME,
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);

  bot.once('spawn', async () => {
    console.log('✅ Bot spawned');

    // Try to equip a sword
    const sword = bot.inventory.items().find(item => item.name.includes('sword'));
    if (sword) {
      try {
        await bot.equip(sword, 'hand');
        console.log('🗡️ Equipped sword');
      } catch (err) {
        console.log('❌ Equip error:', err.message);
      }
    }

    // Anti-AFK
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

    // Auto-attack nearby mobs
    setInterval(() => {
      const mob = bot.nearestEntity(entity =>
        entity.type === 'mob' &&
        entity.mobType !== 'Armor Stand' &&
        entity.mobType !== 'Villager' &&
        entity.position.distanceTo(bot.entity.position) < 6
      );

      if (mob) {
        console.log(`🧟 Found ${mob.name}, attacking...`);
        try {
          bot.pvp.attack(mob);
        } catch (err) {
          console.log(`❌ Attack error: ${err.message}`);
        }
      }
    }, 3000);
  });

  // Auto-defend
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity && bot.lastHurtBy) {
      const attacker = bot.lastHurtBy;
      if (attacker && (attacker.type === 'player' || attacker.type === 'mob')) {
        console.log(`⚔️ Attacked by ${attacker.username || attacker.name}`);
        try {
          bot.pvp.attack(attacker);
        } catch (err) {
          console.log(`❌ PvP error: ${err.message}`);
        }
      }
    }
  });

  // Stop attacking if enemy dies
  bot.on('entityDead', (entity) => {
    if (entity === bot.lastHurtBy) {
      bot.pvp.stop();
    }
  });

  // Reconnect on end
  bot.on('end', () => {
    console.log('❌ Disconnected. Reconnecting in 5 seconds...');
    setTimeout(() => pingServer(ok => ok && createBot()), 5000);
  });

  // Handle kicks
  bot.on('kicked', reason => {
    console.log('👢 Kicked:', reason);
  });

  // Error handler (including ECONNRESET)
  bot.on('error', err => {
    if (err.code === 'ECONNRESET') {
      console.log('⚠️ Server reset connection (ECONNRESET).');
    } else {
      console.log('💥 Error:', err.message || err);
    }
  });
}

// Initial ping to ensure server is online
pingServer(ok => {
  if (ok) createBot();
  else console.log("❌ Will not connect — server is offline.");
});
