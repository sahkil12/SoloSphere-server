const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ObjectId } = require('mongodb');
// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
// mongodb connection
const verifyToken = (req, res, next) => {
    const token = req.cookies.token
    if (!token) return res.status(401).send({ message: 'Unauthorized access' })
    if (token) {
        jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            req.user = decoded
            next()
        })
    }
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gr8kgxz.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);


async function run() {
    try {
        const jobsCollection = client.db('SoloSphere').collection('jobs')
        // jwt token 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_TOKEN, {
                expiresIn: '30d'
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })

            res.send({ success: true })
        })
        // clear token
        app.get('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 0
            })

            res.send({ success: true })
        })

        // job post 
        app.post('/job', async (req, res) => {
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
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })
        // get all jobs post a specific user 
        app.get('/jobs/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.params.email;
            if (tokenEmail !== email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const token = req.cookies.token
            const query = { 'buyer.email': email }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })
        // delete job from db 
        app.delete('/job/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })
        // update my jobs data 
        app.put('/job/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const jobData = req.body
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...jobData
                }
            }
            const result = await jobsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        // save bid data api 
        app.post('/bid', async (req, res) => {
            const bidData = req.body
            const result = await bidsCollection.insertOne(bidData)
            res.send(result)
        })
        // get bids data 
        app.get('/myBids/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.params.email
            if (tokenEmail !== email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })
        // get bids requests from db for job owner
        app.get('/bid-requests/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.params.email
            if (tokenEmail !== email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { buyer_email: email }
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })
        // update bids status 
        app.patch('/bidUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { status: status }
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