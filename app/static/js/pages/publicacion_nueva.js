/** Crear publicacion (RF-3.1, RNF-3): crear -> evidencia -> categoria -> publicar (4 pasos). */
import { html, mount, evidenceChip, field, pageHeader, wizard, intentar } from '../core/ui.js';
import { publicacionesApi, semillerosApi } from '../core/api.js';
import { CATEGORIAS_PUBLICACION, toOptions } from '../core/dominio.js';

const CATEGORIAS = toOptions(CATEGORIAS_PUBLICACION);

export default async function iniciar({ root, user }) {
  const semilleros = ((await intentar(() => semillerosApi.listar({ mios: true }))) ?? []).map((s) => ({ value: s.id, label: s.nombre }));

  mount(
    root,
    html`<div class="mx-auto max-w-2xl">
      ${pageHeader({ title: 'Nueva publicación', description: 'Comparte con la comunidad en cuatro pasos.' })}
      <div id="asistente"></div>
    </div>`,
  );

  wizard({
    root: root.querySelector('#asistente'),
    submitLabel: 'Publicar',
    steps: [
      {
        label: 'Crear',
        isValid: ({ contenido }) => (contenido ?? '').trim().length >= 10,
        render: ({ contenido = '' }) =>
          field({ label: '¿Qué quieres compartir?', name: 'contenido', type: 'textarea', rows: 6, value: contenido, placeholder: 'Describe el avance, evento o resultado (mínimo 10 caracteres).' }),
      },
      {
        label: 'Evidencia',
        render: ({ evidencia }) =>
          field({ label: 'Evidencia (opcional)', name: 'evidencia', type: 'file', value: evidencia, hint: 'Adjunta un documento o imagen que respalde tu publicación.' }),
      },
      {
        label: 'Categoría',
        isValid: ({ categoria, idSemillero }) => Boolean(categoria && idSemillero),
        render: ({ categoria = '', idSemillero = '' }) =>
          html`${field({ label: 'Categoría', name: 'categoria', type: 'select', options: CATEGORIAS, value: categoria })}
            ${field({ label: 'Semillero', name: 'idSemillero', type: 'select', options: semilleros, value: idSemillero, hint: 'La publicación se asocia al semillero que selecciones.' })}`,
      },
      {
        label: 'Publicar',
        render: ({ categoria, contenido, evidencia, esPublico }) =>
          html`<div>
              <p class="text-sm text-ink-soft">${categoria}</p>
              <p class="mt-1 whitespace-pre-line">${contenido}</p>
              ${evidencia ? html`<div class="mt-3">${evidenceChip({ nombre: evidencia.name })}</div>` : ''}
            </div>
            ${field({ label: 'Mostrar también en la página pública', name: 'esPublico', type: 'checkbox', value: esPublico, hint: 'Los visitantes verán el contenido sin datos personales.' })}
            ${user.rol === 'estudiante'
              ? html`<p class="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">El líder de tu semillero debe aprobar la publicación antes de que sea visible.</p>`
              : ''}`,
      },
    ],
    onSubmit: async (values) => {
      await intentar(async () => {
        await publicacionesApi.crear(values);
        window.location.assign('/app/publicaciones');
      });
    },
  });
}
