#/bin/bash

endpoint='https://api.awesome-ness.me'
token='H0tPfcrk07b2fhIYRRqflFM5GH3iN864OQ6pZm7k2z3-1cWbsZFDTUAGxC7tYxKGbTw565GMp55cNToJPXOW_w=='

# {
#    "id": 7,
#    "userName": "TestUser2",
#    "firstName": "Pikachu",
#    "lastName": "BobbyJoe",
#    "photoURL": "https://www.gravatar.com/avatar/e8063fea017f9a96d2dc3a30c3efc8b3"
# }
token2='I_FoXP7EFplc0YtGVpd3OV8HSeFBv6aBXxuZsevaWJuD9Jy7LGw4j7vmujN-D63ah4u_P-EHVQNwXe0vS1J9Sw=='


# /v1/channels
echo "Testing /v1/channels..."

# Test GET /v1/channels
echo "Testing GET /v1/channels..."
curl --location --request GET "${endpoint}/v1/channels" \
--header "Authorization: Bearer ${token}"
echo

# Test POST /v1/channels
echo "Testing POST /v1/channels..."
## Create basic channel
curl --location --request POST "${endpoint}/v1/channels" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "testChannel",
    "description": "testDescription"
}'
echo

## Create private channel
curl --location --request POST "${endpoint}/v1/channels" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "testPrivateChannel",
    "description": "testDescription for test private channel",
    "private": true
}'
echo

## Create private channel with another user
curl --location --request POST "${endpoint}/v1/channels" \
--header "Authorization: Bearer ${token2}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "testPrivateChannel2",
    "description": "testDescription for test private channel",
    "private": true
}'
echo
echo

# /v1/channels/{channelID}
echo "Testing /v1/channel/{channelID}..."

publicChannelID='60a98afa4d266800184b7af0'
privateChannelID='60a9a9b6b3ce3a0018d785fe'
privateChannelID2='60a9ac58b3ce3a0018d7860e' # created by token2

# Test GET /v1/channels/{channelID}
echo "Testing GET /v1/channel/{channelID}..."
## Get a public channel's messages
curl --location --request GET "${endpoint}/v1/channels/${publicChannelID}" \
--header "Authorization: Bearer ${token}"
echo

## Get a private channel's messages (one we have access to)
curl --location --request GET "${endpoint}/v1/channels/${privateChannelID}" \
--header "Authorization: Bearer ${token}"
echo

## Get a private channel's messages (one we DON'T have access to)
curl --location --request GET "${endpoint}/v1/channels/${privateChannelID2}" \
--header "Authorization: Bearer ${token}"
echo

# Test POST /v1/channels/{channelID}
echo "Testing POST /v1/channel/{channelID}..."
## Add to a public channel's messages
curl --location --request POST "${endpoint}/v1/channels/${publicChannelID}" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "body": "hello WORLD"
}'
echo

## Add to a private channel's messages (one we have access to)
curl --location --request POST "${endpoint}/v1/channels/${privateChannelID}" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "body": "hello WORLD"
}'
echo

## Add to a private channel's messages (one we DON'T have access to)
curl --location --request POST "${endpoint}/v1/channels/${privateChannelID2}" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "body": "hello WORLD"
}'
echo




# Test PATCH /v1/channels/{channelID}
echo "Testing PATCH /v1/channel/{channelID}..."
## Update a public channel
curl --location --request PATCH "${endpoint}/v1/channels/${publicChannelID}" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "newPublicChannelName1",
    "description": "newPublicDescriptionName1"
}'
echo

## Update a private channel (one we have access to)
curl --location --request PATCH "${endpoint}/v1/channels/${privateChannelID}" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "newPrivateChannelName1",
    "description": "newPrivateDescriptionName1"
}'
echo

## Update a private channel (one we DON'T have access to)
curl --location --request PATCH "${endpoint}/v1/channels/${privateChannelID2}" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "newPrivateChannelName2",
    "description": "newPrivateDescriptionName2"
}'
echo


# Test DELETE /v1/channels/{channelID}
echo "Testing DELETE /v1/channel/{channelID}..."
## Delete a public channel we didn't create
curl --location --request DELETE "${endpoint}/v1/channels/${publicChannelID}" \
--header "Authorization: Bearer ${token}"
echo

## Delete a private channel we created
curl --location --request DELETE "${endpoint}/v1/channels/${privateChannelID}" \
--header "Authorization: Bearer ${token}"
echo

## Delete a private channel we didn't create
curl --location --request DELETE "${endpoint}/v1/channels/${privateChannelID2}" \
--header "Authorization: Bearer ${token}"
echo
echo

# Test POST /v1/channels/{channelID}/members..."
echo "Testing /v1/channels/{channelID}/members..."
echo "Testing POST /v1/channel/{channelID}/members..."
curl --location --request POST "${endpoint}/v1/channels/${publicChannelID}/members" \
--header "Authorization: Bearer ${token}" \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": 7,
    "email": "test@uw.edu"
}'


