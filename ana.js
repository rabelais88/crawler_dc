//reworked analyzer
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

const simpleMode = process.argv.indexOf('-simple') != -1 ? true : false //simple mode, no verbose logging

let wsum = {
  all:{},
  ym:{},
  titleAll:{},
  titleYM:{}
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


;(async function bootup(){
  logg('A N A L Y Z E --------------------------------------------------------------------------')
  logg(`analyze started -- ${moment().format('YYYY-MM-DD hh:mm:ss')}`)
  const client = await MongoClient.connect(MongoUrl);
  const db = client.db(MongoDBname)
  const cursor = await db.collection(MongoCollection).find({date:{$exists:true}}) //avoid any corrupted data
  const maxDoc = await cursor.count()
  let count = 0
  let analyzePlan = []
  logg(`max document ${maxDoc}`)

  while ( await cursor.hasNext() ) {
    let doc = await cursor.next()
    count++
    //console.log(count, doc.text)
    if(!simpleMode){
      logg(`preload ${(count / maxDoc * 100).toFixed(2)}% completed`)
    }else{
      console.log(`preload ${(count / maxDoc * 100).toFixed(2)}% completed`)
    }
    if(!simpleMode) logg(`doc title: ${doc.text} -- date: ${doc.date}` )

    let docDate = /(\d{4}\.\d{2})\.\d{2}/g.exec(doc.date)[1].replace('.','')
    if(!wsum.ym[docDate]) wsum.ym[docDate] = {}
    if(!wsum.titleYM[docDate]) wsum.titleYM[docDate] = {}

    //title
    let words = filterMorpheme(await getMorpheme(doc.text))
    if(words.length > 1 && !simpleMode) console.log(`analyzed from title ${words.slice(0,4)}`)
    for(let i = 0; i<words.length;i++){
      let word = words[i]
      if(wsum.titleAll[word]){
        wsum.titleAll[word] ++
      }else{
        wsum.titleAll[word] = 1
      }

      
      if(wsum.titleYM[docDate][word]){
        wsum.titleYM[docDate][word] ++
      }else{
        wsum.titleYM[docDate][word] = 1
      }
    }
    
    //content
    words = filterMorpheme(await getMorpheme(doc.content))
    if(words.length > 1 && !simpleMode) console.log(`analyzed from content ${words.slice(0,4 )}`)
    for(let i = 0; i < words.length;i++){
      let word = words[i]
      if(wsum.all[word]){
        wsum.all[word] ++
      }else{
        wsum.all[word] = 1
      }

      if(wsum.ym[docDate][word]){
        wsum.ym[docDate][word] ++
      }else{
        wsum.ym[docDate][word] = 1
      }
    }
  }

  logg(`analyze finished -- ${moment().format('YYYY-MM-DD hh:mm:ss')}`)
  await preserver('!ana-All.txt',JSON.stringify(wsum.all))
  await preserver('!ana-titleAll.txt',JSON.stringify(wsum.titleAll))
  await preserver('!ana-YM.txt',JSON.stringify(wsum.ym))
  await preserver('!ana-titleYM.txt',JSON.stringify(wsum.titleYM))
  logg(`db insert finished -- ${moment().format('YYYY-MM-DD hh:mm:ss')}`)

  process.exit()
})();