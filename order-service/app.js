const express = require('express');
const axios = require('axios').default;
const { v4: guid } = require('uuid');
const bodyParser = require('body-parser')
const cors = require('cors');

const app = express()
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }));

const daprPort = process.env.DAPR_HTTP_PORT || 3500;
const stateStore = 'statestore';
const stateUrl = `http://localhost:${daprPort}/v1.0/state/${stateStore}`;
const messageUrl = `http://localhost:${daprPort}/v1.0/publish`;
const notificationUrl = `http://localhost:${daprPort}/v1.0/bindings/notification`

app.get('/healthz', (req, res) => {
    res.send({ app: 'order-service', status: 'healthy' });
});

app.post('/order', (req, res) => {
    const id = guid();
    const order = { key: id, value: req.body };
    axios.post(`${stateUrl}`, [order])
        .then(() => publishOrderReceived(order))
        .then(() => res.send({ id }))
        .catch(err => res.status(500).send({ message: err }));
});

app.get('/order/:id', (req, res) => {
    const key = req.params.id;
    axios.get(`${stateUrl}/${key}`)
        .then(r => r.data)
        .then((r) => res.send(r))
        .catch(err => res.status(500).send({ message: err }));
});

function publishOrderReceived(order) {
    axios.post(`${messageUrl}/OrderReceived`, order)
        .then(() => console.log('order-received published'))
        .catch(err => console.error(err));
}

app.get('/dapr/subscribe', (_req, res) => {
    res.json([
        {
            topic: 'OrderReceived',
            route: 'order-status/OrderReceived'
        },
        {
            topic: 'Processing',
            route: 'order-status/Processing'
        },
        {
            topic: 'ReadyToPickup',
            route: 'order-status/ReadyToPickup'
        },
        {
            topic: 'DeliveryOnWay',
            route: 'order-status/DeliveryOnWay'
        },
        {
            topic: 'Delivered',
            route: 'order-status/Delivered'
        }
    ]);
});

app.post('/order-status/:status', async (req, res) => {
    const key = req.body.data['key'];
    console.log(`Order ${key} Status: ${req.params.status}`);

    sendNotification(orderId, status);

    saveOrderStatus(key, req.params.status)
        .then(() => res.status(200).end())
        .catch(err => res.status(500).send({ message: err }));
});

function sendNotification(orderId, status) {
    console.log('Send notification');
    axios.post(notificationUrl, {
        data: `The order ${orderId} is ${status}`,
        metadata: { toNumber: "412-209-5786" }
    }).then(() => console.log('success'))
        .catch((e) => console.error(e));
}

async function saveOrderStatus(orderId, status) {
    const order = await getOrder(orderId);
    if (order) {
        const orderToSave = { key: orderId, value: { ...order, status } };
        return axios.post(`${stateUrl}`, [orderToSave])
            .then((r) => r.data)
            .catch(err => console.error(err));
    }
}

function getOrder(orderId) {
    return axios.get(`${stateUrl}/${orderId}`)
        .then(r => r.data)
        .catch(err => console.error(err));
}

app.listen(3000, () => console.log('Order service started successfully'));