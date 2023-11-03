// This js file will set up and manage the users connections

const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;
const io = require("socket.io")(httpServer, {
  cors: {
//     origin: 'https://chatgoku.onrender.com/',
    origin: '*',
    methods: ["GET", "POST"],
//     methods: " ",
  }
});

//



app.use(bodyParser.urlencoded({extended: false}));
// app.use(express.static(path.join(__dirname,'./public')));


app.use(express.static('public'));

app.get('/',(req,res)=>{
      res.sendFile(__dirname+'/index.html');
});
// hi
    

// const io = require("socket.io")(3000);
// const cors = require("cors");

const port=process.env.port || 5000;

httpServer.listen(port,()=>{
      console.log("server running boss!!");
});
const usersIo = {};

//login retrive

app.post('/register', async (req, res) => {
      try{
          let foundUser = users.find((data) => req.body.email === data.email);
          if (!foundUser) {
      
              let hashPassword = await bcrypt.hash(req.body.password, 10);
      
              let newUser = {
                  id: Date.now(),
                  username: req.body.username,
                  email: req.body.email,
                  password: hashPassword,
              };
              users.push(newUser);
              console.log('User list', users);
      
              res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./registration.html'>Register another user</a></div>");
          } else {
              res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./registration.html'>Register again</a></div>");
          }
      } catch{
          res.send("Internal server error");
      }
  });

  app.post('/login', async (req, res) => {
      try{
          let foundUser = users.find((data) => req.body.email === data.email);
          if (foundUser) {
      
              let submittedPass = req.body.password; 
              let storedPass = foundUser.password; 
      
              const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
              if (passwordMatch) {
                  let usrname = foundUser.username;
                  res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);
              } else {
                  res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
              }
          }
          else {
      
              let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
              await bcrypt.compare(req.body.password, fakePass);
      
              res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
          }
      } catch{
          res.send("Internal server error");
      }
  });

// Allow requests from all origins/particular origins

io.on("connection",socket=>{           // This is instance of socket.io. This listens the connection of different users that want's to connect,
                                       // ex- Goku wants to connect/send, Rohit, Arjun want's to conenct 
      socket.on("new-user-joined",name3=>{  // user-joined is a event. socket.on handles what to do  with the particular user which is connected to socket.io server.
            console.log("NewUserJoined ",name3);
            usersIo[socket.id]=name3;
            socket.broadcast.emit("user-joined",name3);
           
      });
      socket.on("send",message=>{ // send is particular event if happens and message is the call back fucntion 
            socket.broadcast.emit('recieve',{message:message,name3:usersIo[socket.id]})
      });

      socket.on("disconnect",doThis=>{ // to inform all client when users lefts the chat
            socket.broadcast.emit("left",users[socket.id]);
            delete users[socket.id];
      });

})
