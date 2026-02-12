const express = require("express");//importing express framework
const http = require("http");//importing node js http module
const { Server } = require("socket.io");//importing server class from socket.io

const app = express();//creating an express app
const server = http.createServer(app);//creating an http server using an express app
const io = new Server(server, {
  cors: { origin: "*" } //allows request from any front end
});//creating a socket.io server and enabling cors
let tasks = []//in memory array to store task
io.on("connection", (socket) => {//listen when a client connects in a socket
  console.log("A user connected");

  socket.emit("sync:tasks", tasks)//sends current task to nrewly connected client
  socket.on("task:create", (task) => {//listen for task creation from client
    if (!task || !task.id || !task.column) {
      return //stop execution if task data is invalid
    }
    tasks.push(task)//add new task to tha task array
    console.log("all tasks", tasks)
    io.emit("sync:tasks", tasks)//broadcast the updated task to all connected client
  })
  socket.on("task:update", (updateTask) => {//update the matching task using map
    tasks = tasks.map((task) => {
      return task.id === updateTask.id ? updateTask : task
    })//replace task if id matched otherwise keeps the old tadk
    io.emit("sync:tasks", tasks)
  })
  socket.on("task:move", ({ id, column }) => {//listen for task movenent event
    tasks = tasks.map((task) => { //skip if the task did not matched
      if (!task) return task
      else {

        return task.id === id ? { ...task, column } : task//update task column 
      }
    })
    io.emit("sync:tasks", tasks)
  })
  socket.on("task:delete", (id) => {//listen for user task deletion
    tasks = tasks.filter((task) => task.id !== id)//keeps att the other tasks than the matched item
    io.emit("sync:tasks", tasks)
  })


  socket.on("disconnect", () => {//listen when user disconnects
    console.log("User disconnected");
  });
});
app.get("/", (req, res) => {//this message will be shown on the following port if the server is running correctly
  res.send("server is running")
})
const port = 4000
server.listen(port, "0.0.0.0", () => console.log(`http://localhost:${port}`));//starts server on the provided port
