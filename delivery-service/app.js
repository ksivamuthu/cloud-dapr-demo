const express = require('express');
const axios = require('axios').default;
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }));

const daprPort = process.env.DAPR_HTTP_PORT || 3500;
const messageUrl = `http://localhost:${daprPort}/v1.0/publish`;

app.get('/healthz', (req, res) => {
    res.send({ app: 'delivery-service', status: 'healthy' });
});

app.get('/dapr/subscribe', (req, res) => {
    console.log(req.body);
    res.json([
        {
            pubsubname: 'messagebus',
            topic: 'ReadyToPickup',
            route: '/ready-to-pickup'
        }
    ]);
});

app.post('/ready-to-pickup', (req, res) => {
    startDelivery(req.body.data);
    res.status(200).end();
});

async function startDelivery(order) {
    await delay(5);
    await publishDeliveryOnWay(order);
    await delay(5);
    await publishDelivered(order);
}

function publishDeliveryOnWay(order) {
    return axios.post(`${messageUrl}/DeliveryOnWay`, order)
        .then(() => console.log('DeliveryOnWay published'))
        .catch(err => console.error(err));
}

function publishDelivered(order) {
    axios.post(`${messageUrl}/Delivered`, order)
        .then(() => console.log('delivered published'))
        .catch(err => console.error(err));
}

async function delay(seconds) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), seconds * 1000);
    });
}

app.listen(3002, () => console.log('Delivery service started successfully'));