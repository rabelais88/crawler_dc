const express = require('express')
const app = express()
const http = require('http').Server(app)
const fs = require('fs')
const dirPub = '/pub'
const bodyParser = require('body-parser')

const MongoClient = require('mongodb').MongoClient
const MongoUrl = 'mongodb://localhost:27017/'
const MongoDBname = 'crawler_dc'
const MongoCollection = 'gallery_aoe'
let db = ''

http.listen(3002,function (){
  console.log('server is up at ' + this.address().port)
  console.log('mode:' + process.env.NODE_ENV)
})

app.use(dirPub,express.static(__dirname + dirPub))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

app.get('/',(req,res)=>{
  fs.readFile('.' + dirPub + '/index.html',{encoding:'utf-8'},(err,dataHtml)=>{
    res.send(dataHtml)
  })
})

MongoClient.connect(MongoUrl,(err,client)=>{
  if(err) throw err
  console.log('connected to mongoDB')
  db = client.db(MongoDBname)
})

app.get('/dataword.json',(req,res)=>{
  const targetPeriod = req.params.period ? req.params.period : 'All'
  console.log('data requested on period',targetPeriod )
  db.collection(MongoCollection).find({'_id':'result' + targetPeriod}).next((err,doc)=>{
    let words = Object.keys(doc.data).map(el=>
      [el,doc.data[el]]
    ).sort((a,b)=>
      b[1] - a[1]
    ).slice(0,100) // top 100 is the max
    //console.log(words)

    res.json(words)
  })
})
