import 'dotenv/config';
import connectDB from './db/index.js';  
import app from './app.js';

const port = process.env.PORT || 8001;  

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to the database", err);
  });


  