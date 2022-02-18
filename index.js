require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { serverLogger, monitorsLogger } = require('./utils/logger');
const { getMonitorStatus } = require('./utils/parser');

const {
    PORT = 3000,
    BIG_MONITOR_URL,
    SMALL_MONITOR_URL,
    BOT_TOKEN
} = process.env;

if (BOT_TOKEN === undefined) {
    throw new Error('BOT_TOKEN must be provided!');
}

const app = express();

app.listen(PORT, () => {
    // server status && errors logger
    serverLogger.info(`Server Started in port : ${PORT}!`);
})
// telegram
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.replyWithHTML(
        '\n🥳 Привет! Этот бот создан с целью упростить жизнь тем, кто хочет приобрести очень редкие мониторы LG Ultrafine 5k || 4k.\n' +
        '\n<b>Как работает.</b>\n' +
        '\nОдин раз в десять минут бот заходит на сайт фирменного магазина rushop.lg.com, получает информацию о наличии моделей 24MD4KL-B.AEU, 27MD5KL-B.AEU и присылает актуальный статус в телеграм.\n' +
        '\n<b>Команды:</b>\n' +
        '\n/status — Узнать наличие в данный момент.\n' +
        '\n/subscribe — Подписаться на получение уведомлений. Сообщения будут приходить один раз в десять минут.\n'
    );
})

bot.hears('/status', ctx => {
    ctx.reply('Получаю данные...')
    async function checkStatus() {
        ctx.replyWithHTML(await getMonitorStatus(BIG_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
        ctx.replyWithHTML(await getMonitorStatus(SMALL_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
    }

    checkStatus();
})

bot.hears('/subscribe', ctx => {
    ctx.reply('Вы подписались на отслеживание мониторов. Уведомления об актуальном статусе будут приходить один раз в десять минут.');
    setInterval(async function () {
        ctx.replyWithHTML(await getMonitorStatus(BIG_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
        ctx.replyWithHTML(await getMonitorStatus(SMALL_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
    }, 600000)
})

// Запуск бота
bot.launch();

// Остановка при выключении сервера
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));