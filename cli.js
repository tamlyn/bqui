#!/usr/bin/env node

const Redis = require('ioredis');
const Table = require('cli-table');

const redis = new Redis();

redis.keys(key('*', 'id'))
		.then(res => {
			const queues = res.map(key => key.split(':')[1]);
			return Promise.all(queues.map(getQueueStats));
		})
		.then(queueStats => {

			var table = new Table({
				chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
			});

			table.push(['Queue name', 'Waiting', 'Active', 'Succeeded', 'Failed', 'Stalling']);
			queueStats.forEach(stats => table.push(stats));

			process.stdout.write(table.toString() + '\n');

      return redis.quit();
		});


function getQueueStats(name) {
	return Promise
		.all([
			name,
			redis.llen(key(name, 'waiting')),
			redis.llen(key(name, 'active')),
			redis.scard(key(name, 'succeeded')),
			redis.scard(key(name, 'failed')),
			redis.scard(key(name, 'stalling'))
		])
}

function key(queueName, propName) {
	return `bq:${queueName}:${propName}`;
}
