const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');


const app = express();
app.use(cors());
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
  app.post('/addCourse', (req, res) => {
    const bookingCourse = req.body;
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


  // app.put('/update', async(req, res) => {
  //   const status = req.body.status;
  //   const filter = {courseInfo : {status:status}}
  //   const updateDoc = {
  //     $set: {
  //       courseInfo : {status:status}
  //     },
  //   }; 
  //   const result = await bookingCollection.updateOne(filter, updateDoc);
  //   console.log(result);
  // })


// Load All Course Service
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
})

app.listen(port);