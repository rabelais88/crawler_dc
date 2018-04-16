dcinside.com gallery crawler
디씨인사이드 갤러리 크롤러
===

목표
---
1. 디씨 인사이드에 올라오는 특정 갤러리의 글을 수집.
2. 형태소 단위로 잘라낸다.
3. 가장 인기있는 단어나 요소들을 찾아본다.
4. 정리된 자료를 기반으로 인터랙티브 페이지를 띄운다.

상시 크롤링은 자원이 많이 낭비되고 가장 저렴한 서버를 이용중이므로
크롤러 파트와 인터랙티브 파트를 따로 분류하여 만든다.

사용된 기술
---
Chrome headless, puppeteer, node.js

사용방법
---
1. yarn 또는 npm 을 사용하여 필수조건들을 설치한다.
> yarn install
> npm i
2. 리눅스 환경에서 mecab-ko를 설치한다.
3. 기초 세팅값을 입력하고 저장한다.
4. MongoDB daemon(mongod)을 실행시킨다.
> systemctl start mongod
5. crawler_dc.js를 이용하여 필요한 값을 크롤링하면 MongoDB에 값이 저장된다.
> node crawler_dc.js
6. analyze_dc.js를 이용하여 MongoDB에 저장된 값으로 분석하면 텍스트 파일이 생성된다.
> node_analyze_dc.js
7. tempanalylzer.js를 실행하면 최종 필터링 및 소트된 값이 텍스트 파일로 저장된다.(임시)
> node tempanalyzer.js

만든 사람
---
박성렬(Sungryeol Park)
sungryeolp@gmail.com
http://sungryeol.com