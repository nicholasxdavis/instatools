import { reactive } from 'vue'

const toast = reactive({
  visible: false,
  message: '',
  type: 'success',
})

let timer = 0

export function useToast() {
  function show(message, type = 'success') {
    toast.message = message
    toast.type = type
    toast.visible = true
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      toast.visible = false
    }, 2800)
  }

  return { toast, show }
}
