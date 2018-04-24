import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import 'babel-polyfill'
import VueWordCloud from 'vuewordcloud';

Vue.component(VueWordCloud.name, VueWordCloud);
Vue.use(VueAxios, axios)

const myapp = new Vue({
  el:'#vueframe',
  data(){
    return{
      wordranksRaw:[],
      currentGallery:'',
      galleries:{},
      filterTops:[
        ['상위 10개 - Top 10',10],
        ['상위 50개 - Top 50',50],
        ['상위 100개 - Top 100',100]
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
          if( el === 'all.json') return ['모든 기간 - 본문 All Periods-Contents only',el]
          else if (el === 'titleAll.json') return ['모든 기간 - 제목 All Periods-Titles only',el]
          else {
            let newName = [`${el.substr(0,4)}년 ${el.substr(4,2)}월`,el]
            if(el.includes('title')) newName[0] += ' - 제목 Title'
            else newName[0] += ' - 본문 Content'
            return newName
          }
        })
        this.filterPeriods.reverse()
        this.filterPeriod = this.filterPeriods[0][1]
        this.changePeriod()
      })
    }
  },
  template:`
  <div>
    <div class="title">
      <h1>{{galleries[currentGallery]}} 인기 단어 순위</h1>
      <h2>most frequently used words of {{galleries[currentGallery]}}</h2>
      <p>숫자는 각 글에서 한번 이상 언급된 횟수 기준.</p>
      <p>The numbers are based on the occurence of words at least once in each document</p>
      <p>web scraping & data analysis project - sungryeolp@gmail.com <a href="http://sungryeol.com">http://sungryeol.com</a> (Sungryeol Park)</p>
      <p>Node.js + Vue.js + Puppeteer(Headless-Chrome) + Mecab-KO(Morpheme Analyzer)</p>
      <p>Data scraped around 2018.4.21 ~ 24</p>
    </div>
    <hr>

    <div class="filters">
      <select v-model="currentGallery" @change="changeGallery">
        <option v-for="(elGallery,idx) in galleriesList" :key="idx" :value="elGallery[0]">{{elGallery[1]}}</option>
      </select>
      
      <select v-model="filterTop">
        <option v-for="(elTop, idx) in filterTops" :key="idx" :value="elTop[1]">{{elTop[0]}}</option>
      </select>

      <select v-model="filterPeriod" @change="changePeriod">
        <option v-for="(elPeriod, idx) in filterPeriods" :key="idx" :value="elPeriod[1]">{{elPeriod[0]}}</option>
      </select>
    </div>

    <hr>

    <transition-group class="chart" name="fade" tag="div">
      <div class="elChart" v-for="(elWord, idx) in wordranks" :key="idx">
        <p>{{idx + 1}}.{{elWord[0]}}</p>
        <div>
          <div :style="barstyle(elWord[1])">{{elWord[1]}}</div>
        </div>
      </div>
    </transition-group>
  </div>`,
  mounted(){
    //get query string and refer to it
    let uri = window.location.search.substring(1); 
    let params = new URLSearchParams(uri);
    let gallery = params.get("gallery")

    Vue.axios.get('/pub/data/alias.json').then(res=>{
      this.galleries = res.data
      this.currentGallery = gallery ? gallery : Object.keys(res.data)[0]
      this.changeGallery()
      VueWordCloud.createCanvas()
    })

  }
})