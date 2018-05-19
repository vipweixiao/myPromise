# myPromise
简易Promise实现

### 核心原理

为了方便描述说明，给三种promise起个名字

- 最开始的定义的promise，我们称呼为`promiseSource`
- 原型上的then方法，执行结果是promise，我们称呼为`promiseThen`
- then方法传入的函数A，函数A的执行结果可能为promise，我们称呼此为`promiseRetVal`


1. 每一个then返回一个promiseThen，并且把promiseThen的resolve放入前一个promise的callbacks中，此时构成了链式执行的then链，每个promise的callbacks数组中只有一个值；
2. 当then链执行过程中，发现then中传入函数的执行结果为promise时，即promiseRetVal存在时，只要把当前promiseThen的resolve放入promiseRetVal的callbacks中，即达到把promiseRetVal插入此then链中效果；
3. resolve(data)函数执行的时候，把传入的data放在promise实例的this.value上，之后的then函数执行，从this.value取值传入then函数；


### 方法说明

##### `resolvePromise`

- 方法是真正的执行promise的resolve和reject方法的地方，并且会判断then函数的返回值是否为promise，如果是则插入到then链中。

```
/**
 * 解析then传入函数的执行结果retVal
 * promise2: then自身执行返回的promise
 * retVal：then中函数执行的结果
 * resolve：then自身执行返回的promise的resolve
 * reject：then自身执行返回的promise的reject
 **/
function resolvePromise(promise2, retVal, resolve, reject) {
    // ...
}
```

##### `Promise.race`

- `race`方法，也返回一个promise，暂称之为`promiseRace`。
- 并且在所有promise后通过then放入一个函数fn1，这样就可以得到各promise执行完后的通知。
- 这样在fn1中判断第一个完成后，把`promiseRace`的resolve函数执行即可，且之后的都不执行。

```
// 一个执行完即resolve
Promise.race = Promise.prototype.race = function (aPromises) {
  return new Promise((resolve, reject)=>{
    let iFinished = false; // 是否完成
    for(let i=0; i<aPromises.length; i++){
      aPromises[i].then(data => {
        if (!iFinished) {
          iFinished = true;
          resolve(data);
        }
      }, reason => {
        if (!iFinished) {
          iFinished = true;
          reject(reason);
        }
      });
    }
  })
}
```

##### `Promise.all`

- `all`方法，也返回一个promise，暂称之为`promiseAll`。
- 并且在所有promise后通过then放入一个函数fn1，这样就可以得到各promise执行完后的通知。
- 这样在fn1中判断所有的都完成后，把`promiseAll`的resolve函数执行即可。

```
// 一个执行完即resolve
Promise.all = Promise.prototype.all = function (aPromises) {
  return new Promise((resolve, reject)=>{
    let aRetVal = [];
    let iFinished = 0; // 表示已完成的个数

    // 解决后的执行函数
    function processData(index, data) {
      aRetVal[index] = data;
      if (++iFinished === aPromises.length) {
        resolve(aRetVal);
      }
    }
    for(let i=0; i<aPromises.length; i++){
      aPromises[i].then(data => {
        processData(i, data);
      });
    }
  })
}
```