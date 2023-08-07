'use strict';

const threads = require('node:worker_threads');
const path = require('node:path');

const createQuery = (cmd, ...args) => JSON.stringify({ cmd, args });

const watcherPath = path.join(__dirname, 'watcher.js');

const boot = (args) => {
  const worker = new threads.Worker(watcherPath);
  const startQuery = createQuery('start', process.cwd(), ...args.slice(2));
  worker.postMessage(startQuery);
  worker.on('error', (err) => {
    throw err;
  });
  worker.on('exit', () => boot(args));
  worker.on('message', (data) => {
    const { cmd } = JSON.parse(data);
    let query = undefined;
    if (cmd === 'close') query = createQuery('close', 0);
    if (query) worker.postMessage(query);
  });
};

module.exports = boot;
