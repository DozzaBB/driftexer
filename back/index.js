import * as AWS from "@aws-sdk/client-dynamodb";
// import secrets from './secrets.js'
import { getSite } from './oftheday.js';
import { doDriftex } from "./playwright.js";

const DRIFTEX_TABLE = "DRIFTEX";

const client = new AWS.DynamoDBClient({
  region: "ap-southeast-2",
  // credentials: {
  //   secretAccessKey: secrets.secretKey,
  //   accessKeyId: secrets.accessKey
  // }
});

function todayDate() {
  const a = new Date();
  const b = a.toISOString()
  return b.substring(0, 10);
}
console.log("Today date:")
console.log(todayDate())

async function ensureTodaysItems() {
  // See if there is anything there.
  let { Item } = await client.send(new AWS.GetItemCommand({
    TableName: DRIFTEX_TABLE,
    Key: {
      id: {
        "S": todayDate()
      }
    }
  }));
  if (!Item) {
    console.log("Adding entry for today");
    await client.send(new AWS.PutItemCommand({
      TableName: DRIFTEX_TABLE,
      Item: {
        id: {
          "S": todayDate(),
        },
        images: {
          "L": []
        }
      }
    }));

    const r = await client.send(new AWS.GetItemCommand({
      TableName: DRIFTEX_TABLE,
      Key: {
        id: {
          "S": todayDate()
        }
      }
    }));
    Item = r.Item;

  } else {
    console.log("Entry in DB already exists.");
  }
  Item.images ??= serialise([]);
  return deserialise(Item)
}

async function save(doc) {
  const a = {};
  for (const k of Object.keys(doc)) {
    a[k] = serialise(doc[k]);
  }
  console.log(`Saving item ${doc.id} in database.`)
  return client.send(new AWS.PutItemCommand({
    TableName: DRIFTEX_TABLE,
    Item: a
  }));
}

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
  if (typeof ob === "object") {
    // Must be a toplevel
    const a = {}
    for (const b of Object.keys(ob)) {
      a[b] = deserialise(ob[b]);
    }
    return a;
  }
}

function serialise(ob) {
  if (Array.isArray(ob)) {
    return { "L": ob.map(serialise) }
  }
  if (typeof ob == "string") {
    return { "S": ob }
  }
  if (typeof ob == "object") {
    const a = {}
    for (const b of Object.keys(ob)) {
      a[b] = serialise(ob[b])
    }
    return { "M": a };
  }
}

export const handler = async (event) => {
  // See if there is an item for today already
  const currentDoc = await ensureTodaysItems();
  const potentialNewPrompts = await getSite();

  for (const np of potentialNewPrompts) {
    if (!currentDoc.images.map((i) => i.prompt).includes(np)) {
      console.log(`Adding new prompt to database: ${np}`);
      currentDoc.images.push({prompt: np.replace("Today is ", "")});
    }
  }

  await save(currentDoc);

  // get which prompts need AI-ing.
  const promptsToDo = [];
  for (const p of currentDoc.images) {
    if (!p.src) {
      promptsToDo.push(p.prompt);
    }
  }

  // Do some fucking web scraping.
  console.log("Starting chrome");
  console.log("Prompting...")
  const { pairs } = await doDriftex(promptsToDo)

  for (const pair of pairs) {
    const a = currentDoc.images.find((i) => i.prompt === pair.prompt);
    if (a) {
      a.src = pair.src;
    } else {
      console.log(`Couldnt find an original entry for ${pair.prompt}`)
    }
  }
  await save(currentDoc);

  const response = {
    statusCode: 200,
    body: "Finished.",
  };
  return response;

};