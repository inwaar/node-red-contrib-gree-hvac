const Gree = require('gree-hvac-client');

module.exports = function (RED) {
    function GreeHvacNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const device = RED.nodes.getNode(config.device);

        node.status({});
        node.status({fill: 'yellow', shape: 'dot', text: 'connecting...'});

        let client = new Gree.Client({
            host: device.host,
            pollingInterval: config.interval * 1000
        });
        client.on('connect', () => {
            node.status({fill: 'green', shape: 'dot', text: 'connected to ' + client.getDeviceId()});
        });
        client.on('update', (updatedProperties, properties) => {
            node.send([{
                topic: 'updated',
                payload: updatedProperties
            }, {
                topic: 'properties',
                payload: properties
            }]);
        });
        client.on('success', (updatedProperties, properties) => {
            node.send([{
                topic: 'acknowledged',
                payload: updatedProperties
            }, {
                topic: 'properties',
                payload: properties
            }]);
        });
        client.on('error', (message) => {
            node.status({fill: 'red', shape: 'dot', text: message});
        });

        this.on('input', function (msg) {
            client.setProperty(msg.topic, msg.payload);
        });

        this.on('close', function () {
            client.disconnect();
            client = null;
        });
    }

    RED.nodes.registerType('gree-hvac', GreeHvacNode);
};
