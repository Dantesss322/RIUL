/**
 * Administracion de usuarios (RF-1.4, RF-1.6, RF-7.1): aprobacion de cuentas pendientes y asignacion
 * de roles. Un usuario no puede cambiar su propio rol.
 * El encabezado, el filtro y las tarjetas los escribe templates/admin_usuarios.html.
 */
import { html, mount, avatar, badge, button, cargar, dataTable, emptyState, intentar, on } from '../core/ui.js';
import { usuariosApi } from '../core/api.js';
import { ROLES, toOptions } from '../core/dominio.js';
import { formatRelative } from '../core/format.js';

const ROLES_OPCIONES = toOptions(Object.keys(ROLES), ROLES);
const DOMINIO = '@unilibre.edu.co';

export default function iniciar({ root, user }) {
  let filtros = { q: '', rol: '' };

  const pendientes = root.querySelector('[data-region="pendientes"]');
  const registrados = root.querySelector('[data-region="registrados"]');

  const cargarPendientes = () =>
    cargar(pendientes, () => usuariosApi.listar({ estado: 'pendiente' }), (filas) =>
      mount(
        pendientes,
        filas.length === 0
          ? html`<p class="text-ink-soft">No hay solicitudes pendientes.</p>`
          : html`<ul class="divide-y divide-line/60">${filas.map((c) => {
              const institucional = c.correo.endsWith(DOMINIO);
              return html`<li class="flex flex-wrap items-center gap-3 py-4">
                ${avatar(c.nombre)}
                <div class="min-w-0 grow">
                  <p class="font-medium">${c.nombre}</p>
                  <p class="text-sm text-ink-soft">${c.correo} · ${c.programa ?? 'Sin programa'} · ${formatRelative(c.creadoEn)}</p>
                  ${c.justificacion ? html`<p class="mt-1 text-sm">“${c.justificacion}”</p>` : ''}
                </div>
                ${badge(institucional ? 'success' : 'warning', institucional ? 'Cuenta institucional' : 'Sin cuenta institucional')}
                ${button({ size: 'sm', icon: 'check-line', children: 'Aprobar', 'data-cuenta': c.id, 'data-estado': 'aprobado' })}
                ${button({ size: 'sm', variant: 'secondary', icon: 'close-line', children: 'Rechazar', 'data-cuenta': c.id, 'data-estado': 'rechazado' })}
              </li>`;
            })}</ul>`,
      ),
    );

  const cargarRegistrados = () =>
    cargar(registrados, () => usuariosApi.listar({ ...filtros, estado: 'aprobado' }), (filas) =>
      mount(
        registrados,
        filas.length === 0
          ? emptyState({ title: 'No hay usuarios que coincidan.' })
          : dataTable(
              [
                {
                  header: 'Usuario',
                  cell: (u) => html`<div class="flex items-center gap-3">${avatar(u.nombre, 'sm')}<div><p class="font-medium">${u.nombre}</p><p class="text-sm text-ink-soft">${u.correo}</p></div></div>`,
                },
                { header: 'Programa', cell: (u) => u.programa ?? '—' },
                {
                  header: 'Rol',
                  cell: (u) => html`<select aria-label="Rol de ${u.nombre}" data-rol-usuario="${u.id}" ${u.id === user.id ? 'disabled' : ''} class="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm disabled:bg-canvas disabled:text-ink-soft">${ROLES_OPCIONES.map(
                    (r) => html`<option value="${r.value}" ${r.value === u.rol ? 'selected' : ''}>${r.label}</option>`,
                  )}</select>`,
                },
              ],
              filas,
            ),
      ),
    );

  on(root, 'click', '[data-cuenta]', (boton) =>
    intentar(async () => {
      await usuariosApi.cambiarEstado(boton.dataset.cuenta, boton.dataset.estado);
      await Promise.all([cargarPendientes(), cargarRegistrados()]);
    }),
  );

  root.addEventListener('change', (event) => {
    const select = event.target.closest('[data-rol-usuario]');
    if (!select) return;
    intentar(async () => {
      await usuariosApi.cambiarRol(select.dataset.rolUsuario, select.value);
      await cargarRegistrados();
    });
  });

  root.querySelector('[data-form="filtros"]').addEventListener('submit', (event) => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    filtros = { q: datos.get('q').trim(), rol: datos.get('rol') };
    cargarRegistrados();
  });

  cargarPendientes();
  cargarRegistrados();
}
