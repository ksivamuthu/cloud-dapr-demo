const express = require('express');
const axios = require('axios').default;
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }));

const daprPort = process.env.DAPR_HTTP_PORT || 3500;
const messageUrl = `http://localhost:${daprPort}/v1.0/publish`;

app.get('/healthz', (req, res) => {
    res.send({ app: 'kitchen-service', status: 'healthy' });
});

app.get('/dapr/subscribe', (req, res) => {
    res.json([
        {
            topic: 'OrderReceived',
            route: '/receive-order'
        }
    ]);
});

app.post('/receive-order', (req, res) => {
    console.log(req.body);
    startProcessing(req.body.data);
    res.status(200).end();
});

async function startProcessing(order) {
    await delay(5);
    await publishProcessing(order);
    await delay(5);
    await publishReadyToPickup(order);
}

function publishProcessing(order) {
    return axios.post(`${messageUrl}/Processing`, order)
        .then(() => console.log('processing published'))
        .catch(err => console.error(err));
}

function publishReadyToPickup(order) {
    axios.post(`${messageUrl}/ReadyToPickup`, order)
        .then(() => console.log('ready to pickup published'))
        .catch(err => console.error(err));
}

async function delay(seconds) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), seconds * 1000);
    });
}

app.listen(3001, () => console.log('Kitchen service started successfully'));