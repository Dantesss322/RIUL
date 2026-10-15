/**
 * Perfil (RF-1.5) y hoja de vida investigativa (RF-4.6).
 * La hoja de vida se arma sola con logros aprobados, proyectos, eventos y publicaciones.
 * El marco (pestanas, formulario y tarjetas) lo escribe templates/perfil.html.
 */
import { html, mount, cargarMarco, insigniaCard, intentar, withLoading } from '../core/ui.js';
import { enlazar, iniciarTabs } from '../core/dom.js';
import { usuariosApi } from '../core/api.js';
import { ROLES } from '../core/dominio.js';
import { formValues } from '../core/form.js';
import { initials, formatDate } from '../core/format.js';
import { session } from '../core/session.js';

const ICONOS_LINEA = { logro: 'award-line', publicacion: 'megaphone-line', evento: 'calendar-event-line', proyecto: 'folder-3-line' };

const CAMPOS = ['nombre', 'correo', 'telefono', 'orcid', 'lineasInvestigacion', 'biografia'];

/** Escribe los datos del usuario en la cabecera y en el formulario. */
function mostrarPerfil(root, user) {
  enlazar(root, {
    iniciales: initials(user.nombre),
    nombre: user.nombre,
    detalle: `${ROLES[user.rol]}${user.programa ? ` · ${user.programa}` : ''}`,
  });
  const formulario = root.querySelector('[data-form="perfil"]');
  CAMPOS.forEach((campo) => {
    formulario.elements[campo].value = user[campo] ?? '';
  });
}

function mostrarHojaDeVida(root, { semilleros, xpAportado, insignias, linea }) {
  enlazar(root, {
    xpAportado,
    totalInsignias: insignias.length,
    totalSemilleros: semilleros.length,
    detalleSemilleros: semilleros.join(' · ') || 'Sin semillero',
  });

  root.querySelector('[data-bloque="insignias"]').hidden = insignias.length === 0;
  mount(root.querySelector('[data-region="insignias"]'), insignias.map(insigniaCard));

  mount(
    root.querySelector('[data-region="linea"]'),
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
        )}</ol>`,
  );
}

export default function iniciar({ root, user }) {
  mostrarPerfil(root, session.user());

  iniciarTabs(root, {
    alCambiar: (id) => {
      if (id === 'hoja') {
        cargarMarco(root.querySelector('[data-carga]'), () => usuariosApi.hojaDeVida(user.id), (datos) => mostrarHojaDeVida(root, datos));
      }
    },
  });

  root.querySelector('[data-form="perfil"]').addEventListener('submit', async (event) => {
    event.preventDefault();
    await withLoading(event.target.querySelector('[type="submit"]'), () =>
      intentar(async () => {
        const actualizado = await usuariosApi.actualizarPerfil(formValues(event.target));
        session.set({ ...session.get(), user: actualizado });
        mostrarPerfil(root, actualizado);
      }),
    );
  });
}
