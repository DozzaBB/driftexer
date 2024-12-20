import * as AWS from "@aws-sdk/client-dynamodb";
import fs from "node:fs";
import secrets from './secrets.js'
const DRIFTEX_TABLE = "DRIFTEX";

function deserialise(ob) {
  if (ob.L) {
    return ob.L.map(deserialise)
  }
  if (ob.S) {
    return String(ob.S)
  }
  if (ob.M) {
    const a = {}
    for (const k of Object.keys(ob.M)) {
      a[k] = deserialise(ob.M[k])
    }
    return a;
  }
}

const client = new AWS.DynamoDBClient({
  region: "ap-southeast-2",
  credentials: {
    secretAccessKey: secrets.secretKey,
    accessKeyId: secrets.accessKey
  }
});

function todayDate() {
  return new Date().toISOString().substring(0, 10);
}

async function getItem(date) {
  const c = await client.send(new AWS.GetItemCommand({
    TableName: DRIFTEX_TABLE,
    Key: {
      id: {
        "S": date
      }
    }
  }))
  console.log("Item:");
  console.log(c.Item);
  const result = deserialise({M: c.Item ?? {}});
  console.log(result);
  return result;
  // return {
  //   id: "someday",
  //   images: [{
  //     prompt: "blah1",
  //     src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
  //   },
  //   {
  //     prompt: "dog",
  //     src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzySO8TACxxZVykdof7q6tJYrA8c_XfgGV8w&s"
  //   }
  //   ]
  // }
}

export const handler = async (event, context) => {
  // Figure out what day is requested.
  const today = event?.queryStringParameters?.date ?? todayDate();

  // Look in the DynamoDB.
  const result = await getItem(today);

  const templateString = fs.readFileSync("./index.hbs", 'utf-8');
  const pageHTML = templateString.replace("JSONDATA", JSON.stringify(result))

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html"
    },
    body: pageHTML,
  };

  return response;
};


async function dev() {
  const html = await handler();
  const body = html.body;
  fs.writeFileSync("./index.html", body);
}

dev()
