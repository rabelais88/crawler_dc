const fs = require('fs')
const preserver = require('./preserver.js')

const MongoClient = require('mongodb').MongoClient
const MongoUrl = 'mongodb://localhost:27017/'
const MongoDBname = 'crawler_dc'
const MongoCollection = 'gallery_aoe'


const getDB = () =>
  new Promise((resolve,reject)=>{
    MongoClient.connect(MongoUrl,(err,client)=>{
      if(err) return reject(err)
      console.log('successfully connected to db')
      return resolve(client.db(MongoDBname))
      client.close()
    })
  })



//sort & filter the result and save it in CSV format
fs.readFile('!analyzeAll.txt',{encoding:'utf-8'},(err,data)=>{
  const dataAll = JSON.parse(data)
  let dataSortable = Object.keys(dataAll).map(el=>
    [el,dataAll[el]]
  ).filter(el=>el[1] > 9).sort((a,b)=>b[1] - a[1])
  
  let dataCSV = Object.assign(dataSortable)
  .map(el=>
    [`"${el[0]}"`,el[1]].join(',')
  ).join('\n')

  preserver('!analyzeTemp.txt',dataCSV)

  ;(async()=>{
    const db = await getDB()
    db.collection(MongoCollection)
    .insert({_id:'resultAll',data:dataAll},(err,r)=>{
      console.log('update result on mongoDB finished')
    },
    {
      upsert:true
    })
  })()
})
