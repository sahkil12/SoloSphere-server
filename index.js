const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()
const { MongoClient, ObjectId } = require('mongodb');
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
        // job post 
         app.post('/job', async (req, res)=>{
            const jobData = req.body
            const result = await jobsCollection.insertOne(jobData)
            res.send(result)
        })
        const bidsCollection = client.db('SoloSphere').collection('bids')
        //get all jobs data api 
        app.get('/jobs', async (req, res) => {
            const cursor = jobsCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        //get single job data api 
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query =  {_id: new ObjectId(id)}
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })
        // get all jobs post a specific user 
        app.get('/jobs/:email', async (req, res)=>{
            const email = req.params.email;
            const query = {'buyer.email': email}
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })
        // delete job from db 
        app.delete('/job/:id', async(req, res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })          
        // update my jobs data 
        app.put('/job/:id', async(req, res)=>{
            const id = req.params.id
            const filter = {_id: new ObjectId(id)}
            const jobData = req.body
            const options = { upsert: true };
            const updateDoc ={
                $set:{
                    ...jobData
                }
            }
            const result = await jobsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        // save bid data api 
        app.post('/bid', async (req, res)=>{
            const bidData = req.body
            const result = await bidsCollection.insertOne(bidData)
            res.send(result)
        })
        // get bids data 
        app.get('/myBids/:email', async(req, res)=>{
            const email = req.params.email
            const query = {email: email}
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })
        // get bids requests from db for job owner
        app.get('/bid-requests/:email', async(req, res)=>{
            const email = req.params.email
            const query = {buyer_email: email}
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })
        // update bids status 
        app.patch('/bidUpdate/:id', async ( req, res )=>{
            const id = req.params.id;
            const {status} = req.body;
            const query = {_id: new ObjectId(id)}
            const updateDoc ={
                $set:{ status: status }
            }
            const result = await bidsCollection.updateOne(query, updateDoc)
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