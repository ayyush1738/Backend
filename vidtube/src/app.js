import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose';
import healthcheckRouter from './routes/healthcheck.routes.js';

const app = express();
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({ extended:true , limit: "16kb"}))
app.use(express.static("public"))

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

const studentSchema = new mongoose.Schema({
    name: String,
    age: Number,
    gpa: Number
});
  
const studentModel = mongoose.model("students", studentSchema);

app.post("/newStudent", async (req, res) => {
  try{
    const {name, age, gpa} = req.body;

    const newStudent = new studentModel({
      name, 
      age,
      gpa
    });

    await newStudent.save();

    res.status(201).json({
      message: "Student created successfully"
    })
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});

// Endpoint to fetch students
app.get("/getStudents", async (req, res) => {
  try {
    const students = await studentModel.find();  // Await the result of the find() query
    res.json(students);  // Send the result as JSON
  } catch (err) {
    res.status(500).json({ error: err.message });  // Handle any errors that occur
  }
});


app.use("api/v1/healthcheck", healthcheckRouter);

export default app;