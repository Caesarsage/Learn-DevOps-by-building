# Azure MEAN WEB STACK

- M - MongoDB
- E - Express
- A - AngularJS
- N - Node

# Documentation

This project shows how to create a MEAN stack application using Azure. This is a similar approach to [Project 3: MERN STACK](../project-03/README.md/) where we used REACT instead of Angular.

# Creating the Azure VM

Again we will be using Ubuntu Virtual Machine through AZURE.

![Ubuntu VM](./images/vm.png)

After creating the VM, Login and we will be using the following commands to update the VM

```bash
sudo apt update -y
sudo apt upgrade -y
```

# Installing MongoDB

MongoDB is a document-oriented NoSQL database used for high volume data storage. Instead of using tables and rows as in the traditional relational databases, MongoDB makes use of collections and documents. Documents consist of key-value pairs which are the basic unit of data in MongoDB. Collections contain sets of documents and function which is the equivalent of relational database tables. MongoDB is a cross-platform, document-oriented database that provides, high performance, high availability, and easy scalability.


```bash
sudo apt install mongodb -y
```

![MongoDB](./images/mongodb.png)

- To login to MongoDB, run the following command:

```bash
mongo
```

- To see the databases, run the following command:

```bash
show dbs
```

![MongoDB](./images/showDB.png)

Exit from MongoDB

```bash
exit
```

# Installing NodeJS

Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside of a web browser. Node.js lets developers use JavaScript to write command line tools and for server-side scripting—running scripts server-side to produce dynamic web page content before the page is sent to the user's web browser.

```bash
sudo apt install nodejs -y
```

**Note:** The command installs both Node.js and npm, the Node.js package manager. npm is used to install Node.js programs from the registry, organizing the installation and management of third-party Node.js programs.

Lets's verify the version

```bash
  node -v
```

Also verify the version of npm

```bash
  npm -v
```

![Node and Npm Version](./images/version.png)

**Note**: you must install version 14.17.0 or higher else run the following

```bash
npm install -g n
sudo n stable

```
![Node and Npm Version](./images/versions.png)

# Application Setup and Installing Express

Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It is an open-source framework developed and maintained by the Node.js foundation.

- First lets create a directory for our application

```bash
  mkdir myapp
```

- Then change directory to myapp

```bash
  cd myapp
```

- Then we will be creating a package.json file

```bash
  npm init -y
```

![Package.json](./images/package-json.png)

- Then we will be installing express

```bash
  npm install express
```

![Express](./images/express.png)

- Now that our application is setup, we will be creating a file called `index.js` to run our application

```bash
  touch index.js
```

- Then we will be adding the following code to our `index.js` file

- open the file with `vim` or `nano`

```js
  const express = require('express')
  const app = express()
  const port = 3000

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
```

- Then we will be running our application

```bash
  node index.js
```

![Express App](./images/express-app.png)

- To allow traffic on port 3000 from our vm we will be adding an inbound rule to our network security group.

- On your Azure Portal, go to your VM and click on `Networking` and then `Add inbound port rule`

![Inbound Rule](./images/inbound.png)

- Then we will be running our application again

```bash
  node index.js
```
Open your browser and go to `http://<your-ip-address>:3000`

![Express App](./images/web-express-app.png)
# Improving and Defining routes for our application

- Let's improve our basic application to a `Todo` application. We will create a new folder called `routes` and create a file called `index.js`.

```bash
  mkdir routes
  touch routes/index.js
```

- Then we will be adding the following code to our `index.js` file

```js
  const express = require('express')
  const router = express.Router()

  router.get('/', (req, res) => {
    res.send('Hello World!')
  })

  module.exports = router
```

- Then we will be adding the following code to our `index.js` file

```js
  const express = require('express')
  const app = express()
  const port = 3000

  const indexRouter = require('./routes/index')

  app.use('/', indexRouter)

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
```

# Adding MongoDB to our application and creating models

- First we will be installing mongoose in our application

Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment. Mongoose supports both promises and callbacks.

It will allow us to connect to our MongoDB database and define models for our application.

```bash
  npm install mongoose
  npm install cors
```
- cors is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.

- Then we will be creating a folder called `models` and create a file called `todo.js`

```bash
  mkdir models
  touch models/todo.js
```

- Then we will be adding the following code to our `todo.js` file

```js
  const mongoose = require('mongoose')

  const todoSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    author: {
      type: String,
      required: true
    }
  })

  module.exports = mongoose.model('Todo', todoSchema)
```

- Then we will be adding the following code to our `index.js` file

```js
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors')
  const path = require('path');
  require('dotenv').config();

  const app = express();

  const port = 3000

  //connect to the database
  mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Database connected successfully`))
  .catch(err => console.log(err));

  //since mongoose promise is depreciated, we overide it with node's promise
  mongoose.Promise = global.Promise;

  app.use(express.json())
  app.use(cors())

  const indexRouter = require('./routes/index')

  app.use('/', indexRouter)

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
```

Here, we are using MongoDB on our local machine. You will need to be using MongoDB Atlas in our production environment.

**Note**: You will need to create a database called `todo` in your MongoDB instance by
  
```bash
  mongo
  use todo
