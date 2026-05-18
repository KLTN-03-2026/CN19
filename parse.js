const fs = require('fs');
const html = fs.readFileSync('ticketbox.html', 'utf8');
const regex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;
const match = html.match(regex);
if (match) {
  const data = JSON.parse(match[1]);
  console.log(Object.keys(data.props.initialState));
  if (data.props.initialState.home) {
     fs.writeFileSync('ticketbox_data.json', JSON.stringify(data.props.initialState.home, null, 2));
     console.log('Saved home data');
  } else if (data.props.pageProps) {
     fs.writeFileSync('ticketbox_data.json', JSON.stringify(data.props.pageProps, null, 2));
     console.log('Saved pageProps data');
  } else {
     fs.writeFileSync('ticketbox_data.json', JSON.stringify(data, null, 2));
     console.log('Saved all data');
  }
} else {
  console.log('No NEXT_DATA found');
}
