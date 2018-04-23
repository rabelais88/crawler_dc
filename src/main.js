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
      currentGallery:'',
      galleries:{},
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
    },
    galleriesList(){
      return Object.keys(this.galleries).map(elKey=>
        [elKey, this.galleries[elKey]])
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
      Vue.axios.get('/pub/data/' + this.currentGallery + '/' + this.filterPeriod).then(res=>{
        this.wordranksRaw = res.data.words
      })
    },
    changeGallery(){
      console.log('gallery request')
      Vue.axios.get('/datalist.json?gallery=' + this.currentGallery).then(res=>{
        this.filterPeriods = res.data.map(el=>{
          if( el === 'all') return ['모든 기간',all]
          else {
            let newName = [`${el.substr(0,4)}년 ${el.substr(4,2)}월`,el]
            if(el.includes('title')) newName[0] += ' - 제목'
            return newName
          }
        })
        this.filterPeriod = this.filterPeriods[0][1]
        this.changePeriod()
      })
    }
  },
  template:`
  <div>
    <h1>{{galleries[currentGallery]}} 인기 단어 순위</h1>
    <br>
    {{filterTop}} {{filterPeriod}}<br>
    
    <select v-model="currentGallery" @change="changeGallery">
      <option v-for="(elGallery,idx) in galleriesList" :key="idx" :value="elGallery[0]">{{elGallery[1]}}</option>
    </select>
    
    <select v-model="filterTop">
      <option v-for="(elTop, idx) in filterTops" :key="idx" :value="elTop[1]">{{elTop[0]}}</option>
    </select>

    <select v-model="filterPeriod" @change="changePeriod">
      <option v-for="(elPeriod, idx) in filterPeriods" :key="idx" :value="elPeriod[1]">{{elPeriod[0]}}</option>
    </select>
    <div id="wordcloud"></div>
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
    Vue.axios.get('/pub/data/alias.json').then(res=>{
      this.galleries = res.data
      this.currentGallery = Object.keys(res.data)[0]
      this.changeGallery()
    })

  }
})