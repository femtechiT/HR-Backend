const fs = require('fs');

// Read the current Postman collection
const collectionPath = './hr_management_system_api_updated.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Define the invitation endpoints to add
const invitationEndpoints = {
  "name": "Staff Invitation",
  "item": [
    {
      "name": "Invite New Staff",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"personalEmail\": \"john.doe@example.com\",\n  \"roleId\": 2,\n  \"branchId\": 1\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/staff-invitation/invite",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "staff-invitation",
            "invite"
          ]
        }
      },
      "response": []
    },
    {
      "name": "Deactivate Staff (with email removal)",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/staff-invitation/1",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "staff-invitation",
            "1"
          ]
        }
      },
      "response": []
    }
  ]
};

// Add the invitation endpoints to the collection
collection.item.push(invitationEndpoints);

// Write the updated collection back to the file
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));

console.log('Added invitation endpoints to Postman collection successfully!');