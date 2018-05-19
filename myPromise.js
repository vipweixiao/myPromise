
/**
 * 解析then传入函数的执行结果retVal
 * promise2: then自身执行返回的promise
 * retVal：then中函数执行的结果
 * resolve：then自身执行返回的promise的resolve
 * reject：then自身执行返回的promise的reject
 **/
function resolvePromise(promise2, retVal, resolve, reject) {
  if (promise2 === retVal) {
    throw new Error('循环引用');
  }

  if (retVal && (['object', 'function'].indexOf(typeof retVal) > -1)) {
    try {
      let then = retVal.then;
      let called;
      // 如果retVal为promise对象，则把resolve放入retVal的callbacks中执行
      if (typeof then === 'function') { // retVal为promise
        then.call(retVal, (data)=>{
          if (called)  return;
          called = true;
          resolvePromise(retVal, data, resolve, reject);
        }, err => {
          if (called)  return;
          called = true;
          reject(err);
        })
        
      } else { // retVal为普通对象
        resolve(retVal);
      }
    } catch (error) { 
      reject(retVal);
    }
  } else { // retVal为基本数据类型
    resolve(retVal);
  }
}

class Promise{
  constructor(executor){
    this.status = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onResolveCallbacks = [];
    this.onRejectCallbacks = [];

    let resolve = data => {
      this.status = 'resolved';
      this.value = data;
      this.onResolveCallbacks.forEach(fn => fn());
    }

    let reject = err => {
      this.status = 'rejected';
      this.value = error;
      this.onRejectCallbacks.forEach(fn => fn());
    }

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
    
  }

  then(fnResolved, fnRejected){
    let promise2;
    if (this.status === 'resolved') {
      promise2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          let retVal = fnResolved(this.value);
          resolvePromise(promise2, retVal, resolve, reject);
        }, 0);
      });
    }

    if (this.status === 'rejected') {
      promise2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          let retVal = fnRejected(this.value);
          resolvePromise(promise2, retVal, resolve, reject);
        }, 0);
      });
    }

    if (this.status === 'pending') {
      promise2 = new Promise((resolve, reject) => {
        this.onResolveCallbacks.push(() => {
          if (this.status === 'resolved') {
            let retVal = fnResolved(this.value);
            resolvePromise(promise2, retVal, resolve, reject);
          }
        });

        this.onResolveCallbacks.push(() => {
          if (this.status === 'rejected') {
            let retVal = fnRejected(this.value);
            resolvePromise(promise2, retVal, resolve, reject);
          }
        });
      });
    }

    return promise2;
  }

}

Promise.resolve = Promise.prototype.resolve = function (val){
  return new Promise( (resolve, reject)=> {
    resolve(val);
  });
}

Promise.reject = Promise.prototype.reject = function (reason) {
  return new Promise( (resolve, reject)=> {
    reject(reason);
  });
}

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

// 全都执行完即resolve
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