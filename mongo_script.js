db.users.find({}).forEach(function(u) {
  if (u.nim === '23051204212') return;
  if (u.nim.startsWith('23')) {
    var firstName = u.name.split(' ')[0].toLowerCase();
    var last3 = u.nim.slice(-3);
    var em = firstName + '.23' + last3 + '@mhs.unesa.ac.id';
    db.users.updateOne({ _id: u._id }, { $set: { email: em } });
  }
});
