import requests

tokens = (
    'H0tPfcrk07b2fhIYRRqflFM5GH3iN864OQ6pZm7k2z3-1cWbsZFDTUAGxC7tYxKGbTw565GMp55cNToJPXOW_w==',
    'ZDl5NoJzMI5CaCv0F-bMK3KveshmHauZzEo9ZzJ3iEUXiVv6IMqGY1F07QrMe5jT7UxiIuFhGLCkJrV8xI7C1A=='
)
endpoint = "https://api.awesome-ness.me"
headers = {"Authorization": f"Bearer ${token}"}

testChannel = {
    "name": "testChannel",
    "description": "testDescription"
}

def v1_channels(method, body, token=tokens[0]):
    if method == 'GET':
        resp = requests.get(f"{endpoint}/v1/channels")
    elif method == 'POST':
        resp = requests.post(f"{endpoint}/v1/channels", data=body)


def v1_channels_channelID(cid, method, body, token=tokens[0]):
    pass

def v1_channels_channelID_members(cid, method, body, token=tokens[0]):
    pass

def v1_messages_messageID(mid, method, body, token=tokens[0]):
    if method == 'PATCH':
        pass
    elif method == 'DELETE':
        pass

