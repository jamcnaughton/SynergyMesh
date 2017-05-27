define(["require", "exports"], function (require, exports) {
    "use strict";
    requirejs.config({
        paths: {
            'chosen': 'lib/scripts/chosen.jquery/chosen.jquery-1.6.2',
            'd3': 'lib/scripts/d3/d3-3.5.17',
            'jquery': 'lib/scripts/jquery/jquery-2.2.0',
            'socket.io-client': 'lib/scripts/socket.io/socket.io-client-1.4.4'
        },
        shim: {
            jquery: {
                exports: '$',
            },
        },
    });
    function start(callback) {
        require(['jquery', 'd3', 'socket.io-client'], function () {
            require(['chosen'], function () {
                callback();
            });
        });
    }
    exports.start = start;
});
//# sourceMappingURL=bootstrap.js.map