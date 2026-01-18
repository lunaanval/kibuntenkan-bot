// 環境変数読み込み
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");

// Botトークン
const token = process.env.DISCORD_TOKEN;

// トークンが無い場合は終了
if (!token) {
  console.error("[ERROR] DISCORD_TOKEN が設定されていません。");
  process.exit(1);
}

// クライアント作成
const client = new Client({
  intents: [GatewayIntentBits.Guilds], // スラッシュコマンドのみならこれでOK
});

// コマンドを格納するCollection
client.commands = new Collection();

// ─── commands フォルダからコマンド読み込み ───
const foldersPath = path.join(__dirname, "commands");
if (fs.existsSync(foldersPath)) {
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.existsSync(commandsPath)) continue;

    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] ${filePath} に "data" または "execute" がありません`
        );
      }
    }
  }
}

// ─── events フォルダからイベント読み込み ───
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

// ─── エラーハンドリング ───
client.once(Events.Error, (error) => {
  console.error("[ERROR] Discordクライアントエラー:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("[ERROR] 未処理のPromise拒否:", error);
});

// ─── Botログイン ───
client.login(token).catch((error) => {
  console.error("[ERROR] ログインに失敗しました:", error.message);
  process.exit(1);
});
