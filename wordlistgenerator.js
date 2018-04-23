const fs = require('fs')
//word cloud generator -- https://worditout.com/word-cloud/create
fs.readFile(process.argv[2],{encoding:'utf-8'},(err,data)=>{
  try{
    let wordlist = JSON.parse(data)
    wordlist = wordlist.words.map(el=>
    el.join(':')).join('\n')
    fs.writeFile(process.argv[3],wordlist,{encoding:'utf-8'},(err)=>{
      console.log('job done! out as --' + process.argv[3])
    })
  }catch(e){
    console.log("there was an error with the file:",e)
  }
})