const MongoClient = require('mongodb').MongoClient
const MongoUrl = 'mongodb://localhost:27017/'
const MongoDBname = 'crawler_dc'
const MongoCollection = 'gallery_aoe'
const moment = require('moment')

const getDB = () =>
  new Promise((resolve,reject)=>{
    MongoClient.connect(MongoUrl,(err,client)=>{
      if(err) return reject(err)
      console.log('successfully connected to db')
      return resolve(client.db(MongoDBname))
      client.close()
    })
  })

;(async ()=>{
  console.log(`iteration begins on ${moment().format('YYYY/MM/DD hh:mm:ss')} ------------`)
  let db = await getDB() //receives mongodb

  //iterate through all db articles...
  const cursor = await db.collection(MongoCollection).find()
  const maxDoc = await cursor.count()
  console.log('Amount of target document:' + maxDoc)
  let count = 0
  //replace this with stream/while/map...any other iteration methods
  cursor.each((err,doc)=>{
    count ++
    console.log(`preloading doc No.${count} async ${(count / maxDoc * 100).toFixed(2)}%`)
  })
})()