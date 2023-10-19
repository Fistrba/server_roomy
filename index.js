const express = require('express');
const { delay } = require('framer-motion');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// Umožnění komunikace pouze z určitého původního zdroje
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3001',
  },
});

const PORT = process.env.PORT || 3001;

const rooms = {};
const infos = {};
const messages = {};

const admin = {};
const banUsers = {}
const settings = {};

io.on('connection', (socket) => {

  socket.emit("getId", {id: socket.id});

    socket.on('joinRoom', (data) => {
      const { room, name, id } = data;
      console.log("Client connected", id)
      socket.join(room); // Pridanie klienta do skupiny s názvom room


      
      
      
      if (!rooms[room]) {
        rooms[room] = [];
      }
      
      if (!settings[room]) {
        settings[room] =
          {
            delay: 5,
            sendImages: true
          }
      }
      if (!infos[room]) {
        infos[room] = [];
      }
      if (!messages[room]) {
        messages[room] = [];
      }
      if(!banUsers[room]) {
        banUsers[room] = [];
      }

      
      rooms[room].push({id: id, name: name});

      socket.on('sendMessage', ({ message, type, file }) => {
        const messageData = {id: id, name: name, type: type, message: message,  date: new Date().valueOf(), file: file};
        messages[room].push(messageData);
        console.log(messages[room])
        io.to(room).emit('messageList', messages[room]);
      });

      socket.on("changeSettigns", ({delay, sendImages}) => {
        settings[room] = {
          delay: delay,
          sendImages: sendImages
        }
        console.log(settings[room])
        messages[room].push({id: id, name: name, type: "info", message: name + " change settigns of group",  date: new Date().valueOf()});
        io.to(room).emit('messageList', messages[room]);
        io.to(room).emit("getSettings", settings[room])
      })


  
      messages[room].push({id: id, name: name, type: "info", message: name + " joined to the room",  date: new Date().valueOf()});
    
      
     
      if(!admin[room]) {
        admin[room] = []
        admin[room].push({id: id, name: name, type: "admin"})
       
      }

      if (admin[room].length === 0) {
        admin[room].push({id: id, name: name, type: "admin"})
      }

      socket.on("banUser", id => {
        banUsers[room].push({id});
        io.to(room).emit("getBanUsers", banUsers[room])
      })

      socket.on("unbanUser", id => {
        banUsers[room] = banUsers[room].filter(user => user.id !== id);
        io.to(room).emit("getBanUsers", banUsers[room])
      }) 

          io.to(room).emit('userList', rooms[room]);
          io.to(room).emit("infoList", infos[room]);
          io.to(room).emit('messageList', messages[room]);
          io.to(room).emit("admin", admin[room])
          io.to(room).emit("getSettings", settings[room])
          io.to(room).emit("getBanUsers", banUsers[room])

          
          socket.on("disconnect", () =>{
          

              rooms[room] = rooms[room].filter(user => user.id !== id)
              admin[room] = admin[room].filter(user => user.id !== id)

              messages[room].push({id: id, name: name, type: "info", message: name + " left the room",  date: new Date().valueOf()})
            
            io.to(room).emit('userList', rooms[room]);
            io.to(room).emit("infoList", infos[room]);
            io.to(room).emit('messageList', messages[room]);
            io.to(room).emit("admin", admin[room])

            if (rooms[room].length === 0) {
                messages[room] = [];
                infos[room] = [];
                settings[room] = {
                  delay: 5, 
                  sendImages: true
                }
                admin[room] = null
                console.log(admin[room])
            }
           

            


          })

         

      });
    
});



server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
