/*
//
//  this code is no longer used due to async/await misdirection
//
*/

//Previously made mecab-mod.js
const mecabKO = require('./mecab-mod.js')

const preset = {
  public: require('./setting_public.json'),
  private: require('./setting_private.json')
}

//everything will be written in mongodb 3.0
const MongoClient = require('mongodb').MongoClient
const MongoUrl = preset.private.mongoUrl
const MongoDBname = preset.public.mongo.DBname
const MongoCollection = preset.public.mongo.collection
//this is necessary for mongodb error recognition
const logfile = preset.public.logfileName

const assert = require('assert')
const winston = require('winston')
const moment = require('moment')

const preserver = require('./preserver.js')

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
    })
  })



//separate analyze 
async function analyzeText(targetText){
  let morphemes = await getMorpheme(targetText)
  return new Promise((resolve,reject)=>resolve(filterMorpheme(morphemes)))
}


function filterMorpheme(targetList){
  return targetList.map(elMorph=>{
    const MorphType = elMorph[1]
    const MorphWord = elMorph[0]
    if(MorphType === 'NNG') return elMorph[0]
  }).filter(el=>el) //remove undefined
}




function getMorpheme(txt){
  //all promises should cover up callbacks from both top and bottom.
  //if not, callbacks would return undefined
  return new Promise((resolve,reject)=>{ 
    mecabKO(txt,(res)=>{
      return resolve(res)
    })
  })
}



async function bootup(){
  logg(`!!! analyze begins on ${moment().format('YYYY/MM/DD hh:mm:ss')} ------------`)
  logg('try connect to db')
  let db = await getDB() //receives mongodb
  

  //word aggregation
  let wSum = {
    all:{},
    ym:{}, // Year-Month Based
    titleAll:{},
    titleYM:{}
  }
  //if iterate over a large db, mongo daemon automatically kills any long-term tasks --> cannot perform manual iteration

  //iterate through all db articles...
  const cursor = await db.collection(MongoCollection).find({date:{$exists:true}}) //filter out corrupted data for test run
  const maxDoc = await cursor.count()
  logg('Amount of target document:' + maxDoc)
  let analyzePlan = []
  let count = 0
  cursor.each((err,doc)=>{
    count ++
    logg(`preloading doc No.${count} async ${(count / maxDoc * 100).toFixed(2)}%`)
    if(doc.text.length > 1) analyzePlan.push(mecabAsync(doc.text))
  })

  Promise.all(analyzePlan).then(()=>{ 
    logg('work done')
  })
}

async function mecabAsync(text){
  let res = await analyzeText(text)
  return new Promise((resolve,reject)=>{
    logg(res.slice(0,4))
    return resolve(res)
  })
}


bootup()
//to catch unhandled rejection errors with line number
process.on('unhandledRejection', up => { throw up });


