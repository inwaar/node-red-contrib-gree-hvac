module.exports = function (RED) {
    /**
     * @param config
     */
    function GreeHvacConfigNode(config) {
        RED.nodes.createNode(this, config);

        this.host = config.host;
    }

    RED.nodes.registerType('gree-hvac-config', GreeHvacConfigNode, {});
};
