import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res)=>{
    res.send("Hello world!");
})

app.get('/buy-coffee', (req, res)=>{
    res.send("Thanks for buying the coffee!");
})

app.listen(port, ()=>{
    console.log(`Server is Listening to Port: ${port}`)
})