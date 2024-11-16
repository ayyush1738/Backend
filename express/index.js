import express from 'express';

const app = express();
const port = 3000;
app.use(express.json());

let coffeeData = [];
let nextId = 1;

app.post('/coffee', (req, res) => {
    const { name, price } = req.body;
    const newCoffee = { id: nextId++, name, price };
    coffeeData.push(newCoffee);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(newCoffee); // This sets the response status and sends the data in JSON format
});

app.get('/coffee', (req, res) => {
    res.status(200).json(coffeeData);
});

app.get('/coffee/:id', (req, res) => {
    const coffee = coffeeData.find(t => t.id === parseInt(req.params.id));
    if (!coffee) {
        return res.status(404).send("Coffee not found!");
    }
    res.status(200).json(coffee);
});

app.put('/coffee/:id', (req, res)=>{
    const coffee = coffeeData.find(t => t.id === parseInt(req.params.id));
    if(!coffee)
    {
        return res.status(404).send("coffee not there");
    }
    const {name, price} = req.body;
    coffee.name = name;
    coffee.price = price;
    res.status(200).json(coffee);
})

app.delete('/coffee/:id', (req, res)=>{
    const index = coffeeData.findIndex(t=> t.id === parseInt(req.params.id));
    if(index==-1)
    {
        return res.status(404).send('Coffee not there in the list!');
    }
    coffeeData.splice(index, 1);
    res.status(204).send("Deleted!");
})

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
