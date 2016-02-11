A game server for the Citadels card game where players can join and play in random games.

No UI exists yet. Only test bots can play against each other.

To run the server and test bots:

1. openssl req -nodes -new -x509 -keyout keys/key.pem -out keys/cert.pem -days 365
2. Enter in a username and password for Cloudant into the config.json file and save.
3. `node app.js`
4. In four more shells, run `node test_bot.js`
