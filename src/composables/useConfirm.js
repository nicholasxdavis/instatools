import { reactive } from 'vue'

const dialog = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
})

let resolver = null

function close(result) {
  dialog.open = false
  const resolve = resolver
  resolver = null
  resolve?.(result)
}

export function useConfirm() {
  function confirm({
    title = 'Are you sure?',
    message = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = {}) {
    if (resolver) close(false)
    dialog.title = title
    dialog.message = message
    dialog.confirmLabel = confirmLabel
    dialog.cancelLabel = cancelLabel
    dialog.danger = danger
    dialog.open = true
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function accept() {
    close(true)
  }

  function dismiss() {
    close(false)
  }

  return { dialog, confirm, accept, dismiss }
}
