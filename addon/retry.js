import Ember from 'ember';

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
      return new Ember.RSVP.Promise((resolve, reject)=>{
        r.asPromise(fnc).then((result)=>{
          resolve(result);
        }).catch(()=>{
          Ember.run.later(()=>{
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
      return Ember.isPresent(obj) && Ember.typeOf(obj.then) === 'function';
    },

    asPromise: function(fnc){
      return new Ember.RSVP.Promise((resolve, reject)=>{ 
        try {
          let returnVal = fnc(resolve, reject);
          if(r.isPromise(returnVal)){ //handle promise returned
            returnVal.then((result)=> resolve(result), (error)=> reject(error));
          }
          else {
            resolve(returnVal);
          }
        } catch(error) {
          reject(error);
        }
      });
    },

    setTimerArg: function(timerArg){
      r.delayFnc = r.exponentialDelayFnc;
      if(Ember.typeOf(timerArg) === 'number'){
        r.delay = timerArg;
      }else if(Ember.typeOf(timerArg) === 'function'){
        r.delayFnc = timerArg;
      }
    }
  }
  r.setTimerArg(timerArg);
  return r;
}

export default function(fnc, maxRetries=5, timerArg) {
  if(fnc === null || fnc === undefined || Ember.typeOf(fnc) !== 'function'){
    return Ember.RSVP.reject('Function required');
  } else {
    return retry(timerArg).retryIt(fnc, maxRetries, 0);
  }
}
