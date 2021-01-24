import { isPresent, typeOf } from '@ember/utils';
import { later } from '@ember/runloop';
import { isNone } from '@ember/utils';
import { Promise as EmberPromise, reject } from 'rsvp';

let retry = function (fncToRetry, delayArg, conditionFnc) {
  let r = {
    retryIt: function (maxRetries = 5, retries) {
      if (retries >= maxRetries) {
        return r.asPromise(r.fncToRetry);
      } else {
        return r.retryLater(maxRetries, retries);
      }
    },

    fncToRetry: null,
    conditionFnc: null,
    delayFnc: null,
    delay: 500,

    exponentialDelayFnc: function (retries) {
      return Math.pow(2, retries) * r.delay;
    },

    retryLater: function (maxRetries, retries) {
      return r.asPromise(r.fncToRetry).catch((error) => {
        if (r.conditionFnc(error)) {
          // If conditionFunc allows the retry then retry, otherwise reject
          // e.g. In case of a 401 and the person doesn't want to retry
          return r.delayedRetry(maxRetries, retries);
        } else {
          throw error;
        }
      });
    },

    // Function that retries in case of failure
    delayedRetry: function (maxRetries, retries) {
      return new EmberPromise((resolve) => {
        later(
          () => resolve(r.retryIt(maxRetries, retries + 1)),
          r.delayFnc(retries)
        );
      });
    },

    isPromise: function (obj) {
      return isPresent(obj) && typeOf(obj.then) === 'function';
    },

    asPromise: function (fnc) {
      return new EmberPromise((resolve, reject) => {
        try {
          let returnVal = fnc(resolve, reject);
          if (r.isPromise(returnVal)) {
            // handle promise returned
            returnVal.then(resolve, reject);
          } else if (!isNone(returnVal)) {
            // handle scalar value returned
            resolve(returnVal);
          }
          // handle no value returned, will be handle by resolve, reject being called in fnc
        } catch (error) {
          reject(error);
        }
      });
    },

    setDelayArg: function (delayArg) {
      r.delayFnc = r.exponentialDelayFnc;
      if (typeOf(delayArg) === 'number') {
        r.delay = delayArg;
      } else if (typeOf(delayArg) === 'function') {
        r.delayFnc = delayArg;
      }
    },
  };
  r.fncToRetry = fncToRetry;
  r.conditionFnc = conditionFnc;
  r.setDelayArg(delayArg);
  return r;
};

export default function (
  fnc,
  maxRetries = 5,
  delayArg,
  conditionFnc = () => true
) {
  if (fnc === null || fnc === undefined || typeOf(fnc) !== 'function') {
    return reject('Function required');
  } else {
    return retry(fnc, delayArg, conditionFnc).retryIt(maxRetries, 0);
  }
}
