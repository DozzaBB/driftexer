import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server);
import { dbHandler } from './parts/database.js';
import { doSingleDriftex } from './parts/playwright.js';
import { getToday } from './parts/utils.js';

app.use(express.static("dist"));

app.get('/latest', (req, res) => {
  const runs = dbHandler.getAllRuns();
  let latest;
  if (runs.length > 1) {
    latest = runs.sort((r1, r2) => Number.parseInt(r2.date) - Number.parseInt(r1.date))[0];
  } else {
    latest = runs[0];
  }
  res.json(latest);
})


io.on('connection', (socket) => {
  socket.on('customDriftex', (prompt) => {
    console.log("Got prompt to do single driftex:")
    console.log(prompt);
    doSingleDriftex(prompt).then((pair) => {
      console.log("Finished custom prompt")
      // Check if there are any runs today.
      const today = getToday();
      const completedRun = dbHandler.getEnsureRun(today);
      completedRun.pairs.push(pair);
      dbHandler.saveDB();
      io.sockets.serverSideEmit('refreshAllclients');
    });

  });
  socket.on('refreshAll', () => {
    console.log('Someone requested all clients to refresh.');
    io.emit('refreshAllClients')
  })
  console.log('a user connected');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

// start the damn ML loop.
import { mlLoop } from './parts/mlscraper.js';
mlLoop();