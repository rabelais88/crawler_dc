module.exports = preserver
const fs = require('fs')
  
function preserver(content,filename){
  fs.writeFile(filename,content,{encoding:'utf8'},(err)=>
    new Promise((resolve,reject)=>resolve(true))
  )
}