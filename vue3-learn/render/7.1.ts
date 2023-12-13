import { effect, ref } from '@vue/reactivity'

function renderer(domString: string, container: HTMLElement | null) {
  if (!container) return
  container.innerHTML = domString
}

const count = ref(1)

effect(() => {
  renderer(`<h1>${count.value}</h1>`, document.getElementById('app'))
})

count.value++