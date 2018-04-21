
function minifunc(msg){
  return new Promise((resolve,reject)=>{
    console.log(msg)
    return resolve()
  })
}

//it is possible to place promise inside async
async function asyncfunc(){
  let res1 = await minifunc('bravo!')
  let res2 = await minifunc('superb!')
  return new Promise((resolve,reject)=>{
    //async cannot be placed inside promise
    return resolve()
  })
}



async function mainfunc(){
  await asyncfunc()
  let testarray = Array.from(Array(20).keys())
  testarray = testarray.slice(5,30)
  console.log(testarray)

  let testarray2 = Array.from(Array(50).keys())
  testarray2 = testarray2.map(el=>{
    if(el % 2 == 0) return el
  }).filter(
    el=>el
  )
  console.log(testarray2)
}

mainfunc()