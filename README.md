# Universal Events
Event emitter for node and browser, based on EventEmitter but with extra features

See documentation at https://doc.esdoc.org/github.com/robbie-c/universalevents/

# Usage Example

```JavaScript
import UniversalEvents from 'UniversalEvents';
var ue = new UniversalEvents();

// attach a function that is called when the matching event happens
ue.on('myEventName', function (data) {
    console.log('The data is: ' + data);
});
ue.raiseEvent('myEventName', 3); // logs "The data is: 3"
ue.raiseEvent('myEventName', 'hello') // logs "The data is: hello"

// create a Promise that is resolved on success and rejected on failure
ue.await('successEventName', 'failureEventName')
    .then(function (data) {
        console.log('Succeeded with: ' + data);
    })
ue.raiseEvent('successEventName', 5); // logs "Succeeded with: 5"
ue.await('successEventName', 'failureEventName')
    .catch(function (err) {
        console.log('Failed with: ' + err);
    });
ue.raiseEvent('failureEventName', new Error("fail")); // logs "Failed with: Error: fail"
```
