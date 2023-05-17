const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middlewar
app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5niozn3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// const verifyJwt = (req, res, next) => {
//     const authorization = req.headers.authorization
//     if (!authorization) {
//         return res.status(401).send({ error: true, message: 'Unauthorized Access!' })
//     }
//     const token = authorization.split(' ')[1]
//     console.log('Jwt tocken ', token);
//     jwt.verify(token, process.env.ACCESS_TOCKEN, (error, decoded) => {
//         if (error) {
//             return res.status(403).send({ error: true, message: 'Unauthorized Access!' })
//         }
//         req.decoded = decoded
//         next()
//     })

// }


const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' })
    }
    // verify the token

    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOCKEN, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: 'Unauthorized access' })
        }
        req.decoded = decoded

        console.log('Start decoding', decoded);
        next()
    })

}







async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // collections
        const servicesCollections = client.db('cardb').collection('service')

        const bookingCollections = client.db('cardb').collection('booking')

        // jwt

        app.post('/jwt', (req, res) => {
            const user = req.body
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOCKEN, {
                expiresIn: '1h'
            })
            res.send({ token })
        })


        // get all the services

        app.get('/services', async (req, res) => {
            const cursor = servicesCollections.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // get information of checkOut page by id

        app.get('/services/:id', async (req, res) => {

            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {

                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await servicesCollections.findOne(query, options)
            res.send(result)
        })

        // start booking
        app.post('/bookings', async (req, res) => {
            const orderFromClient = req.body
            console.log(orderFromClient);
            const result = await bookingCollections.insertOne(orderFromClient)
            res.send(result)
        })

        app.get('/bookings', verifyJwt, async (req, res) => {
            const decoded = req.decoded
            console.log(decoded);

            if (decoded.email !== req.query.email) {
                return res.status(401).send({ err: true, message: 'Unauthorized email' })
            }


            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }



            const result = await bookingCollections.find(query).toArray()
            res.send(result)
        })

        // delete booking

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollections.deleteOne(query)
            res.send(result)
        })

        // update Booking 

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const updatedBooking = req.body
            console.log(updatedBooking);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                }
            }
            const result = await bookingCollections.updateOne(filter, updateDoc)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Doc is Running .....')
})

app.listen(port)