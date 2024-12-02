const Gree = require('gree-hvac-client');

module.exports = function (RED) {
    /**
     * @param config
     */
    function GreeHvacNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const device = RED.nodes.getNode(config.device);

        node.status({});

        const pollingInterval = config.interval * 1000;
        let client = new Gree.Client({
            host: device.host,
            pollingInterval: pollingInterval,
            pollingTimeout: pollingInterval / 2,
            debug: config.debug,
        });

        const statusConnected = () => {
            node.status({
                fill: 'green',
                shape: 'dot',
                text: 'connected to ' + client.getDeviceId(),
            });
        };
        const statusConnecting = () =>
            node.status({
                fill: 'yellow',
                shape: 'dot',
                text: 'connecting...',
            });
        const statusNoResponse = () =>
            node.status({
                fill: 'yellow',
                shape: 'dot',
                text: 'no response...',
            });
        const statusError = error =>
            node.status({ fill: 'red', shape: 'dot', text: error });

        const onError = error => {
            if (config.debug) {
                console.dir(error);
            }

            node.error(error);
            statusError(error);
        };

        client.on('connect', statusConnected);
        client.on('update', (updatedProperties, properties) => {
            statusConnected();
            node.send([
                {
                    topic: 'updated',
                    payload: updatedProperties,
                },
                {
                    topic: 'properties',
                    payload: properties,
                },
            ]);
        });
        client.on('success', (updatedProperties, properties) => {
            statusConnected();
            node.send([
                {
                    topic: 'acknowledged',
                    payload: updatedProperties,
                },
                {
                    topic: 'properties',
                    payload: properties,
                },
            ]);
        });
        client.on('disconnect', statusConnecting);
        client.on('no_response', statusNoResponse);
        client.on('error', onError);

        this.on('input', function (msg) {
            if (typeof msg.payload === 'object') {
                client.setProperties(msg.payload).catch(onError);
            } else {
                client.setProperty(msg.topic, msg.payload).catch(onError);
            }
        });

        this.on('close', function () {
            client.disconnect().catch(onError);
            client = null;
        });

        statusConnecting();
    }

    RED.nodes.registerType('gree-hvac', GreeHvacNode);
};
