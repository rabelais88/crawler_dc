const puppeteer = require('puppeteer')
const fs = require('fs')
const resDir = './res'
//use yarn add winston@next for installing latest winston
const winston = require('winston')
const moment = require('moment')

//everything will be written in mongodb
const MongoClient = require('mongodb').MongoClient
const MongoUrl = 'mongodb://localhost:27017/'
const MongoDBname = 'crawler_aoe'
//this is necessary for mongodb error recognition
const assert = require('assert')
const logfile = 'crawler_aoe.log'

const targetGallery = 'aoegame'
const targetUrl = `http://gall.dcinside.com/mgallery/board/lists/?id=${targetGallery}&page=`
const pageMin = 1
const pageMax = 3

// lgr stands for logger
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

const getDB = () =>
  new Promise((resolve,reject)=>{
    MongoClient.connect(MongoUrl,(err,client)=>{
      if(err) return reject(err)
      logg('successfully connected to db')
      return resolve(client.db(MongoDBname))
      client.close()
    })
  })

// Program's main
async function bootup(){
  logg(`!!! crawling begins on ${moment().format('YYYY/MM/DD hh:mm:ss')} ------------`)
  logg('try connect to db')
  let db = await getDB() //receives mongodb

  const browser = await puppeteer.launch({
    headless:false //set headelss:false for gui debug
  })
  const page = await browser.newPage()

  //this is the scraped result
  let scraped = []
  //here every iteration with await must be written as 'for'
  //map, filter, foreach etc are not allowed for await iteration
  for(let i=pageMin;i<pageMax;i++){
    logg(`browsing page ${i} ...`)
    await page.goto(targetUrl + i)
    await page.waitForSelector('.t_subject > a')
    logg(`...ready to scrape the page!`)
    
    //due to an unknown bug, this data has to be processed by filter.
    //the program can't recognize any variables inside the forEach/map
    //it is assumed to be a js scope problem
    let titles = await page.evaluate((selector)=> {
      return [...document.querySelectorAll(selector)].map(el=>
        el.innerText)
    }, '.t_subject > a')
    titles = titles.filter(el=>!/\[\d+\]/g.test(el))

    let authors = await page.evaluate((selector)=>{
      return [...document.querySelectorAll(selector)].map(el=>
        el.innerText)
    }, '.user_nick_nm')

    console.log([titles,authors])
    scraped = [...scraped, ...[titles,authors]]
  }

  console.log(scraped)
}


// boot up the main function
bootup()