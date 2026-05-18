const fs = require('fs');
const html = fs.readFileSync('ticketbox.html', 'utf8');
const regex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;
const match = html.match(regex);
if (match) {
  const data = JSON.parse(match[1]);
  fs.writeFileSync('ticketbox_data2.json', JSON.stringify(data.props.initialState.homePage, null, 2));
}
