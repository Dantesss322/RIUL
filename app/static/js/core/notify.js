/**
 * Unico punto de retroalimentacion al usuario (SweetAlert2, cargado por CDN como `Swal`).
 *
 * Criterio:
 *  - success / info  -> toast no bloqueante.
 *  - warning         -> la persona hizo algo que no corresponde (datos invalidos, sin permiso, cuenta inactiva).
 *  - error           -> falla del sistema (servidor caido, error inesperado).
 */
const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (element) => {
    element.addEventListener('mouseenter', Swal.stopTimer);
    element.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

const dialog = Swal.mixin({ confirmButtonText: 'Entendido' });

export const notify = {
  success: (title) => toast.fire({ icon: 'success', title }),
  info: (title) => toast.fire({ icon: 'info', title }),
  warning: (text, title = 'Revisa la información') => dialog.fire({ icon: 'warning', title, text }),
  error: (text, title = 'Algo salió mal') => dialog.fire({ icon: 'error', title, text }),

  /** Pide confirmacion. Devuelve true si la persona acepta. */
  async confirm({ title, text, confirmText = 'Confirmar', danger = false }) {
    const { isConfirmed } = await Swal.fire({
      icon: danger ? 'warning' : 'question',
      title,
      text,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      customClass: danger ? { confirmButton: 'riul-swal-danger' } : undefined,
    });
    return isConfirmed;
  },

  /** Pide un motivo obligatorio. Devuelve el texto o null si cancela. */
  async askReason({ title, label }) {
    const { value } = await Swal.fire({
      title,
      input: 'textarea',
      inputLabel: label,
      inputAttributes: { 'aria-label': label },
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: 'riul-swal-danger' },
      inputValidator: (text) => (text.trim() ? undefined : 'Escribe el motivo para continuar.'),
    });
    return value?.trim() ?? null;
  },
};
