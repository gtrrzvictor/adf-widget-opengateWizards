var stdin = process.openStdin();
var labels = {
    host: 'Type opengate-ux host (v8.opengate.es):',
    port: 'Type web port (80):',
    domain: "Type your domain:",
    user: "Type your user name:",
    password: "Type your password:"
}

module.exports.readConfiguration = function(cb) {
    var keys = Object.keys(labels).reverse();
    readNextKey(keys, labels, {}, cb);
};

function readNextKey(keys, labels, config, cb) {
    var key = keys.pop();
    console.log(labels[key]);
    stdin.addListener("data", function(d) {
        // note:  d is an object, and when converted to a string it will
        // end with a linefeed.  so we (rather crudely) account for that  
        // with toString() and then trim() 
        stdin.removeAllListeners('data');
        config[key] = d.toString().trim();
        if (keys.length > 0) {
            readNextKey(keys, labels, config, cb);
        } else {
            process.stdin.unref();
            cb(config);
        }
    });
}