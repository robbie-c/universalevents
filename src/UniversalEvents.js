'use strict';

/**
 * UniversalEvents is a class for managing events
 *
 * Each event has a name, which is a string, which allows one UniversalEvents object to receive and coordinate multiple types of event.
 *
 * There are 2 methods for listening for an event.
 * The first is to attach a handler function with {@link UniversalEvents#on}.
 * The second is to await an event with {@link UniversalEvents#await} which returns a `Promise`.
 *
 * Events can then be raised with `emit`, optionally with arbitrary data which is passed to those listening for that event.
 */
export default class UniversalEvents {

    /**
     * Create a UniversalEvents object
     *
     * @param {?(Set<string>|Array<string>)} [validEvents] - The set of events which this object should handle.
     * If undefined, null, or empty, this object will handle all events.
     */
    constructor(validEvents) {
        if (!validEvents) {
            this._validEvents = null;
        } else if (typeof validEvents === 'string') {
            throw new Error('Use of a string is probably a typo, should be Set or Array, or other iterable');
        } else {
            this._validEvents = new Set(validEvents);
        }

        this._eventListeners = {};
    }

    _checkEventName(eventName) {
        if (!eventName) {
            throw new Error('Event name unspecified');
        }
        if (typeof eventName !== 'string') {
            throw new Error('Event name must be string: ' + eventName);
        }
        if (this._validEvents && !this._validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }
    }

    _getListenersForEvent(eventName) {
        return this._eventListeners[eventName] || [];
    }

    /**
     * Listen for an event. Alias for {@link UniversalEvents#on}
     *
     * @param {string} eventName - The name of the event to listen for
     * @param {function(data: Object)} handler - The function which is called when the event is raised
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    addEventListener(eventName, handler) {
        this._checkEventName(eventName);

        if (!this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [];
        }

        this._eventListeners[eventName].push(handler);

        return this;
    }

    /**
     * Listen for an event. Alias for {@link UniversalEvents#addEventListener}
     *
     * @param {string} eventName - The name of the event to listen for
     * @param {function(data: Object)} handler - The function which is called when the event is raised
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    on(eventName, handler) {
        return this.addEventListener(eventName, handler);
    }

    /**
     * Listen for an event. Remove listener after the first time it happens.
     *
     * @param {string} eventName - The name of the event to listen for
     * @param {function(data: Object)} handler - The function which is called when the event is raised
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    once(eventName, handler) {
        this._checkEventName(eventName);

        var self = this;

        function innerHandler(data) {
            self.removeEventListener(eventName, innerHandler);

            return handler(data);
        }

        return this.addEventListener(eventName, innerHandler);
    }

    /**
     * Remove a listener for an event. Be careful when doing this, you should only really remove listeners that were added by you.
     *
     * @param {string} eventName - The name of the event the handler was attached to
     * @param {function(data: Object)} handler - The function to remove
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    removeEventListener(eventName, handler) {
        this._checkEventName(eventName);

        var handlers = this._eventListeners[eventName];

        if (handlers) {
            var index = handlers.indexOf(handler);
            handlers.splice(index, 1);
        }

        return this;
    }

    /**
     * Raise an event. Causes all listeners of this event to run. Handlers are run before this function returns.
     *
     * Alias of {@link UniversalEvents#emit}
     *
     * @param {string} eventName - The name of the event to raise
     * @param {?Object} [data] - An object passed to the handlers
     * @return {boolean} - A boolean representing whether the event had any handlers
     */
    raiseEvent(eventName, data) {
        this._checkEventName(eventName);

        var handlers = this._eventListeners[eventName];

        if (handlers && handlers.length > 0) {

            // create a local copy of the handlers array
            // this protects us against handlers that modify the handlers
            // (e.g. remove themself)
            handlers = handlers.slice();

            for (var i = 0; i < handlers.length; i++) {
                // run the code right now, if the user wants it run on next tick that is up to them
                handlers[i].apply(this, [data]);
            }
            return true;
        }
        return false;
    }

    /**
     * Raise an event. Causes all listeners of this event to run. Handlers are run before this function returns.
     * Alias of {@link UniversalEvents#raiseEvent}
     *
     * @param {string} eventName - The name of the event to raise
     * @param {?Object} [data] - An object passed to the handlers
     * @return {boolean} - A boolean representing whether the event had any handlers
     */
    emit(eventName, data) {
        return this.raiseEvent(eventName, data);
    }

    /**
     * Await an event for success and another event for failure.
     *
     * @param {string} successEventName - The name of the event which will resolve the promise when raised
     * @param {string} failureEventName - The name of the event which will reject the promise when raised
     * @return {Promise} - A promise which will be resolved on success and rejected on failure
     */
    await(successEventName, failureEventName) {
        var self = this;

        this._checkEventName(successEventName);
        this._checkEventName(failureEventName);
        if (successEventName === failureEventName) {
            throw new Error('Identical event name for success and failure: ' + failureEventName)
        }

        return new Promise(
            function (resolve, reject) {
                function successHandler(val) {
                    self.removeEventListener(successEventName, successHandler);
                    self.removeEventListener(failureEventName, failureHandler);

                    resolve(val);
                }

                function failureHandler(err) {
                    self.removeEventListener(successEventName, successHandler);
                    self.removeEventListener(failureEventName, failureHandler);

                    reject(err);
                }

                self.addEventListener(successEventName, successHandler);
                self.addEventListener(failureEventName, failureHandler);
            });
    }

    /**
     * Listen for a success event and failure event. Uses a node-like callback. Remove listeners after the callback is called
     *
     * @param {string} successEventName - The name of the success event to listen for
     * @param {string} failureEventName - The name of the failure event to listen for
     * @param {function(err: Error, data: Object)} callback - The node-like callback function which is called when either event is raised
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    cbOnce(successEventName, failureEventName, callback) {
        var self = this;

        this._checkEventName(successEventName);
        this._checkEventName(failureEventName);
        if (successEventName === failureEventName) {
            throw new Error('Identical event name for success and failure: ' + failureEventName)
        }

        function successHandler(val) {
            self.removeEventListener(successEventName, successHandler);
            self.removeEventListener(failureEventName, failureHandler);

            callback(null, val);
        }

        function failureHandler(err) {
            self.removeEventListener(successEventName, successHandler);
            self.removeEventListener(failureEventName, failureHandler);

            callback(err, undefined);
        }

        self.addEventListener(successEventName, successHandler);
        self.addEventListener(failureEventName, failureHandler);

        return this;
    }
}
