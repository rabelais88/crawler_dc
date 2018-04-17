import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import 'babel-polyfill'

Vue.use(VueAxios, axios)

const myapp = new Vue({
  el:'#vueframe',
  data(){
    return{
      wordranksRaw:[],
      title:'고갤 인기 단어 순위',
      filterTops:[
        ['상위 10개',10],
        ['상위 50개',50],
        ['상위 100개',100]
      ],
      filterPeriods:['All period', '2018-03'],
      filterTop:10,
      filterPeriod:'All period'
    }
  },
  computed:{
    wordmax (){
      //apply is necessary because the value is not bound
      return Math.max.apply(Math,this.wordranks.map(el=>el[1]))
    },
    wordranks(){
      return this.wordranksRaw.slice(0,this.filterTop) //top XXth
    }
  },
  methods:{
    barstyle(elValue){
      return{
        width: Math.ceil(elValue / this.wordmax * 100) + '%'
      }
    }
  },
  template:`
  <div>
    <h1>{{title}}</h1>
    <br>
    {{filterTop}} {{filterPeriod}}
    <select v-model="filterTop">
      <option v-for="(elTop, idx) in filterTops" :key="idx" :value="elTop[1]">{{elTop[0]}}</option>
    </select>

    <select v-model="filterPeriod">
      <option v-for="(elPeriod, idx) in filterPeriods" :key="idx" >{{elPeriod}}</option>
    </select>

    <div class="chart">
      <div class="elChart" v-for="(elWord, idx) in wordranks" :key="idx">
        <p>{{idx + 1}}.{{elWord[0]}}</p>
        <div>
          <div :style="barstyle(elWord[1])">{{elWord[1]}}</div>
        </div>
      </div>
    </div>
  </div>`,
  mounted(){
    Vue.axios.get('/dataword.json').then((res)=>{
      //console.log(res.data)
      this.wordranksRaw = res.data
    })

    Vue.axios.get('/dataword.json?period=201810').then((res)=>{
      console.log(res.data)
    })
  }
})