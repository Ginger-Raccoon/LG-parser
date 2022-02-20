require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { serverLogger, monitorsLogger, historyLogger } = require('./utils/logger');
const { getMonitorStatus } = require('./utils/parser');
const tagsRemover = require('./helpers/tagsRemover');
const fs = require('fs');

const {
    PORT,
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

// анонимные логи для пользователей
setInterval(async function () {
    await getMonitorStatus(BIG_MONITOR_URL).then(res => historyLogger.info(tagsRemover(res)));
    await getMonitorStatus(SMALL_MONITOR_URL).then(res => historyLogger.info(tagsRemover(res)));
}, 600000)

// telegram
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.replyWithHTML(
        '\n🥳 Привет! Этот бот создан с целью упростить жизнь тем, кто хочет приобрести очень редкие мониторы LG Ultrafine 5k || 4k.\n' +
        '\n<b>Как работает.</b>\n' +
        '\nОдин раз в десять минут бот заходит на сайт фирменного магазина rushop.lg.com, получает информацию о наличии моделей 24MD4KL-B.AEU, 27MD5KL-B.AEU и присылает актуальный статус в телеграм.\n' +
        '\n<b>Команды:</b>\n' +
        '\n/status — Узнать наличие в данный момент.\n' +
        '\n/subscribe — Подписаться на получение уведомлений. Сообщения будут приходить один раз в десять минут.\n' +
        '\n/history — история запросов. <b>ВНИМАНИЕ!</b> Вы получите всю историю запросов (144 запроса в сутки), начиная с 20 февраля 2022 года, по настоящее время.\n'
    );
    ctx.replyWithPhoto('https://ohuel.ru/lg/monitors.jpg');
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

bot.hears('/history', ctx => {
    try {
        const telegramMessageMaxSize = 4012; // ~ 60 строк файла логов
        const logs = fs.readFileSync('./logs/history.log', 'utf8');
        const sliced = logs.length / telegramMessageMaxSize;
        let start = 0;
        let end = telegramMessageMaxSize;

        for (let i = 0; i < sliced; i++) {
            let messageToSend = logs.slice(start, end);
            start = start + telegramMessageMaxSize;
            end = end + telegramMessageMaxSize;
            ctx.reply(messageToSend);
        }
    } catch (err) {
        ctx.reply(`Ошибка чтения файла логов: ${err}`)
    }
});

// Запуск бота
bot.launch();

// Остановка при выключении сервера
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));