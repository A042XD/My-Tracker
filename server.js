const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 3000;

const dataFilePath = path.join(__dirname, 'todos.json');
async function readTodos(){
    try{
        const data = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error){
        return {
            todos: [],
            nextId: 0
        };
    }
}
async function writeTodos(data){
    await fs.writeFile(dataFilePath, JSON.stringify(data));
}

app.use(express.json());
app.get('/todos/', async (req, res) => {
    res.json(await readTodos());
});
app.get('/todos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let {todos, nextId} = await readTodos();
    const todo = todos.find(t => t.id == id);
    if (todo){
        res.json(todo);
    }
    else{
        res.status(404).json({
            message: 'todo not found.'
        });
    }
});
app.post('/todos', async (req, res) => {
    const {title, completed=false} = req.body;
    if (!title){
        res.status(400).json({
            message: 'Title is required.'
        });
    }
    let {todos, nextId} = await readTodos();
    const newTodo = {
        id: ++nextId,
        title,
        completed
    };
    todos.push(newTodo);
    await writeTodos({todos, nextId});
    res.status(201).json(newTodo);
});
app.delete('/todos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let {todos, nextId} = await readTodos();
    const index = todos.findIndex(t => t.id == id);
    if (index != -1){
        todos.splice(index, 1);
        await writeTodos({todos, nextId});
        res.status(204).send();
    }
    else{
        res.status(404).json({
            message: 'todo not found.'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at https://localhost:${port}`);
});