require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');
const { serverLogger, monitorsLogger } = require('./utils/logger');

const {
    PORT = 3000,
    BIG_MONITOR_URL,
    SMALL_MONITOR_URL,
    BOT_TOKEN
} = process.env;

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
        '\nОдин раз в десять минут бот заходит на сайт фирменного магазина rushop.lg.com, получает информацию о наличии моделей 24MD4KL-B.AEU, 27MD5KL-B.AEU и присылает актуальный статус в телеграм.\n'
    );
    ctx.replyWithPhoto({
        url: 'https://ohuel.ru/lg/monitors.jpg',
        filename: 'Вот эти красавцы'
    });

    // Первый вызов
    async function firstCall() {
        ctx.replyWithHTML(await getMonitorStatus(BIG_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
        ctx.replyWithHTML(await getMonitorStatus(SMALL_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
    }

    firstCall();

    // Повторные
    setInterval(async function () {
            ctx.replyWithHTML(await getMonitorStatus(BIG_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
            ctx.replyWithHTML(await getMonitorStatus(SMALL_MONITOR_URL)).then(res => monitorsLogger.info(`${res.text}, user: ${res.chat.username}`));
        }
        , 600000)
})

// запуск бота
bot.launch()


// parser
async function getMonitorStatus(URL) {
    return await axios.get(URL)
        .then((res) => {
            const $ = cheerio.load(res.data);
            const model = $('div.article').find('strong').text();
            const available = $('div.article').find('span:last-child').text();
            // date
            const today = new Date();
            const year = today.getFullYear() + '-' +
                String((today.getMonth() + 1)).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');
            const time = today.getHours() + ':' +
                String(today.getMinutes()).padStart(2, '0');
            // telegram
            return `${year}, ${time} LG UltraFine <b>${model}</b> — ${available}`;
        })
        .catch(err => console.log(err))
}