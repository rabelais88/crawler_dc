
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
  testarray = testarray.slice(30,99)
  console.log(testarray)
}

mainfunc()