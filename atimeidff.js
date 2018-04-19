const moment = require('moment')
var a = moment(),
    b = moment().add('hours', 1);
console.log(moment.duration(a.diff(b)).humanize()) // a - b
console.log(moment.duration(b.diff(a)).humanize()) // b - a