```

# Adding controllers to our application

- First we will be creating a folder called `controllers` and create a file called `todos.js` to perform CRUD operations on our `Todo` model

```bash
  mkdir controllers
  touch controllers/todos.js
```

- Then we will be adding the following code to our `todos.js` file

```js
  const Todo = require('../models/todo')

  const getAllTodos = async (req, res) => {
    try {
      const todos = await Todo.find()
      res.json(todos)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }

  const getTodo = async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id)
      res.json(todo)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }

  const createTodo = async (req, res) => {
    try {
      const todo = new Todo({
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        author: req.body.author
      })

      const newTodo = await todo.save()

      res.status(201).json(newTodo)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  const updateTodo = async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id)

      if (req.body.title) {
        todo.title = req.body.title
      }

      if (req.body.description) {
        todo.description = req.body.description
      }

      if (req.body.status) {
        todo.status = req.body.status
      }

      if (req.body.author) {
        todo.author = req.body.author
      }

      const updatedTodo = await todo.save()

      res.json(updatedTodo)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

 const deleteTodo = async (req, res) => {
  try {
    const deletedTodo = await Todo.findOneAndDelete({ _id: req.params.id });

    if (!deletedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(deletedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


  module.exports = {
    getAllTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo
  }
```

Now let's update our `index.js` in the route folder to use the controller functions

```js
  const express = require('express')
  const router = express.Router()

  const {
    getAllTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo
  } = require('../controllers/todos')

  router.get('/todos', getAllTodos)

  router.get('/todos/:id', getTodo)

  router.post('/todos', createTodo)

  router.put('/todos/:id', updateTodo)

  router.delete('/todos/:id', deleteTodo)

  module.exports = router
```

Start your server and test the endpoints using Postman
![Server Running with DB](./images/db-success.png)

## Create
![PosT Request](./images/postman-post.png)

## Get

![Get Request](./images/postman-get.png)
---

## Delete

![Delete Request](./images/postman-delete.png)

You can explore the other endpoints using Postman.
Now we are done with this basic application server.


# AngularJS for Frontend

AngularJS provides a web framework for creating dynamic views in your web applications. In this tutorial, we use AngularJS to connect our web page with Express and perform actions on our book register.

Next, is to create a front end ui for our application. We will be using React for this.

- First we will be creating a folder called `client` and initialize a react application in it

```bash
  mkdir client
  cd client
```

Add a file named script.js

```bash
vi script.js
```


Copy and paste the Code below (controller configuration defined) into the script.js file.

```jsx
var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
  $http( {
    method: 'GET',
    url: '/todos'
  }).then(function successCallback(response) {
    $scope.todos = response.data;
  }, function errorCallback(response) {
    console.log('Error: ' + response);
  });
  $scope.del_todo = function(todo) {
    $http( {
      method: 'DELETE',
      url: '/todos/:id',
      params: {'id': todo.id}
    }).then(function successCallback(response) {
      console.log(response);
    }, function errorCallback(response) {
      console.log('Error: ' + response);
    });
  };
  $scope.add_todos = function() {
    var body = '{ "name": "' + $scope.title + 
    '", "description": "' + $scope.discription +
    '", "author": "' + $scope.author + 
    '", "status": "' + $scope.status + '" }';
    $http({
      method: 'POST',
      url: '/todos',
      data: body
    }).then(function successCallback(response) {
      console.log(response);
    }, function errorCallback(response) {
      console.log('Error: ' + response);
    });
  };
});
```
Save and exit with `:wq`

In public folder, create a file named index.html;

```bash
vi index.html
```

Cpoy and paste the code below into index.html file.

```html
<!doctype html>
<html ng-app="myApp" ng-controller="myCtrl">
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
    <script src="script.js"></script>
  </head>
  <body>
    <div>
      <table>
        <tr>
          <td>Name:</td>
          <td><input type="text" ng-model="name"></td>
        </tr>
        <tr>
          <td>description:</td>
          <td><input type="text" ng-model="description"></td>
        </tr>
        <tr>
          <td>Author:</td>
          <td><input type="text" ng-model="author"></td>
        </tr>
        <tr>
          <td>Status:</td>
          <td><input type="number" ng-model="status"></td>
        </tr>
      </table>
      <button ng-click="add_todos()">Add</button>
    </div>
    <hr>
    <div>
      <table>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Author</th>
          <th>Status</th>

        </tr>
        <tr ng-repeat="todo in todos">
          <td>{{todo.name}}</td>
          <td>{{todo.description}}</td>
          <td>{{todo.author}}</td>
          <td>{{todo.status}}</td>

          <td><input type="button" value="Delete" data-ng-click="del_todo(todo)"></td>
        </tr>
      </table>
    </div>
  </body>
</html>
```

Change the directory back up to s

```bash
  cd ..
```

Start the server by running this command:

**`node index.js`**

- The server is now up and running, we can connect it via port 3300. You can launch a separate SSH console to test what curl command returns locally.

- Assuming no errors when saving all these files, our To-Do app should be ready and fully functional with the functionality discussed earlier: creating a task, deleting a task and viewing all your tasks.


[Project 5: IMPLEMENT A CLIENT SERVER AERCHITECTURE USING MYSQL DATABASE MANAGEMENT SYSTEM](../project-05/README.md)
