//mecab-ko test linux + mecab-ko + mecab-ko-dic required

const fs = require('fs')
const moment = require('moment')

module.exports = function mecabKO (targetLyric,cb){
  const execSync = require('child_process').execSync
  const tmpInput = 'TMP_IN_' + moment().format('x') + '.tmp'
  const tmpOutput = 'TMP_OUT_' + moment().format('x') + '.tmp'
  
  fs.writeFileSync(tmpInput,targetLyric,'UTF-8')

  var cmd = ['mecab', tmpInput,'--output=' + tmpOutput].join(' ')
  var res = []
  try{
    execSync(cmd,{encoding:'UTF-8'})
    res = fs.readFileSync(tmpOutput,'UTF-8')
  }
  catch(e){
    console.log(e)
  }

  //delete templates
  fs.unlinkSync(tmpInput)
  fs.unlinkSync(tmpOutput)

  res = res.replace(/\r/g, "").replace(/\s+$/, "").split("\n").map(elLine=>{
    return elLine.replace('\t',',').split(',')
  })

  cb(res)
}