![CI](https://github.com/mrloop/ember-retry/workflows/CI/badge.svg)

ember-retry
==============================================================================

[Ember](https://ember-cli.com) addon for exponetial backoff retries of a function.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-prismic-dom
```


Usage
------------------------------------------------------------------------------

```javascript
import retry from 'ember-retry/retry'

retry((resolve, reject) => { //retry
  let ws = new WebSocket('ws://myflakyhost.com');
  ws.onopen = () => resolve(ws);
  ws.onerror = (error) => reject(error);
}).then((websocket) => {
  //do something with websocket
});

retry(() => {
  return this.store.find('user', 353232); //retry if promise fails with error
}).then((user) => {
  //do something with user
});
```

By default will retry 5 times after 0.5s, 1s, 2s, 4s, 8s.
The number of retries, initial delay before retries and the function used to calculate retry delay can all be configured.

```javascript
retry(() => {
  return this.store.find('user', 353232);
}, 3, 1000) //retry 3 times at 1000ms, 2000ms, 4000ms
```

```javascript
retry(() => {
  return this.store.find('user', 353232);
}, 5, (retryIndex) => { return retryIndex+1*40; }); //retry 5 times at 40ms, 80ms, 120ms, 160ms, 200ms
```

Will retry if return value `isNone`

```javascript
retry(() => {
  if (Math.random() > 0.5) {
    return 'What am I trying to do?';
  }
}).then((str) => {
  // str is 'What am I trying to do?' if successful;
})
```

Can pass an anonymous function to retry conditionally
In this case if the response.status is not 401
```javascript
retry(() => {
  return this.store.find('user', 353232);
}, 5, 1000, (response) => { return (response.status !== 401) });
```


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


Alternatives
------------------------------------------------------------------------------


_Why don't you use existing alternative instead e.g. ember-backoff?_

I wanted a cleaner way to retry a function where a promise wasn't returned.

* [ember-backoff](https://github.com/GavinJoyce/ember-backoff)
* [ember-concurrency](https://github.com/machty/ember-concurrency) like [this](http://blog.mrloop.com/javascript/ember/2016/04/12/retrying-functions-with-ember-concurrency.html)
