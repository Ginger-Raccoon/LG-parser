require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');


const { PORT = 3000 } = process.env;
const app = express();

const { BIG_MONITOR_URL, SMALL_MONITOR_URL, BOT_TOKEN } = process.env;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
}) 
//telegram
const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => {
  ctx.replyWithHTML(
    'Привет! Я всего лишь хотел сказать что\n'+
    '<b>LG.ohuel</b>\n'+
    'Выполнение запроса раз в 10 минут',
    );
    // Первый вызов
    async function firstCall() {
      ctx.replyWithHTML(await getMonitorStatus(BIG_MONITOR_URL))
      ctx.replyWithHTML( await getMonitorStatus(SMALL_MONITOR_URL))
    }
    firstCall()
    // Повторные
    setInterval( async function(){
      ctx.replyWithHTML(await getMonitorStatus(BIG_MONITOR_URL))
      ctx.replyWithHTML( await getMonitorStatus(SMALL_MONITOR_URL))
    }
    , 600000)
})

//запуск бота
bot.launch()


//parser
async function getMonitorStatus(URL) {
  return await axios.get(URL)
    .then((res) => {
      const $ = cheerio.load(res.data)
      const model = $('div.article').find('strong').text()
      const avaiable = $('div.article').find('span:last-child').text()
      //date
      const today = new Date();
      const year = today.getFullYear() + '-' +
        String((today.getMonth() + 1)).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      const time = today.getHours() + ':' +
        String(today.getMinutes()).padStart(2, '0');
      //telegram
      const msg = `${year}, ${time} LG UltraFine <b>${model}</b> — ${avaiable}`
      return msg
    })
    .catch(err => console.log(err))
}
