const axios = require('axios');
const cheerio = require('cheerio');

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
            return `${year} ${time} LG UltraFine <b>${model}</b> — ${available}`;
        })
        .catch(err => console.log(err))
}

module.exports = { getMonitorStatus };