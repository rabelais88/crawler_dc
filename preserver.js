module.exports = preserver
const fs = require('fs')
  
function preserver(filename,content){
  return new Promise((resolve,reject)=>{
    fs.writeFile(filename,content,{encoding:'utf8'},(err)=>{
      return resolve(true)
    })
  })
}