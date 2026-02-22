# Lifetime License Discord Bot (Node.js + discord.js v14)

A production-ready Discord bot that provides a lifetime-only license system, channel-based multi-product downloads, blacklist controls, maintenance mode, panic mode, and a ticket system.

## Requirements

- Node.js 18+
- A Discord bot application and token
- A Discord server where you can invite the bot
- Permissions: View Channels, Send Messages, Read Message History, Manage Channels (required for tickets)

## Installation

1) Download or copy the project files into a folder using this exact structure:

index.js  
package.json  
config.json  
/commands  
/events  
/utils  
/data  

2) Install dependencies:

npm install

3) Configure `config.json` (see below).

4) Start the bot:

npm start

If your token is correct and the bot has access to the server, it will come online immediately.

## Configuration

Edit `config.json`:

- `token`: Your Discord bot token
- `ownerId`: Your Discord user ID (owner-only commands and bypass maintenance)
- `prefix`: Command prefix (default: ".")
- `maintenance`: true/false (can be changed with command and persists)
- `supportRoleId`: Role ID for support staff (can close tickets)
- `channelProducts`: Maps channel IDs to product JSON files

Example:

{
  "ownerId": "YOUR_ID",
  "prefix": ".",
  "maintenance": false,
  "supportRoleId": "ROLE_ID",
  "token": "YOUR_BOT_TOKEN_HERE",
  "channelProducts": {
    "CHANNEL_ID_1": "product1.json",
    "CHANNEL_ID_2": "product2.json",
    "CHANNEL_ID_3": "product3.json"
  }
}

## Product Setup (Multi Product System)

Products are configured inside `/data/`:

- product1.json
- product2.json
- product3.json
- tutorial.json (optional)

Each product file supports:

- `title`: Title used in the delivery embed after redeem
- `embedTitle`: Title used when owner posts `.embed`
- `embedDescription`: Description used when owner posts `.embed`
- `embedColor`: Embed color number
- `content`: The delivered content text shown after successful activation

Important:
- The product shown depends on the channel ID where `.embed` is used.
- If a channel is not mapped in `channelProducts`, `.embed` will return an error.
- The download button always references the mapped product file and is not hardcoded.

## License System (Lifetime Only)

Key format:

XXXX-XXXX-XXXX-XXXX

Rules:
- Keys are generated using crypto.randomBytes
- Keys are unique
- Keys never expire
- Keys become permanently bound to the first user who successfully activates them
- A used key cannot be used again

Anti brute-force:
- Max 3 failed attempts per user per key
- 5 minute cooldown after 3 failures

## Redeem / Download Flow

1) Owner posts the product embed using `.embed` in a mapped channel
2) User clicks the Download button
3) Bot asks the user to type the license key within 60 seconds
4) The prompt message deletes itself after 60 seconds
5) The message containing the key typed by the user is deleted immediately
6) If successful, the product delivery embed is sent and auto-deletes after 5 minutes

Validation performed on download:
- User not blacklisted
- Bot not in maintenance mode (unless owner)
- Key exists
- Key not revoked
- Key not suspended
- Key not used
- Key not bound to a different user
- Brute-force protection enforced

## Blacklist System

Blacklist file: `/data/blacklist.json`

Format:
{ "USER_ID": "reason" }

Blacklisted users cannot redeem keys.

## Maintenance Mode

Command:
- `.maintenance on`
- `.maintenance off`

When enabled:
- Only the owner can use commands
- Everyone else receives: "The bot is currently under maintenance."
- The setting persists in config.json

## Panic Mode

Command:
- `.panic`
- `.panic maintenance`

Behavior:
- Suspends all keys immediately
- Logs the action
- Sends a warning embed
- Optional: enables maintenance mode if you include `maintenance`

## Ticket System

Commands:
- `.ticket` creates a private support channel
- `.close_ticket` closes the ticket channel

Ticket behavior:
- The ticket creator can see and chat in the ticket
- The owner always has access
- The support role (supportRoleId) has access (if configured)
- Ticket created confirmation message deletes itself after 10 seconds

## Commands

Prefix is whatever you set in `config.json` (default: ".")

Public Commands:
- `.help`  
  Shows help menu with explanations (lifetime licenses, products, troubleshooting, maintenance, blacklist)
- `.bot_info`  
  Shows bot name, version, developer, ping, uptime, total keys, used keys, suspended keys, blacklisted users
- `.ticket`  
  Creates a private support ticket channel
- `.close_ticket`  
  Closes a ticket (owner or support role)

Owner Commands:
- `.embed`  
  Posts product embed and Download button based on channel ID mapping
- `.gen_key [count]`  
  Generates lifetime keys (1 to 50 per command)
- `.key_info <key>`  
  Shows info for a key
- `.key_list [all|unused|used|revoked|suspended]`  
  Lists keys by filter
- `.revoke_key <key>`  
  Revokes a key
- `.suspend_key <key>`  
  Suspends a key
- `.activate_key <key>`  
  Unsuspends a key
- `.reset_key <key>`  
  Resets a key to unused and clears binding, status, attempts
- `.blacklist @user [reason]`  
  Adds user to blacklist
- `.unblacklist @user`  
  Removes user from blacklist
- `.maintenance on|off`  
  Toggles maintenance mode and saves to config.json
- `.panic [maintenance]`  
  Suspends all keys, optionally enables maintenance mode
- `.reload`  
  Reloads commands and events without restarting the bot
- `.activity <text>`  
  Sets the bot presence/activity text

## Common Issues and Fixes

### Bot does not start
- Make sure Node.js is version 18 or higher
- Run `npm install` again
- Ensure `config.json` is valid JSON (no trailing commas)
- Ensure `token` is correct and not empty
- Make sure the bot is invited to your server

### Commands do nothing
- Check `prefix` in config.json
- Ensure the bot has permission to read messages in that channel
- Ensure you are using the correct prefix and command name

### `.embed` says channel not mapped
- Add the channel ID to `channelProducts` in config.json
- Map it to one of: product1.json, product2.json, product3.json, tutorial.json

### Ticket creation fails
- Ensure bot has Manage Channels permission
- Ensure the server allows creating channels
- Check role permissions and channel category restrictions

### Download button works but redeem fails
- Check if the user is blacklisted
- Check if the key exists in `/data/keys.json`
- Check if the key is revoked/suspended/used
- Brute-force protection may be active (cooldown after 3 failures)

## Support / Issues

If you find a bug or the bot fails to work as described:
- Open a GitHub issue with:
  - What you did
  - What you expected
  - What happened
  - Console logs (if available)
  - Your `config.json` with the token removed

If it is a real issue in the bot code, it should be reported and will be fixed.


## ☕ Buy Me a Coffee

I build this project for fun and share it for free.  
If it helped you and you’d like to say thanks, you can buy me a coffee 🙂

Crypto tips, never expected):

BTC: `bc1q2yu6k43zxx8ztvtcfuly7e7fjcsj37gmpve9nf`  
ETH: `0xF1a48631EF980526c27cbc289633062Dac7845Fb`  
LTC: `LTt69M4MUdZutpjjC1zyhuUniWcFV18Eno`
