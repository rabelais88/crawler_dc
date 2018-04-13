//mecab-ko test linux + mecab-ko + mecab-ko-dic required

module.exports = function (targetLyric,cb){

  var execSync = require('child_process').execSync
  var fs = require('fs')
  var tmpInput = 'TMP_INPUT_FILE'
  var tmpOutput = 'TMP_OUTPUT_FILE'
  
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
  res = res.replace(/\r/g, "").replace(/\s+$/, "").split("\n").map(elLine=>{
    return elLine.replace('\t',',').split(',')
  })

  cb(res)
}