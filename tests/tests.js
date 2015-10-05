'use strict';
require('babel/register');

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
            new UniversalEvents(new Set('event1', 'event2'));
        });
    });

    describe('#addEventListener', function () {
        it('should allow known events', function () {
            var el = new UniversalEvents(['eventName']);
            el.addEventListener('eventName', function () {
            });
        });
        it('should reject unknown events', function () {
            var el = new UniversalEvents(['eventName']);
            expect(function () {
                el.addEventListener('invalidEventName', function () {
                });
            }).to.throwError();
        });
        it('should allow any event when not given any event names in the ctor', function () {
            var el = new UniversalEvents();
            el.addEventListener('invalidEventName', function () {
            });
        });
    });

    describe('#raiseEvent', function () {
        it('should allow known events when there is no handler', function () {
            var el = new UniversalEvents(['eventName']);
            el.raiseEvent('eventName');
        });

        it('should allow known events when there is a handler', function (done) {
            var el = new UniversalEvents(['eventName']);
            var data = {a: 1};
            el.addEventListener('eventName', function (eventData) {
                expect(eventData).to.be(data);
                done();
            });
            el.raiseEvent('eventName', data);
        });

        it('should allow known events when there are multiple handlers and call all of them', function (done) {
            var doneFirst = false;
            var doneSecond = false;
            var data = {a: 1};

            var el = new UniversalEvents(['eventName']);

            el.addEventListener('eventName', function (eventData) {
                expect(eventData).to.be(data);

                doneFirst = true;

                if (doneFirst && doneSecond) {
                    done();
                }
            });

            el.addEventListener('eventName', function (eventData) {
                expect(eventData).to.be(data);

                doneSecond = true;

                if (doneFirst && doneSecond) {
                    done();
                }
            });

            el.raiseEvent('eventName', data);
        });

        it('should not call handlers for other events', function () {
            var el = new UniversalEvents(['eventName', 'otherEventName']);
            el.addEventListener('otherEventName', function () {
                throw new Error();
            });
            el.raiseEvent('eventName');
        });

        it('should reject unknown events', function () {
            var el = new UniversalEvents(['eventName']);
            expect(function () {
                el.raiseEvent('invalidEventName');
            }).to.throwError();
        });

        it('should allow any event when not given any event names in the ctor', function () {
            var el = new UniversalEvents();
            var data = {a: 1};
            el.addEventListener('eventName', function (eventData) {
                expect(eventData).to.be(data);
                done();
            });
            el.raiseEvent('eventName', data);
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

            el.raiseEvent('eventNameSuccess', data);
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

            el.raiseEvent('eventNameFailure', error);
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
    });
});
