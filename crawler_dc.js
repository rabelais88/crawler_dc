'use strict'; //always use this in order to prevent memory leak
//puppeteer(headless chrome) requires latest chrome install
const puppeteer = require('puppeteer')
const fs = require('fs')
//use yarn add winston@next for installing latest winston
const winston = require('winston')
const moment = require('moment')

//main settings
const preset = {
  public: require('./setting_public.json'),
  private: require('./setting_private.json')
}
/*
//settings, public
{
  "mongo":{
    "DBname":"crawler_dc",
    "collection":"gallery_aoe"
  },
  "logfileName":"crawler.log",
  "targetGallery":"aoegame",
  "title":"aoe gallery",
  "pageMin":1,
  "pageMax":20,
  "windowMax":7
}

//settings, private
{"mongoUrl":"mongodb://localhost:27017/"}
*/

//everything will be written in mongodb 3.0
const MongoClient = require('mongodb').MongoClient
const MongoUrl = preset.private.mongoUrl
const MongoDBname = preset.public.mongo.DBname
const MongoCollection = preset.public.mongo.collection
//this is necessary for mongodb error recognition
const assert = require('assert')
const logfile = preset.public.logfileName

const targetGallery = preset.public.targetGallery



//too much data from below address
//const targetUrl = `http://gall.dcinside.com/mgallery/board/lists/?id=${targetGallery}&page=`

//limited data amount by redirecting to different URL
const targetUrl = `http://gall.dcinside.com/mgallery/board/lists/?id=${targetGallery}&exception_mode=recommend&page=`
let pageMin = preset.public.pageMin
let pageMax = preset.public.pageMax //limit it to 20~30 pages at once since it may cause hang & RAM errors
//!!!detrimental for RAM consumption & performance
const windowMax = preset.public.windowMax //maximum chrome window opened at once

// we'll write down a log into a log file
// we're dealing with large amount of I/O
// this is for winston rc3.0.0 above 
const logger = winston.createLogger({
  transports:[
    new winston.transports.File({ filename: logfile}),
    new winston.transports.Console()
  ]
})

function logg(msg){
  logger.log('info',msg)
}

function warnn(msg){
  logger.log('warn',msg)
}

const simpleMode = process.argv.indexOf('-simple') != -1 ? true : false //simple mode, no verbose logging

//forcing external page setting by console / npm / yarn / gulp script run
if(process.argv.length > 2){
  const forcepage = process.argv.indexOf('-page')
  if(forcepage != -1){
    let pages = process.argv.slice(forcepage + 1)
    if(pages.length < 1){
      logg('no page option provided...page override setting will be ignored')
    }else{
      pages = pages.map(el=>Math.floor(el))
      pageMin = Math.min(...pages)
      pageMax = Math.max(...pages)
      logg(`!!forced page setting --- ${pageMin} ~ ${pageMax} pages!!`)
    }
  }
}

const getDB = () =>
  new Promise((resolve,reject)=>{
    MongoClient.connect(MongoUrl,(err,client)=>{
      if(err) return reject(err)
      logg('successfully connected to db')
      return resolve(client.db(MongoDBname))
      client.close()
    })
  })




//-----------scrape titles & author & href & comment from single page
async function scrapePage(browser,targetUrl,pageNo){
  try{
    const page = await browser.newPage()
    if(!simpleMode) logg(`browsing page ${pageNo} ...`)
    await page.goto(targetUrl + pageNo, {timeout: 3000000})
    //below is not really necessary
    //await page.waitForSelector('.t_subject > a')
    if(!simpleMode) logg(`...ready to scrape the page ${pageNo} !`)
    
    //due to an unknown bug, this data has to be processed by filter.
    //the program can't recognize any variables inside the forEach/map
    //it is assumed to be a js scope problem
    let titles = await page.evaluate((selector)=> {
      return [...document.querySelectorAll(selector)].map(el=>{
        return { text: el.innerText, href:el.href, comment:0 } })
    }, '.t_subject > a')
    titles = titles.filter((el,i)=>{
      if(/\[\d+\]/g.test(el.text)){
        //if it's a comment number
        titles[i - 1].comment = Math.ceil(/\[(\d+)\]/g.exec(el.text)[1]) //Math.ceil is safer than parseint
        return false
      }else{
        return el.text
      }
    })

    let authors = await page.evaluate((selector)=>{
      return [...document.querySelectorAll(selector)].map(el=>{
        return { author: el.innerText}})
    }, '.user_nick_nm')

    let dates = await page.evaluate((selector)=>{
      return [...document.querySelectorAll(selector)].map(el=>{
        return { date: el.innerText}
      })
    }, '.t_date')

    //join titles and authors
    titles = titles.map((el,i)=>{
      return {...el, ...authors[i], ...dates[i]}
    })

    //convert data into object style
    let convertedTitles = {}
    titles.map(el=>{
      const articleId = /&no=(\d+)/g.exec(el.href) //this could return null because sometimes they have different type of url
      if(!simpleMode) logg(`scraped address - ${articleId ? articleId[1] : 'wrongid'} - ${moment().format('YYYY/MM/DD hh:mm:ss')}`)

      if(articleId) convertedTitles[articleId[1]] = el //null test is necessary!
    })
    if(page) await page.close()
    return new Promise((resolve,reject)=>resolve(convertedTitles))
  }catch(e){
    warnn(e)
  }
}






