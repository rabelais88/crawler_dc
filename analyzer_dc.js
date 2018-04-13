//Previously made mecab-mod.js
const mecabKO = require('./mecab-mod.js')

//this info will be later moved to settings.json
//everything will be written in mongodb 3.0
const MongoClient = require('mongodb').MongoClient
const MongoUrl = 'mongodb://localhost:27017/'
const MongoDBname = 'local'
const MongoCollection = 'crawler_aoe'

const assert = require('assert')

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
  //TODO : Load up a text from mongodb

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
  
  let analyzed = []
  //iterate through all db articles...
  db.collection(MongoCollection).find().forEach(el=>{
    analyzed.push(analyzeText(el.content))
    console.log(analyzed[analyzed.length-1])
  })

  
  
}


bootup()
//to catch unhandled rejection errors with line number
process.on('unhandledRejection', up => { throw up });