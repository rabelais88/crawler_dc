const fs = require('fs')
const preserver = require('./preserver.js')

//sort & filter the result and save it in CSV format
fs.readFile('!analyzeAll.txt',{encoding:'utf-8'},(err,data)=>{
  let dataAll = JSON.parse(data)
  let dataSortable = Object.keys(dataAll).map(el=>
    [el,dataAll[el]]
  ).filter(el=>el[1] > 9).sort((a,b)=>b[1] - a[1]).map(el=>
    [`"${el[0]}"`,el[1]].join(',')
  ).join('\n')

  preserver('!analyzeTemp.txt',dataSortable)
})