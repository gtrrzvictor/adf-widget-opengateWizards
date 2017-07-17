var http = require('http');

module.exports.getSessionId = function(config, cb) {
    var post_req = http.request({
            host: config.host,
            port: config.port,
            path: '/api/auth/signin',
            json: true,
            headers: {
                "content-type": "application/json"
            },
            method: 'POST'
        },
        function(res) {
            var cookies = res.headers["set-cookie"];
            var sessionId, cookieMap;
            cookies.forEach(function(cookie) {
                cookieMap = cookie.split("=");
                if (cookieMap[0] === "sessionId") {
                    cb(cookie);
                }
            });
        });

    post_req.write(JSON.stringify({ "username": config.user, "password": config.password }));
    post_req.end();
}