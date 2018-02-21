import retry from 'dummy/retry';
import { module, test } from 'qunit';
import Ember from 'ember';

module('Unit | Utility | retry');

// Replace this with your real tests.
test('it works with function', function(assert) {
  let done = assert.async();
  retry((resolve)=> {
    resolve(7);
  }, 3, ()=>{ return 2;}).then((result)=>{
    assert.equal(result, 7);
    done();
  }).catch((error)=>{
    assert.ok(false, error);
    done();
  });
});

test('it work with function that throws', function(assert){
  let done = assert.async();
  retry(()=>{
    throw "I'm throwing";
  }, 3, 1).then((result)=>{
    assert.ok(false, result);
    done();
  }).catch((error)=>{
    assert.ok(true, error);
    done();
  });
});

test('it rejects when no function', function(assert) {
  let done = assert.async();
  retry(undefined, 5, ()=>{return 2;}).then((result)=>{
    assert.ok(false, result);
    done();
  }).catch((error)=>{
    assert.equal(error.trim(), 'Function required');
    done();
  });
});

test('it works with function returning a promise', function(assert) {
  let done = assert.async();
  retry(()=>{
    return Ember.RSVP.resolve('success');
  }).then((result)=>{
    assert.equal(result, 'success');
    done();
  }).catch((error)=>{
    assert.ok(false, error);
    done();
  });
});

test('it works with function returning a scalar', function(assert) {
  let done = assert.async();
  retry(() => {
    return 'success';
  }).then((result)=>{
    assert.equal(result, 'success');
    done();
  }).catch((error)=>{
    assert.ok(false, error);
    done();
  });
});

test('throws errors, rejects promise then eventually passes', function (assert) {
  assert.expect(4);
  let done = assert.async();
  let count = 0;
  retry((resolve, reject)=> {
    count = count + 1;
    if(count === 1){
      assert.ok(true);
      throw `count ${count}`;
    }else if(count === 2){
      assert.ok(true);
      throw `count ${count}`;
    }else if(count === 3){
      assert.ok(true);
      reject(`count ${count}`);
    }else if(count === 4){
      resolve('my return');
    }
  }, 5, ()=>{return 2;}).then((result)=>{
    assert.equal(result, 'my return');
    done();
  }).catch((error)=>{
    assert.ok(false, `with error: ${error}`);
    done();
  });
});

test('backoff delay count starts at 0 and increments by 1 until max', function(assert){
  assert.expect(6);
  let done = assert.async();
  let count = 0;
  retry(()=> {
    count = count + 1;
    throw `count ${count}`;
    }, 5, (retry)=>{
      assert.equal(retry, count-1);
      return 1;
    }
  ).then(()=>{
    assert.ok(false);
    done();
  }).catch(()=>{
    assert.ok(true);
    done();
  });

});
