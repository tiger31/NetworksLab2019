const net = require('net');
const User = require('./src/User');
const TestPoll = require('./src/TestsPoll');
TestPoll();

const server = net.createServer(User.handler);

server.listen(3000, '10.215.5.41');