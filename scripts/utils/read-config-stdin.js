var merge = require('merge');
var stdin = process.openStdin();
var labels = {
    host: 'Type opengate-ux host (v8.opengate.es):',
    port: 'Type web port (80):',
    domain: "Type your domain:",
    user: "Type your user name:",
    password: "Type your password:"
}

var labels_setAction = {
    workspace: 'Type opengate-ux workspace identifier:',
    actionName: 'Type the action name:',
    widgetName: "Type the widget name:"
}

module.exports.basic = function(cb) {
    var keys = Object.keys(labels).reverse();
    readNextKey(keys, labels, {}, cb);
};

module.exports.all = function(cb) {
    var _labels = merge(labels_setAction, labels);
    var keys = Object.keys(_labels).reverse();
    readNextKey(keys, _labels, {}, cb);
};

function readNextKey(keys, labels, config, cb) {
    var key = keys.pop();
    if (key === "password") {
        hidden(labels[key], function(password) {
            valueTyped(password);
        });
    } else {
        console.log(labels[key]);
        stdin.addListener("data", function(d) {
            // note:  d is an object, and when converted to a string it will
            // end with a linefeed.  so we (rather crudely) account for that  
            // with toString() and then trim() 
            valueTyped(d.toString().trim());
        });
    }

    function valueTyped(value) {
        stdin.removeAllListeners('data');
        config[key] = value;
        if (keys.length > 0) {
            readNextKey(keys, labels, config, cb);
        } else {
            process.stdin.unref();
            cb(config);
        }
    }
}



function hidden(query, callback) {
    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length + 1).join("*"));
                break;
        }
    });
    rl.question(query, function(value) {
        rl.history = rl.history.slice(1);
        callback(value);
    });
}