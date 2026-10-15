/** Registrar logro (RF-4.1, RNF-3): tipo -> evidencia -> detalles -> confirmacion (4 pasos). */
import { html, mount, evidenceChip, field, intentar, pageHeader, wizard } from '../core/ui.js';
import { logrosApi, semillerosApi, tiposLogroApi } from '../core/api.js';

export default async function iniciar({ root, user }) {
  const [tiposLogro, semillerosPropios] = await Promise.all([
    intentar(() => tiposLogroApi.listar()),
    intentar(() => semillerosApi.listar({ mios: true })),
  ]);
  const tipos = (tiposLogro ?? []).map((t) => ({ value: t.id, label: `${t.nombre} · ${t.xp} XP` }));
  const semilleros = (semillerosPropios ?? []).map((s) => ({ value: s.id, label: s.nombre }));
  const nombreDe = (opciones, valor) => opciones.find((o) => String(o.value) === String(valor))?.label;

  mount(
    root,
    html`<div class="mx-auto max-w-2xl">
      ${pageHeader({ title: 'Registrar logro', description: 'Cuatro pasos para reconocer tu actividad investigativa.' })}
      <div id="asistente"></div>
    </div>`,
  );

  wizard({
    root: root.querySelector('#asistente'),
    submitLabel: 'Registrar logro',
    steps: [
      {
        label: 'Tipo',
        isValid: ({ idTipoLogro }) => Boolean(idTipoLogro),
        render: ({ idTipoLogro = '' }) =>
          field({ label: 'Tipo de logro', name: 'idTipoLogro', type: 'select', options: tipos, value: idTipoLogro, hint: 'El XP depende del tipo y se asigna cuando el administrador lo aprueba.' }),
      },
      {
        label: 'Evidencia',
        isValid: ({ evidencia }) => Boolean(evidencia),
        render: ({ evidencia }) =>
          field({ label: 'Evidencia', name: 'evidencia', type: 'file', value: evidencia, hint: 'Adjunta el certificado, artículo o soporte que respalde el logro.' }),
      },
      {
        label: 'Detalles',
        isValid: ({ titulo, idSemillero }) => Boolean((titulo ?? '').trim() && idSemillero),
        render: ({ titulo = '', descripcion = '', idSemillero = '' }) =>
          html`${field({ label: 'Título', name: 'titulo', value: titulo, placeholder: 'Ej. Ponencia en el Congreso de Ingeniería' })}
            ${field({ label: 'Descripción (opcional)', name: 'descripcion', type: 'textarea', value: descripcion })}
            ${field({ label: 'Semillero que recibe el XP', name: 'idSemillero', type: 'select', options: semilleros, value: idSemillero })}`,
      },
      {
        label: 'Confirmar',
        render: ({ idTipoLogro, idSemillero, titulo, evidencia }) =>
          html`<dl class="grid gap-3 text-[15px] sm:grid-cols-2">
              <div><dt class="text-sm text-ink-soft">Tipo</dt><dd class="font-medium">${nombreDe(tipos, idTipoLogro)}</dd></div>
              <div><dt class="text-sm text-ink-soft">Semillero</dt><dd class="font-medium">${nombreDe(semilleros, idSemillero)}</dd></div>
              <div class="sm:col-span-2"><dt class="text-sm text-ink-soft">Título</dt><dd class="font-medium">${titulo}</dd></div>
              <div class="sm:col-span-2"><dt class="mb-1 text-sm text-ink-soft">Evidencia</dt><dd>${evidenceChip({ nombre: evidencia?.name })}</dd></div>
            </dl>
            <p class="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">${
              user.rol === 'docente_lider'
                ? 'Como líder, tu registro pasa directo a validación del administrador.'
                : 'Tu líder revisará el logro y lo enviará a validación del administrador.'
            }</p>`,
      },
    ],
    onSubmit: async (values) => {
      await intentar(async () => {
        await logrosApi.registrar(values);
        window.location.assign('/app/logros');
      });
    },
  });
}
