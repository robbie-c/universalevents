'use strict';

var expect = require('expect.js');

var UniversalEvents = require('..');

describe('UniversalEvents', function () {

    describe('#constructor', function () {
        it('should work without arguments', function () {
            new UniversalEvents();
        });
        it('should with an array', function () {
            new UniversalEvents(['event1', 'event2']);
        });
        it('should take a set', function () {
            new UniversalEvents(new Set(['event1', 'event2']));
        });
    });

    describe('#on', function () {
        it('should allow known events', function () {
            var el = new UniversalEvents(['eventName']);
            el.on('eventName', function () {
            });
        });
        it('should reject unknown events', function () {
            var el = new UniversalEvents(['eventName']);
            expect(function () {
                el.on('invalidEventName', function () {
                });
            }).to.throwError();
        });
        it('should allow any event when not given any event names in the ctor', function () {
            var el = new UniversalEvents();
            el.on('invalidEventName', function () {
            });
        });
    });

    describe('#once', function () {
        it('should only be called once', function () {
            var el = new UniversalEvents(['eventName']);

            var alreadyCalled = false;
            var data = {a: 1};

            el.once('eventName', function (eventData) {
                expect(eventData).to.be(data);
                expect(alreadyCalled).to.be(false);
                alreadyCalled = true;
            });

            expect(el.emit('eventName', data)).to.be(true);
            expect(el.emit('eventName', data)).to.be(false);
        });
    });

    describe('#raiseEvent', function () {
        it('should allow known events when there is no handler', function () {
            var el = new UniversalEvents(['eventName']);
            expect(el.emit('eventName')).to.be(false);
        });

        it('should allow known events when there is a handler', function (done) {
            var el = new UniversalEvents(['eventName']);
            var data = {a: 1};
            el.on('eventName', function (eventData) {
                expect(eventData).to.be(data);
                done();
            });
            expect(el.emit('eventName', data)).to.be(true);
        });

        it('should allow known events when there are multiple handlers and call all of them', function (done) {
            var doneFirst = false;
            var doneSecond = false;
            var data = {a: 1};

            var el = new UniversalEvents(['eventName']);

            el.on('eventName', function (eventData) {
                expect(eventData).to.be(data);

                doneFirst = true;

                if (doneFirst && doneSecond) {
                    done();
                }
            }).on('eventName', function (eventData) {
                expect(eventData).to.be(data);

                doneSecond = true;

                if (doneFirst && doneSecond) {
                    done();
                }
            });

            el.emit('eventName', data);
        });

        it('should not call handlers for other events', function () {
            var el = new UniversalEvents(['eventName', 'otherEventName']);
            el.on('otherEventName', function () {
                throw new Error();
            });
            el.emit('eventName');
        });

        it('should reject unknown events', function () {
            var el = new UniversalEvents(['eventName']);
            expect(function () {
                el.emit('invalidEventName');
            }).to.throwError();
        });

        it('should allow any event when not given any event names in the ctor', function (done) {
            var el = new UniversalEvents();
            var data = {a: 1};
            el.on('eventName', function (eventData) {
                expect(eventData).to.be(data);
                done();
            });
            el.emit('eventName', data);
        });
    });

    describe('#await', function () {
        it('should resolve the promise when the success event happens', function (done) {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);
            var data = {a: 1};

            el.await('eventNameSuccess', 'eventNameFailure')
                .then(function (eventData) {
                    expect(eventData).to.be(data);
                    done()
                })
                .catch(done);

            el.emit('eventNameSuccess', data);
        });

        it('should reject the promise when the failure event happens', function (done) {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);
            var error = new Error('Event Error');

            el.await('eventNameSuccess', 'eventNameFailure')
                .then(function () {
                    done(new Error('Should not have succeeded'));
                })
                .catch(function (eventError) {
                    expect(eventError).to.be(error);
                    done();
                })
                .catch(done);

            el.emit('eventNameFailure', error);
        });

        it('should fail if the success event name is invalid', function () {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);
            expect(function () {
                el.await('invalidEventName', 'eventNameFailure');
            }).to.throwError();
        });

        it('should fail if the failure event name is invalid', function () {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);
            expect(function () {
                el.await('eventNameSuccess', 'invalidEventName');
            }).to.throwError();
        });

        it('should fail if the success and failure event names are the same', function () {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);
            expect(function () {
                el.await('eventNameSuccess', 'eventNameSuccess');
            }).to.throwError();
        });

        it('should allow multiple promises for the same events', function (done) {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);

            var p1 = el.await('eventNameSuccess', 'eventNameFailure');
            var p2 = el.await('eventNameSuccess', 'eventNameFailure');

            Promise.all([p1, p2]).then(function () {
                console.log('done');
                done();
            });

            setImmediate(function () {
                el.raiseEvent('eventNameSuccess');
            })
        });
    });

    describe('#cbOnce', function () {
        it('should only be called once', function () {
            var el = new UniversalEvents(['eventNameSuccess', 'eventNameFailure']);

            var alreadyCalled = false;
            var data = {a: 1};

            el.cbOnce('eventNameSuccess', 'eventNameFailure', function (eventError, eventData) {
                expect(eventError).to.be(null);
                expect(eventData).to.be(data);
                expect(alreadyCalled).to.be(false);
                alreadyCalled = true;
            });

            expect(el.emit('eventNameSuccess', data)).to.be(true);
            expect(el.emit('eventNameSuccess', data)).to.be(false);
            expect(el.emit('eventNameFailure', data)).to.be(false);
        });
    });

    describe('#removeEventListener', function (done) {
        it('should only remove the one that was intended to be remove', function () {
            var el = new UniversalEvents();

            function f1() {
            }

            function f2() {
            }

            function f3() {
            }

            function f4() {
            }

            el.addEventListener('eventName', f1);
            el.addEventListener('eventName', f2);
            el.addEventListener('eventName', f3);
            el.addEventListener('eventName', f4);

            expect(el._getListenersForEvent('eventName').length).to.be(4);

            el.removeEventListener('eventName', f1);

            var listeners = el._getListenersForEvent('eventName');
            expect(listeners.length).to.be(3);
            expect(listeners.indexOf(f1)).to.be(-1);
            expect(listeners.indexOf(f2)).to.not.be(-1);
            expect(listeners.indexOf(f3)).to.not.be(-1);
            expect(listeners.indexOf(f4)).to.not.be(-1);

            el.removeEventListener('eventName', f3);

            listeners = el._getListenersForEvent('eventName');
            expect(listeners.length).to.be(2);
            expect(listeners.indexOf(f2)).to.not.be(-1);
            expect(listeners.indexOf(f3)).to.be(-1);
            expect(listeners.indexOf(f4)).to.not.be(-1);

            el.removeEventListener('eventName', f4);

            listeners = el._getListenersForEvent('eventName');
            expect(listeners.length).to.be(1);
            expect(listeners.indexOf(f2)).to.not.be(-1);
            expect(listeners.indexOf(f4)).to.be(-1);
        });
    });
});
