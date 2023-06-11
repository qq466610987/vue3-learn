
const data = {
  a: 1,
  b: 2,
};

let activeEffect
function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    fn()
  }
  effectFn.deps = []
  effectFn()
}

const reactiveMap = new WeakMap();

const obj = new Proxy(data, {
  get(targetObj, key) {


    return targetObj[key];
  },
  set(targetObj, key, newVal) {
    targetObj[key] = newVal;

    const depsMap = reactiveMap.get(targetObj);

    if (!depsMap) return;
    debugger
    const effects = depsMap.get(key);
    effects && effects.forEach((fn) => fn());
  },
});
effect(() => {
  console.log(obj.a ? obj.b : 'nothing');
});
console.log(reactiveMap)
// obj.a = undefined;
// obj.b = 3;
function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

function track(targetObj, key) {
  let depsMap = reactiveMap.get(targetObj);

  if (!depsMap) {
    reactiveMap.set(targetObj, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);

  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
  activeEffect.deps.push(deps)
}
