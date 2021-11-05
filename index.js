//@ts-check
const {firefox} = require('playwright');
const fs = require('fs');
var TurndownService = require('turndown');

const age = ~~((Date.now() - new Date('2017-07-20')) / 31557600000);

const centra = [
    /*{name: 'kriekelaar', id: 108, period: 347},
    {name: 'linde', id: 106, period: 347},
    {name: 'maalbeek', id: 280, period: 347},
    {name: 'dam', id: 278, period: 347},
    {name: 'elzenhof', id: 320, period: 347},
    {name: 'everna', id: 131, period: 347},
    {name: 'huys', id: 242, period: 347},
    {name: 'kontakt', id: 245, period: 347},
    {name: 'nohva', id: 279, period: 347},
    {name: 'weule', id: 282, period: 347},
    {name: 'pianofabriek', id: 246, period: 347},
    {name: 'noey', id: 261, period: 347},
    {name: 'weyngaert', id: 321, period: 347},
    {name: 'wabo', id: 322, period: 347},
    {name: 'aximax', id: 152, period: 347},
    {name: 'sportdiesnt', id: 151, period: 347},
    {name: 'woontours', id: 418, period: 347},*/
    {name: 'essegem', id: 109},
    {name: 'demarkten', id: 244},
    {name: 'nekkersdal', id: 241},
    {name: 'dezeyp', id: 276},
    {name: 'deplatoo', id: 286}
]

async function grab(turndownService, context, page, age, center) {

    if (fs.existsSync(center.name)) {
        deleteFolderRecursive(center.name);
    }

    var searchUrl = `https://tickets.vgc.be/activity/index?&vrijeplaatsen=1&Age%5B%5D=${age - 1}%2C${age + 1}&entity=${center.id}`;

    if (center.period) {
        searchUrl = `https://tickets.vgc.be/activity/index?&vrijeplaatsen=1&Age%5B%5D=${age - 1}%2C${age + 1}&entity=${center.id}&Period%5B%5D=${center.period}`;
    }

    await page.goto(searchUrl);

    // this little trick makes relative links absolute -> this way we get nice absolute urls in generated files
    await page.$$eval('.transactivity a', (links) => {
        links.forEach(link => {
            link.href = link.href
        })
    });

    const [activities] = await Promise.all([page.$$('.transactivity')]);

    for (const element of activities) {
        let dataId = await element.getAttribute("data-id");
        await element.screenshot({path: `${center.name}/${dataId}.png`});
        let innerHtml = await element.innerHTML();
        fs.writeFileSync(`${center.name}/${dataId}.md`, turndownService.turndown(`<div><div>${innerHtml}</div><img src="${dataId}.png"><p><a href="${searchUrl}">Based on this search</a></p></div>`));
    }

    await context.clearCookies();
}

// because we're using an old node version on github actions...
function deleteFolderRecursive(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            let curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

(async () => {

    console.log("Starting...")

    var turndownService = new TurndownService({emDelimiter: '*'}).remove('script');

    let browser = null;
    try {
        browser = await firefox.launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        for (const center of centra) {
            await grab(turndownService, context, page, age, center);
        }
    } catch (e) {
        console.error("Something failed", e);
        return process.exit(1);
    } finally {
        if (browser != null) {
            await browser.close();
        }
        console.log("Finished.");
    }
})();