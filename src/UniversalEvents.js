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

    /**
     * Listen for an event. Alias for {@link UniversalEvents#on}
     *
     * @param {string} eventName - The name of the event to listen for
     * @param {function(data: Object)} handler - The function which is called when the event is raised
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    addEventListener(eventName, handler) {
        if (this._validEvents && !this._validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }

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
     * Remove a listener for an event. Be careful when doing this, you should only really remove listeners that were added by you.
     *
     * @param {string} eventName - The name of the event the handler was attached to
     * @param {function(data: Object)} handler - The function to remove
     * @return {UniversalEvents} - Returns the UniversalEvents object, allowing calls to be chained
     */
    removeEventListener(eventName, handler) {
        if (this._validEvents && !this._validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }

        var handlers = this._eventListeners[eventName];

        if (handlers) {
            var index = handlers.indexOf(handler);
            handlers.splice(index, 1);
        }

        return this;
    }

    /**
     * Raise an event. Causes all listeners of this event to run.
     * Alias of {@link UniversalEvents#emit}
     *
     * @param {string} eventName - The name of the event to raise
     * @param {?Object} [data] - An object passed to the handlers
     * @return {boolean} - A boolean representing whether the event had any handlers
     */
    raiseEvent(eventName, data) {
        if (this._validEvents && !this._validEvents.has(eventName)) {
            throw new Error('Unknown event name: ' + eventName)
        }

        var handlers = this._eventListeners[eventName];

        if (handlers) {
            for (var i = 0; i < handlers.length; i++) {
                // run the code right now, if the user wants it run on next tick that is up to them
                handlers[i].apply(this, [data]);
            }
            return true;
        }
        return false;
    }

    /**
     * Raise an event. Causes all listeners of this event to run.
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

        if (this._validEvents) {
            if (!this._validEvents.has(successEventName)) {
                throw new Error('Unknown event name: ' + successEventName)
            }
            if (!this._validEvents.has(failureEventName)) {
                throw new Error('Unknown event name: ' + failureEventName)
            }
            if (successEventName === failureEventName) {
                throw new Error('Identical event name for success and failure: ' + failureEventName)
            }
        }

        return new Promise(
            function(resolve, reject) {
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
}
