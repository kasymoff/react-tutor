const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require("mongodb");
import path from 'path';

const uri = 'mongodb+srv://admin:123cxzqwedsa@cluster0.ebnsfkn.mongodb.net/?retryWrites=true&w=majority';

const app = express();

app.use(express.static(path.join(__dirname, 'build')))
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = new MongoClient(uri);
    const db = client.db('my-blog'); 
    await operations(db)
    client.close();
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to DB', error });
  }
};

app.get('/api/articles/:name', async (req, res) => {

  withDB(async (db) => {
    const articleName = req.params.name;
    const articles = db.collection('articles');
    const articleInfo = await articles.findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res)

});

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articles = db.collection('articles');
    const articleInfo = await articles.findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      }
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  });
});

app.post('/api/articles/:name/downvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articles = db.collection('articles');
    const articleInfo = await articles.findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes - 1,
      }
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  });
});

app.post('/api/articles/:name/add-comment', async (req, res) => {
  withDB(async(db) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        comments: articleInfo.comments.concat( { username, text } ),
      }
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));
