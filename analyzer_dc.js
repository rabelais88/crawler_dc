//Previously made mecab-mod.js
const mecabKO = require('./mecab-mod.js')

//this info will be later moved to settings.json
//everything will be written in mongodb 3.0
const MongoClient = require('mongodb').MongoClient
const MongoUrl = 'mongodb://localhost:27017/'
const MongoDBname = 'local'
const MongoCollection = 'crawler_aoe'

const assert = require('assert')

const logfile = 'analyzer.log'
const winston = require('winston')
const moment = require('moment')

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



//separate analyze 
async function analyzeText(targetText){
  let morphemes = await getMorpheme(targetText)
  return filterMorpheme(morphemes)
}


function filterMorpheme(targetList){
  return targetList.map(elMorph=>{
    const MorphType = elMorph[1]
    const MorphWord = elMorph[0]
    if(MorhType === 'NNG') return elMorph[0]
  }).filter(el=>el) //remove undefined
}




function getMorpheme(txt){
  mecabKO(txt,(res)=>{
    return new Promise((resolve,reject)=>resolve(res))
  })
}



async function bootup(){
  logg(`!!! analyze begins on ${moment().format('YYYY/MM/DD hh:mm:ss')} ------------`)
  logg('try connect to db')
  let db = await getDB() //receives mongodb
  

  let wordsAmountAllPeriod = {}
  let wordsAmountYM = {} //year and month
  //iterate through all db articles...
  db.collection(MongoCollection).find().forEach(el=>{
    console.log(el)
    //analyze!
    let analyzed = analyzeText(el.content)

    //let's find out the word amount
    let wordWeight = {}
    analyzed.map(word=>{

      //aggregate all datas
      if(wordsAmountAllPeriod[word]){
        wordsAmountAllPeriod[word] ++
      }else{
        wordsAmountAllPeriod[word] = 1
      }

      //aggregate per year-month based timeline
      let targetPeriod = /(\d{4}\.\d{2})\.\d{2}/g.exec(el.date)[1]
      if(!wordsAmountYM[targetPeriod]){
        wordsAmountYM[targetPeriod] = {}
      }
      if(wordsAmountYM[targetPeriod][word]){
        wordsAmountYM[targetPeriod][word]++
      }else{
        wordsAmountYM[targetPeriod][word] = 1
      }

    })
  })
  
}


bootup()
//to catch unhandled rejection errors with line number
process.on('unhandledRejection', up => { throw up });