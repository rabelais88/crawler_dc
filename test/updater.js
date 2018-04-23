function getNextSequence(name) {
  var ret = db.counters.findAndModify(
         {
           query: { _id: name },
           update: { $inc: { seq: 1 } },
           new: true
         }
  );

  return ret.seq;
}

db.people.find().forEach(function(doc){
     
  var newBooks = [];
  newBooks = doc.books;
  for(var i in newBooks){
      newBooks[i].id = getNextSequence("books");
  }
   
  db.people.update({_id :  doc._id}, {$set: {
      id : getNextSequence("people"),
      books: newBooks
  }});    

});