//----------scrape single article element
async function scrapeArticle(browser,articleUrl,articleId){
  try{
    if(!simpleMode) logg(`scraping article(${articleId}) - ${moment().format('YYYY/MM/DD hh:mm:ss')}`)
    const page = await browser.newPage()
    //multiple async page loading time gets exponentially bigger,
    //creates timeout rejection

    //in order to prevent freezing due to dialog
    await page.setJavaScriptEnabled(false)
    page.on('dialog', async dialog => {
      logg('dialog: ', dialog.message(), '- this will be dismissed')
      await dialog.dismiss()
    })
    await page.goto(articleUrl, {timeout: 3000000}) //timeouts will be disabled

    let paragraphs = await page.evaluate((selector)=>
      [...document.querySelectorAll(selector)].map(el=>
    el.innerText),'.s_write p, .s_write div')
    if (paragraphs.length > 1) {
      paragraphs = paragraphs.join(' ').toLowerCase().replace('dc official app','').replace(/[\n\r]/g,' ')
    }else{
      paragraphs = ''
    }
    if(page) await page.close()
    //console.log(articleUrl,articleId, paragraphs)
    return new Promise((resolve,reject)=>resolve([articleId,paragraphs]))
  }catch(e){
    warnn(e)
  }
}



// save data into DB
function preserveScrape(db,_id,content){
  if(!simpleMode) logg(`start writing on db...${_id} - ${moment().format('YYYY/MM/DD hh:mm:ss')}`)
  db.collection(MongoCollection)
  .insert({...{_id:_id},...content},(err,r)=>
  new Promise((resolve,rejection)=>resolve(r)),
  {
    upsert:true
  })
}



// Program's main
// unfortunately this has to be soooo much long
async function bootup(){
  logg(`!!! crawling begins on ${moment().format('YYYY/MM/DD hh:mm:ss')} ------------`)
  logg(`target gallery: ${targetGallery} / today's target page: ${pageMin} to ${pageMax} page`)
  logg('try connect to db')
  let db = await getDB() //receives mongodb

  const browser = await puppeteer.launch({
    //headless:false //set headelss:false for gui debug
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio'] //for preventing errors & RAM consumption
  })

  //scraping finished resources
  let scraped = {}

  //here every iteration with await must be written as 'for'
  //map, filter, foreach etc are not allowed for await iteration
  let countLimit = 0
  let pageScrapePlan = []
  for(let i=pageMin;i<=pageMax;i++){
    logg(`crawling on page ${i} / ${pageMax} -- collecting targets ${(i / pageMax * 100).toFixed(2)}%`)
    //scraped = {...scraped,...await scrapePage(browser,targetUrl,i)}
    pageScrapePlan.push(scrapePage(browser,targetUrl,i))
    countLimit++
    if(countLimit % windowMax === 0 || i === pageMax) {
      //if the counter reaches the maximum number of windows, run scraping at once
      let resPage = await Promise.all(pageScrapePlan)
      resPage.map(elScrappedFromPage=>{
        scraped = {...scraped,...elScrappedFromPage}
      })

      pageScrapePlan = []
    }
  }

  //multiple articles are scraped at once
  const scrapedKeys = Object.keys(scraped)
  let prevTime = moment()
  for(let i=0;i< scrapedKeys.length / windowMax;i++){

    const now = moment()
    logg(`${i*windowMax} ~ ${ i*windowMax + windowMax} - max:${scrapedKeys.length} - ${now.format('hh:mm:ss')} - Completion: ${((i*windowMax + windowMax) / scrapedKeys.length * 100).toFixed(2)}% / completed in ${moment.duration(prevTime.diff(now)).asSeconds()} sec.`)
    prevTime = now
    let scrapePlan = scrapedKeys.slice(i*windowMax, i*windowMax + windowMax).map(el=>{
      return scrapeArticle(browser,scraped[el].href,el)
    })
    let scrapedPara = await Promise.all(scrapePlan)

    //using article number as key, this removes all duplicates
    //scrapedPara = [[id,scrapedparagraph]...]
    
    for(let i=0; i < scrapedPara.length;i++){
      const targetKey = scrapedPara[i][0]
      const targetContent = {...scraped[targetKey],...{content:scrapedPara[i][1]}}
      await preserveScrape(db,targetKey,targetContent)
    }

  }
  await browser.close()
  process.exit()
}


// boot up the main function
bootup()
//to catch unhandled rejection errors with line number
process.on('unhandledRejection', up => { throw up });