import { isPresent, typeOf } from '@ember/utils';
import { later } from '@ember/runloop';
import { isNone } from '@ember/utils';
import { Promise as EmberPromise, reject } from 'rsvp';

let retry = function (timerArg){

  let r = {
    retryIt: function(fnc, maxRetries=5, retries){
      if(retries >= maxRetries){
        return r.asPromise(fnc);
      } else {
        return r.retryLater(fnc, maxRetries, retries);
      }
    },

    delayFnc: null,
    delay: 500,

    exponentialDelayFnc: function(retries){
      return Math.pow(2, retries) * r.delay;
    },

    retryLater: function(fnc, maxRetries, retries){
      return new EmberPromise((resolve, reject)=>{
        r.asPromise(fnc).then((result)=>{
          resolve(result);
        }).catch(()=>{
          later(()=>{
            r.retryIt(fnc, maxRetries, retries+1).then((result)=>{
              resolve(result);
            }, (error)=> {
              reject(error);
            });
          }, r.delayFnc(retries));
        });
      });
    },

    isPromise: function(obj){
      return isPresent(obj) && typeOf(obj.then) === 'function';
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

    setTimerArg: function(timerArg){
      r.delayFnc = r.exponentialDelayFnc;
      if(typeOf(timerArg) === 'number'){
        r.delay = timerArg;
      }else if(typeOf(timerArg) === 'function'){
        r.delayFnc = timerArg;
      }
    }
  }
  r.setTimerArg(timerArg);
  return r;
}

export default function(fnc, maxRetries=5, timerArg) {
  if(fnc === null || fnc === undefined || typeOf(fnc) !== 'function'){
    return reject('Function required');
  } else {
    return retry(timerArg).retryIt(fnc, maxRetries, 0);
  }
}
