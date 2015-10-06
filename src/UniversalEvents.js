'use strict';

var Q = require('q');

var shimSetImmediate;
if (typeof setImmediate === 'function') {
    shimSetImmediate = function (f) {
        return setImmediate(f);
    }
} else if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
    shimSetImmediate = process.nextTick
} else {
    shimSetImmediate = function(f) {
        return setTimeout(f, 0);
    }
}

export default class UniversalEvents {

    constructor(validEvents) {
        if (!validEvents) {
            this.validEvents = null;
        } else if (typeof validEvents === 'string') {
            throw new Error('Use of a string is probably a typo, should be Set or Array, or other iterable');
        } else {
            this.validEvents = new Set(validEvents);
        }

        this._eventListeners = {};
    }

    addEventListener(eventName, handler) {
        if (this.validEvents && !this.validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }

        if (!this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [];
        }

        this._eventListeners[eventName].push(handler);

        return this;
    }

    on(eventName, handler) {
        return this.addEventListener(eventName, handler);
    }

    removeEventListener(eventName, handler) {
        if (this.validEvents && !this.validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }

        var handlers = this._eventListeners[eventName];

        if (handlers) {
            var index = handlers.indexOf(handler);
            handlers.splice(index, 1);
        }

        return this;
    }

    raiseEvent(eventName, data) {
        if (this.validEvents && !this.validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }

        var handlers = this._eventListeners[eventName];

        if (handlers) {
            for (var i = 0; i < handlers.length; i++) {
                var handler = handlers[i];

                var runHandler = function (boundHandler, boundData) {
                    boundHandler.apply(this, [boundData]);
                }.bind(undefined, handler, data);

                shimSetImmediate(runHandler);
            }
            return true;
        }
        return false;
    }

    emit(eventName, data) {
        return this.raiseEvent(eventName, data);
    }

    await(successEventName, failureEventName) {
        var self = this;

        if (this.validEvents) {
            if (!this.validEvents.has(successEventName)) {
                throw new Error('Unknown event name: ' + successEventName)
            }
            if (!this.validEvents.has(failureEventName)) {
                throw new Error('Unknown event name: ' + failureEventName)
            }
            if (successEventName === failureEventName) {
                throw new Error('Identical event name for success and failure: ' + failureEventName)
            }
        }

        var defer = Q.defer();

        function successHandler(val) {
            self.removeEventListener(successEventName, successHandler);
            self.removeEventListener(failureEventName, failureHandler);

            defer.resolve(val);
        }

        function failureHandler(err) {
            self.removeEventListener(successEventName, successHandler);
            self.removeEventListener(failureEventName, failureHandler);

            defer.reject(err);
        }

        this.addEventListener(successEventName, successHandler);
        this.addEventListener(failureEventName, failureHandler);

        return defer.promise;
    }
}
