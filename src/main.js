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
      filterPeriods:[['모든 기간','all']],
      filterTop:10,
      filterPeriod:'all'
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
    },
    changePeriod(){
      console.log('period changed:' + this.filterPeriod)
      Vue.axios.get('/pub/data/' + this.filterPeriod).then(res=>{
        console.log(res.data)
        this.wordranksRaw = res.data.words
      })
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

    <select v-model="filterPeriod" @change="changePeriod">
      <option v-for="(elPeriod, idx) in filterPeriods" :key="idx" :value="elPeriod[1]">{{elPeriod[0]}}</option>
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
    Vue.axios.get('/dataword.json').then(res=>{
      //console.log(res.data)
      this.wordranksRaw = res.data
    })


    //list test

    Vue.axios.get('/datalist.json').then(res=>{
      //console.log('available data list: ', res.data)
      res.data = res.data.map(el=>
        [`${el.substr(0,4)}년 ${el.substr(4,2)}월`,el]
      )
      this.filterPeriods = [...this.filterPeriods, ...res.data]
    })
  }
})