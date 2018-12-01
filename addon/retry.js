import { isPresent, typeOf } from '@ember/utils';
import { later } from '@ember/runloop';
import { isNone } from '@ember/utils';
import { Promise as EmberPromise, reject } from 'rsvp';

let retry = function (delayArg){

  let r = {
    retryIt: function(fnc, maxRetries=5, retries, conditionFunc){
      if(retries >= maxRetries){
        return r.asPromise(fnc);
      } else {
        return r.retryLater(fnc, maxRetries, retries, conditionFunc);
      }
    },

    delayFnc: null,
    delay: 500,

    exponentialDelayFnc: function(retries){
      return Math.pow(2, retries) * r.delay;
    },

    retryLater: function(fnc, maxRetries, retries, conditionFunc){
      return new EmberPromise((resolve, reject)=>{
        r.asPromise(fnc).then((result)=>{
          resolve(result);
        }).catch((error)=>{
          if (r.isFunc(conditionFunc)) {
            if (conditionFunc(error)) {
              // If conditionFunc allows the retry then retry, otherwise reject
              // e.g. In case of a 401 and the person doesn't want to retry
              r.delayedRetry(fnc, maxRetries, retries, conditionFunc, resolve, reject)
            } else {
              reject(error);
            }
          } else {
            // If the conditionFunc isn't passed, it will by default go here
            r.delayedRetry(fnc, maxRetries, retries, conditionFunc, resolve, reject)
          }
        });
      });
    },

    // Function that retries in case of failure
    delayedRetry: function(fnc, maxRetries, retries, conditionFunc, resolve, reject) {
      later(()=>{
        r.retryIt(fnc, maxRetries, retries + 1, conditionFunc).then((result)=>{
          resolve(result);
        }, (error)=> {
          reject(error);
        });
      }, r.delayFnc(retries));
    },

    isPromise: function(obj){
      return isPresent(obj) && r.isFunc(obj.then);
    },

    isFunc: function(obj){
      return isPresent(obj) && typeOf(obj) === 'function';
    },

    asPromise: function(fnc){
      return new EmberPromise((resolve, reject)=>{
        try {
          let returnVal = fnc(resolve, reject);
          if(r.isPromise(returnVal)){ // handle promise returned
            returnVal.then((result)=> resolve(result), (error)=> reject(error));
          }
          else if (!isNone(returnVal)) { // handle scalar value returned
            resolve(returnVal);
          }
          // handle no value returned, will be handle by resolve, reject being called in fnc
        } catch(error) {
          reject(error);
        }
      });
    },

    setDelayArg: function(delayArg){
      r.delayFnc = r.exponentialDelayFnc;
      if(typeOf(delayArg) === 'number'){
        r.delay = delayArg;
      }else if(typeOf(delayArg) === 'function'){
        r.delayFnc = delayArg;
      }
    }
  }
  r.setDelayArg(delayArg);
  return r;
}

export default function(fnc, maxRetries=5, delayArg, conditionFunc) {
  if(fnc === null || fnc === undefined || typeOf(fnc) !== 'function'){
    return reject('Function required');
  } else {
    return retry(delayArg).retryIt(fnc, maxRetries, 0, conditionFunc);
  }
}
