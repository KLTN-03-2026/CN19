const fs = require('fs');
fetch('https://ticketbox.vn/')
  .then(res => res.text())
  .then(text => {
    fs.writeFileSync('ticketbox.html', text);
    console.log('Saved to ticketbox.html');
  })
  .catch(err => console.error(err));
