const Gree = require('gree-hvac-client');

module.exports = function (RED) {
    function GreeHvacNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const device = RED.nodes.getNode(config.device);

        node.status({});

        const pollingInterval = config.interval * 1000;
        let client = new Gree.Client({
            host: device.host,
            pollingInterval: pollingInterval,
            pollingTimeout: pollingInterval / 2
        });

        const statusConnected = () => {
            node.status({fill: 'green', shape: 'dot', text: 'connected to ' + client.getDeviceId()})
        };

        const statusConnecting = () => node.status({fill: 'yellow', shape: 'dot', text: 'connecting...'});
        const statusNoResponse = () => node.status({fill: 'yellow', shape: 'dot', text: 'no response...'});

        statusConnecting();

        client.on('connect', statusConnected);
        client.on('update', (updatedProperties, properties) => {
            statusConnected();
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
        client.on('disconnect', statusConnecting);
        client.on('no_response', statusNoResponse);

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
