const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()
const { MongoClient } = require('mongodb');
// middleware
app.use(cors())
app.use(express.json())
// mongodb connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gr8kgxz.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);

async function run() {
    try {
        const jobsCollection = client.db('SoloSphere').collection('jobs')
        const bidsCollection = client.db('SoloSphere').collection('bids')
        //get all jobs data api 
        app.get('/jobs', async (req, res) => {
            const cursor = jobsCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('SoloSphere now available')
})

app.listen(port, () => {
    console.log(`SoloSphere running on ${port}`);
})