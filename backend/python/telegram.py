import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from telethon import TelegramClient, sync, events
from pprint import pprint
from datetime import timezone

# Fetch the service account key JSON file contents
cred = credentials.Certificate('../../config/trading-ada0e-82953ce12be2.json')

# Initialize the app with a service account, granting admin privileges
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://trading-ada0e.firebaseio.com'
})

# As an admin, the app has access to read and write all data, regradless of Security Rules
ref = db.reference('telegram')

# api_hash from https://my.telegram.org, under API Development.
api_id = 152512
api_hash = '8987d086edea269eff9974705122e60e'

client = TelegramClient('session_name', api_id, api_hash)

@client.on(events.NewMessage)
async def my_handler(event: events.NewMessage.Event):
    message_id = str(event.message.id)
    ref.child(str(event.to_id.channel_id)+"/"+message_id).set({
        'raw_text': event.raw_text,
        'from_id': event.from_id,
        'timestamp': int(event.date.replace(tzinfo=timezone.utc).timestamp())
    })

with client.start():
    print('(Press Ctrl+C to stop this)')
    client.run_until_disconnected()