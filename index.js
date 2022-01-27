const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ObjectId } = require('mongodb');
const uuid = require('uuid').v4;
const Stripe = require('stripe');
const stripe = Stripe(process.env.secret_Ket);
// const stripe = require('stripe')(process.env.secret_Ket)


const app = express();
app.use(cors());
// app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q0pfb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const reviewCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_CONNECT}`);
  const bookingCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_CONNECTED}`);
  const serviceCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_CONNECTED1}`);
  const adminCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_CONNECTED2}`);
  
  // Add Admin 
  app.post('/addAdmin', (req, res) => {
    const adminEmail = req.body;
    adminCollection.insertOne(adminEmail)
    .then(result => {
      res.send(result.acknowledged === true)
    })
  })

  // Add Course booking
  app.post('/addBooking', (req, res) => {
    const bookingCourse = req.body;
    console.log(bookingCourse);
    bookingCollection.insertOne(bookingCourse)
    .then(result=>{
      res.send(result.acknowledged === true );
    })
  });
  
  // Admin Add Service
  app.post('/addService', (req, res) => {
    const addService = req.body;
    serviceCollection.insertOne(addService)
    .then(result=>{
      res.send(result.acknowledged === true);
    })
  });

  // User Add Review
  app.post('/addReview', (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review)
    .then(result =>{
           res.send(result.acknowledged === true)
    })
});

  // Admin Update Status
  app.patch('/update/:id', (req, res) => {
    const status = req.body.status;
    const id = req.params.id;
    bookingCollection.findOne({_id: ObjectId(id)})
    .then(result=> {
        if(result){
          const courseData = {
            title: result.courseInfo.title,
            status: status,
            description: result.courseInfo.description,
            img:result.courseInfo.img,
            price: result.courseInfo.price,
          }
          bookingCollection.updateOne({_id: ObjectId(id)},{
              $set: {courseInfo: courseData}
            },{upsert:true})
            .then(result=> {
              res.send(result.acknowledged === true)
            })
        }
      })
  });

  app.get('/allService', (req, res) => {
    serviceCollection.find({})
    .toArray((err , documents)=>{
      res.send(documents);
    })
  });

  // Load Booking Course Filtering by Email
  app.get('/booking', (req, res)=>{
    const book = req.query.email;
    bookingCollection.find({email : book})
    .toArray((err , documents) =>{
        res.send(documents);
    })
});

// Load Admin Email
app.post('/admin', (req, res)=>{
  const email = req.body.email;
  adminCollection.find({email: email})
  .toArray((err , admin)=>{
    res.send(admin.length > 0);
  })
})


// Load All Booking Service For Admin Panel
app.get('/allBooking', (req, res) => {
  bookingCollection.find({})
  .toArray((err , documents)=>{
    res.send(documents);
  })
})

// Load All Added Reviews
  app.get('/allReviews', (req, res)=>{
          reviewCollection.find({})
          .toArray((err, documents) =>{
              res.send(documents);
          })
  })

});


app.get('/', (req, res) => {
  res.send('Hello World!')
});

// stripe payment section
app.post('/checkout', async (req, res) => {
  console.log("request", req.body);

  let error;
  let status;
  try{
    const {token, course} = req.body;
    const customer = await stripe.customers.create({
            email: token.email,
            source: token.id,
    });

    const idempotency_key = uuid();
    const charge = await stripe.charges.create({
      amount: course.price * 100,
      currency: "usd",
      customer: customer.id,
      receipt_email: token.email,
      description: `Purchased the ${course.title}`,
      shipping:{
        name: token.card.name,
        address: {
          line1 : token.card.address_line1,
          line2 : token.card.address_line2,
          city: token.card.address_city,
          country: token.card.address_country,
          postal_code: token.card.address_zip
        }
      }
    }, 
    {
      idempotency_key,
    }
    );
    console.log("Charge :", charge);
    status = "success";
  }catch(error){
    console.log("error", error)
    status = "failure"
  }
  res.json({error, status});
})

app.listen(port);