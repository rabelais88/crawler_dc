import Vue from 'vue'
import VueC3 from 'vue-c3'
import axios from 'axios'
import VueAxios from 'vue-axios'
import 'babel-polyfill'

Vue.use(VueAxios, axios)

const myapp = new Vue({
  el:'#vueframe',
  data(){
    return{
      c3options:{
        data:{columns:[[]],type:'bar'},
        axis:{
          x: {
            type: 'category',
            categories: []
          }
        }
      },
      c3handler:new Vue(),
      views:['top 10','top 30']
    }
  },
  template:`
  <div>
    <h1>dcinside gallery_aoewords</h1>
    <br>
    <vue-c3 :handler="c3handler"></vue-c3>
  </div>`,
  components:{
    VueC3
  },  
  mounted(){
    Vue.axios.get('/dataword.json').then((res)=>{
      console.log(res.data)
      this.c3options.data.columns[0] = res.data.map(el=>{
        this.c3options.axis.x.categories.push(el[0])
        return el[1]
      })
      this.c3options.data.columns[0].unshift('word repetition')
      
      console.log(this.c3options.data.columns)
      console.log(this.c3options.axis.x.categories)
      this.c3handler.$emit('init', this.c3options)
    })
  }
})