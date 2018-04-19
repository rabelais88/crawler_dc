const fs = require('fs')
const preserver = require('./preserver.js')

const MongoClient = require('mongodb').MongoClient
const MongoUrl = preset.private.mongoUrl
const MongoDBname = preset.public.mongo.DBname
const MongoCollection = preset.public.mongo.collection
//this is necessary for mongodb error recognition
const logfile = preset.public.logfileName

const getDB = () =>
  new Promise((resolve,reject)=>{
    MongoClient.connect(MongoUrl,(err,client)=>{
      if(err) return reject(err)
      console.log('successfully connected to db')
      return resolve(client.db(MongoDBname))
      client.close()
    })
  })

const readF = (file) =>
  new Promise((resolve,reject)=>{
    fs.readFile(file,{encoding:'utf-8'},(err,data)=>{
      return resolve(data)
    })
  })


;(async()=>{
  const db = await getDB()
  const dataYM = JSON.parse(await readF('!analyzeYM.txt'))
  const dataAll = JSON.parse(await readF('!analyzeAll.txt'))
  let dataSortable = Object.keys(dataAll).map(el=>
    [el,dataAll[el]]
  ).filter(el=>el[1] > 9).sort((a,b)=>b[1] - a[1])
  
  let dataCSV = Object.assign(dataSortable)
  .map(el=>
    [`"${el[0]}"`,el[1]].join(',')
  ).join('\n')

  preserver('!analyzeTemp.txt',dataCSV)

  db.collection(MongoCollection)
  .insertMany(({_id:'resultAll',data:dataAll},{_id:'resultYM',data:dataYM}),(err,r)=>{
    console.log('update result on mongoDB finished')
  },
  {
    upsert:true
  })
})
