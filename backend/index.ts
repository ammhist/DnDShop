import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import bodyParser from 'body-parser';
import OpenAI from 'openai';


dotenv.config();
const cors = require('cors');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY, // defaults to process.env["OPENAI_API_KEY"]
});


const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200
}
const app: Express = express();
app.use(cors(corsOptions));
const port = process.env.PORT || 8080; // default port to listen


const getsheet = async () => {
  try {
    const target = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const jwt = new google.auth.JWT(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      null as any,
      (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      target
    );

    const sheets = google.sheets({ version: 'v4', auth: jwt });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1', // sheet name
    });


    return response.data.values;
  } catch (err) {
    console.log(err);
  }
  return [];
}

app.post('/shop', bodyParser.json(), async (req: Request, res: Response) => {
  const data = await getsheet() as any;
  //convert data to a string array
  const shopSize = req.body.size;
  const tags = req.body.tags;
  const quality = req.body.quality;
  const details = req.body.details;


  let generalItems = filter(data, tags, quality, shopSize) as string[];
  let completion;
  if(!details){
  completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: `
      you are an ai chat bot used to create descriptions for D&D shops. you need to return a name for a shop/tavern, the species of the owner and what the owner looks like and a brief description.
      Please send the data like this in a json object 
      {
        shopName:{name of the shop dont use the word Emporium },
        shopDescription:{dont describe where it is or its location just what it looks like on the inside also dont state its quailty describe it"},
      ownerName:{name of the owner},
      ownerLooks:{what the owner looks like and their species make it a short description like "a tall human with a scar on their face"}
      }
      `},
      { role: 'user', content: `give me a new shop. it's a  ${quality} quality shop and sell ${tags} type of items and the list of items you sell is ${generalItems}` }
  ],
    model: 'gpt-3.5-turbo',
  });
}else{
  completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: `
      you are an ai chat bot used to create descriptions for D&D shops. you need to return a name for a shop/tavern, the species of the owner and what the owner looks like and a brief description.
      Please send the data like this in a json object
      {
      shopName:{name of the shop dont use the word Emporium },
      shopDescription:{dont describe where it is or its location just what it looks like also dont state its quailty describe it"},
      ownerName:{name of the owner},
      ownerLooks:{what the owner looks like and their species make it a short description like "a tall human with a scar on their face"}
      }
      `},
      { role: 'user', content: `give me a new shop i want to add these additions ${details} please focus on them. it's a  ${quality} quality shop and sell ${tags} type of items and the list of items it sell is ${generalItems}` }
  ],
    model: 'gpt-3.5-turbo',
  });
}
  console.log(completion.choices[0].message.content);


  const payload = {
    description : completion.choices[0].message.content,
    items : generalItems
  }
  res.send(payload);
}
);


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});


const filter = (data: string[], type: string[], Quality: string, amount: number) => {
  let filteredItems = data.filter(item => type.includes(item[2]))
  let itemList = [] as string[];
  if (Quality === "low") {
    itemList = shopQuality(filteredItems, [0.7, 0.9, 0.95, .99], amount);
  }
  else if (Quality === "medium") {
    itemList = shopQuality(filteredItems, [0.5, 0.7, 0.9, .95], amount);
  }
  else if (Quality === "high") {
    itemList = shopQuality(filteredItems, [0.3, 0.5, 0.7, .9], amount);
  }

  return itemList;
}


const filtyByQuality = (newfilteredItems: string[], itemList: string[], Quality: string) => {
  let filteredItems = newfilteredItems.filter(item => item[1] === Quality)
  //remove all items from filteredItems that are already in itemList
  filteredItems = filteredItems.filter(item => !itemList.includes(item))

  if (filteredItems.length === 0) {
    filteredItems = newfilteredItems
  }

  let randomItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];
  while (itemList.includes(randomItem)) {
    randomItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];
  }
  return randomItem;
}

const shopQuality = (filteredItems: string[], Quality: number[], amount: number) => {
  let itemsGenerated = 0 as number;
  let itemList = [] as string[];
  if (filteredItems.length < amount) {
    amount = filteredItems.length - 1;
  }
  while (itemsGenerated < amount) {

    //weight the items based on their quality and return a item it can return a item with a higher quality than the one it was given
    let random = Math.random();
    if (random > Quality[0] && random < Quality[1]) {
      let randomItem = filtyByQuality(filteredItems, itemList, "Uncommon")
      if (randomItem === "No more items") {
        break;
      }
      itemList.push(randomItem);

    }
    else if (random > Quality[1] && random < Quality[2]) {
      let randomItem = filtyByQuality(filteredItems, itemList, "Rare")
      if (randomItem === "No more items") {
        break;
      }
      itemList.push(randomItem);
    }
    else if (random > Quality[2] && random < Quality[3]) {
      let randomItem = filtyByQuality(filteredItems, itemList, "Vary Rare")
      if (randomItem === "No more items") {
        break;
      }
      itemList.push(randomItem);
    }
    else if (random > Quality[3]) {
      let randomItem = filtyByQuality(filteredItems, itemList, "Legendary")
      if (randomItem === "No more items") {
        break;
      }
      itemList.push(randomItem);
    }
    else {
      let randomItem = filtyByQuality(filteredItems, itemList, "Common")
      if (randomItem === "No more items") {
        break;
      }

      itemList.push(randomItem);
    }
    if (itemList.length === filteredItems.length) {
      break;
    }
    itemsGenerated++;
  }
  return itemList;
}
