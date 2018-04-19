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
      client.close()
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
  //iterate through all db articles...
  const cursor = await db.collection(MongoCollection).find({date:{$exists:true}}) //filter out corrupted data for test run
  const maxDoc = await cursor.count()
  logg('Amount of target document:' + maxDoc)
  let counter = 0
  //used while-for instead of foreach-map. necessary for asynchronous operation
  while ( await cursor.hasNext() ) {


    let doc = await cursor.next()
    counter ++
    logg(`reading up doc ${counter} / ${maxDoc} --- ${(counter/maxDoc * 100).toFixed(2)}%`)
    let analyzedDoc = await analyzeText(doc.content)
    let analyzedTitle = await analyzeText(doc.text) // I just did a wrong naming....

    const targetYM = doc.date.replace(/-|\./g,'').slice(0,6)

    let isInDoc = []
    let isInTitle = []
    
    //analyzing document
    for(let i=0;i<analyzedDoc.length;i++){
      const elWord = analyzedDoc[i]

      if(isInDoc.indexOf(elWord) === -1){
        isInDoc.push(elWord)
      }

    }

    isInDoc.map(elWord=>{
      if(wSum.all[elWord]){
        wSum.all[elWord] ++
      }else{
        wSum.all[elWord] = 1
      }

      if(!wSum.ym[targetYM]) wSum.ym[targetYM] = {}

      if(wSum.ym[targetYM][elWord]){
        wSum.ym[targetYM][elWord] ++
      }else{
        wSum.ym[targetYM][elWord] = 1
      }
    })

    //analyzing titles
    for(let i=0;i<analyzedTitle.length;i++){
      const elWord = analyzedTitle[i]
      if(isInTitle.indexOf(elWord) === -1) {
        isInTitle.push(elWord)
      }
    }

    isInTitle.map(elWord=>{
      if(wSum.titleAll[elWord]){
        wSum.titleAll[elWord] ++
      }else{
        wSum.titleAll[elWord] = 1
      }

      if(!wSum.titleYM[targetYM]) wSum.titleYM[targetYM] = {}

      if(wSum.titleYM[targetYM][elWord]){
        wSum.titleYM[targetYM][elWord] ++
      }else{
        wSum.ym[targetYM][elWord] = 1
      }
    })

    if(counter >= maxDoc){
      logg('congratulations...the result is published')
      let comp
      comp = await preserver('!ana-All.txt',JSON.stringify(wSum.all))
      comp = await preserver('!ana-YM.txt',JSON.stringify(wSum.ym))
      comp = await preserver('!ana-titleAll.txt',JSON.stringify(wSum.titleAll))
      comp = await preserver('!ana-titleYM.txt',JSON.stringify(wSum.titleYM))
      if(comp){
        process.exit()
      }
    }


  }
}


bootup()
//to catch unhandled rejection errors with line number
process.on('unhandledRejection', up => { throw up });


