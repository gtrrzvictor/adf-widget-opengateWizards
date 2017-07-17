var session = require('./utils/session-id'),
    registerWidget = require('./utils/registerWidget'),
    reader = require('./utils/read-config-stdin');

reader.readConfiguration(function(config) {
    session.getSessionId(config, function(sessionId) {
        registerWidget.delete(config, sessionId);
    });
});