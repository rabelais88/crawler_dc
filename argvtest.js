if(process.argv.length > 2){
  const forcepage = process.argv.indexOf('-page')
  if(forcepage != -1){
    let pages = process.argv.slice(forcepage + 1)
    if(pages.length < 1){
      console.log('no page option provided...page force setting will be ignored')
    }else{
      pages = pages.map(el=>Math.floor(el))
      pageMin = Math.min(...pages)
      pageMax = Math.max(...pages)
      console.log(`!!forced page setting --- ${pageMin} ~ ${pageMax} pages`)
    }
  }
}