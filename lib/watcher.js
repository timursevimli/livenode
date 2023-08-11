'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parentPort } = require('node:worker_threads');

const sendToMaster = (cmd) => {
  parentPort.postMessage(JSON.stringify({ cmd }));
};

const watch = (file) => {
  const watcher = fs.watch(file);
  watcher.on('error', (err) => {
    throw err;
  });
  watcher.on('close', () => void watch(file));
  watcher.on('change', (eventType) => {
    if (eventType === 'change') sendToMaster('close');
    if (eventType === 'rename') watcher.close();
  });
};

const watchHandler = (dir) => {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) throw err;
        stats.isFile() ? watch(filePath) : watchHandler(filePath);
      });
    }
  });
};

const messageHandler = (data) => {
  const { cmd, args } = JSON.parse(data);
  const { commands } = messageHandler;
  const command = commands[cmd];
  if (command) command(args);
};

const commands = {
  start(args) {
    const [dir, file, showLog = true] = args;
    if (showLog) console.log('livenode is listening!', 'PID:' + process.pid);
    const main = path.join(dir, file);
    require(main);
    watchHandler(dir);
  },
  close(args) {
    const [code] = args;
    process.exit(code);
  },
};

messageHandler.commands = commands;

parentPort.on('message', messageHandler);
