/**
 * Perfil (RF-1.5) y hoja de vida investigativa (RF-4.6).
 * La hoja de vida se arma sola con logros aprobados, proyectos, eventos y publicaciones.
 */
import { html, mount, avatar, button, card, cargar, field, insigniaCard, intentar, on, pageHeader, stat, tabs, withLoading } from '../core/ui.js';
import { usuariosApi } from '../core/api.js';
import { ROLES } from '../core/dominio.js';
import { formValues } from '../core/form.js';
import { formatDate } from '../core/format.js';
import { session } from '../core/session.js';

const ICONOS_LINEA = { logro: 'award-line', publicacion: 'megaphone-line', evento: 'calendar-event-line', proyecto: 'folder-3-line' };

function datosPersonales(user) {
  return card({}, html`
    <div class="mb-6 flex items-center gap-4">
      ${avatar(user.nombre, 'lg')}
      <div>
        <p class="text-lg font-semibold tracking-tight">${user.nombre}</p>
        <p class="text-ink-soft">${ROLES[user.rol]}${user.programa ? ` · ${user.programa}` : ''}</p>
      </div>
    </div>
    <form class="grid gap-4 sm:grid-cols-2" data-form="perfil">
      ${field({ label: 'Nombre completo', name: 'nombre', value: user.nombre, required: true })}
      ${field({ label: 'Correo', name: 'correo', value: user.correo, disabled: true, readonly: true })}
      ${field({ label: 'Teléfono', name: 'telefono', type: 'tel', value: user.telefono })}
      ${field({ label: 'ORCID', name: 'orcid', value: user.orcid, placeholder: '0000-0000-0000-0000' })}
      ${field({ label: 'Líneas de investigación', name: 'lineasInvestigacion', value: user.lineasInvestigacion, className: 'sm:col-span-2' })}
      ${field({ label: 'Biografía', name: 'biografia', type: 'textarea', value: user.biografia, className: 'sm:col-span-2' })}
      <div class="sm:col-span-2">${button({ type: 'submit', children: 'Guardar cambios' })}</div>
    </form>`);
}

function hojaDeVida({ semilleros, xpAportado, insignias, linea }) {
  return html`<div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-3">
      ${stat({ label: 'XP aportado', value: xpAportado })}
      ${stat({ label: 'Insignias', value: insignias.length })}
      ${stat({ label: 'Semilleros', value: semilleros.length, hint: semilleros.join(' · ') || 'Sin semillero' })}
    </div>
    ${insignias.length
      ? card({ title: 'Insignias obtenidas' }, html`<ul class="grid gap-3 sm:grid-cols-2">${insignias.map(insigniaCard)}</ul>`)
      : ''}
    ${card({ title: 'Trayectoria investigativa' },
      linea.length === 0
        ? html`<p class="text-ink-soft">Cuando tus logros sean aprobados aparecerán aquí automáticamente.</p>`
        : html`<ol class="space-y-5">${linea.map(
            (item) => html`<li class="flex gap-4">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-soft"><i class="ri-${ICONOS_LINEA[item.tipo]}" style="font-size:20px;line-height:1" aria-hidden="true"></i></span>
              <div>
                <p class="font-medium">${item.titulo}</p>
                <p class="text-sm text-ink-soft">${item.detalle} · ${formatDate(item.fecha)}${item.xp ? ` · +${item.xp} XP` : ''}</p>
              </div>
            </li>`,
          )}</ol>`)}
  </div>`;
}

export default function iniciar({ root, user }) {
  let pestana = 'datos';

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({ title: 'Mi perfil', description: 'Tus datos y tu trayectoria investigativa en un solo lugar.' })}
        <div class="mb-6">${tabs([{ id: 'datos', label: 'Datos personales' }, { id: 'hoja', label: 'Hoja de vida' }], pestana)}</div>
        <div id="contenido"></div>`,
    );
    const contenido = root.querySelector('#contenido');
    if (pestana === 'datos') mount(contenido, datosPersonales(session.user()));
    else cargar(contenido, () => usuariosApi.hojaDeVida(user.id), (datos) => mount(contenido, hojaDeVida(datos)));
  };

  on(root, 'click', '[data-tab]', (tab) => {
    pestana = tab.dataset.tab;
    dibujar();
  });

  root.addEventListener('submit', async (event) => {
    event.preventDefault();
    await withLoading(event.target.querySelector('[type="submit"]'), () =>
      intentar(async () => {
        const actualizado = await usuariosApi.actualizarPerfil(formValues(event.target));
        session.set({ ...session.get(), user: actualizado });
        dibujar();
      }),
    );
  });

  dibujar();
}
