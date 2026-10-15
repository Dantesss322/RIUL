/**
 * Detalle de un semillero (RF-2.1, RF-2.2, RF-2.6, RF-2.7): integrantes, proyectos, insignias y,
 * para su lider, las solicitudes de vinculacion. El id llega por la URL (/app/semilleros/<id>).
 */
import {
  html, mount, avatar, badge, button, card, cargar, estadoBadge, field, formModal, insigniaCard,
  intentar, levelStars, on, pageHeader, tabs, xpProgress,
} from '../core/ui.js';
import { proyectosApi, semillerosApi, usuariosApi, vinculacionesApi } from '../core/api.js';
import { ROLES_INTEGRANTE, toOptions } from '../core/dominio.js';
import { formatDate } from '../core/format.js';
import { notify } from '../core/notify.js';

const ROLES = toOptions(ROLES_INTEGRANTE);

export default function iniciar({ root, params }) {
  const id = params.id;
  let semillero;
  let pestana = 'integrantes';

  const integrantes = (puedeGestionar) =>
    semillero.integrantes.length === 0
      ? html`<p class="text-ink-soft">Aún no hay integrantes vinculados.</p>`
      : html`<ul class="divide-y divide-line/60">${semillero.integrantes.map(
          (i) => html`<li class="flex flex-wrap items-center gap-3 py-3">
            ${avatar(i.usuario)}
            <div class="min-w-0 grow">
              <p class="font-medium">${i.usuario}</p>
              <p class="text-sm text-ink-soft">${i.programa} · desde ${formatDate(i.fechaIngreso)}</p>
            </div>
            ${puedeGestionar
              ? html`<select aria-label="Rol de ${i.usuario}" data-rol-integrante="${i.id}" class="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">${ROLES.map(
                    (r) => html`<option ${r.value === i.rol ? 'selected' : ''}>${r.label}</option>`,
                  )}</select>
                  ${button({ variant: 'ghost', size: 'sm', icon: 'delete-bin-line', 'aria-label': `Retirar a ${i.usuario}`, 'data-retirar': i.id, 'data-nombre': i.usuario })}`
              : badge('neutral', i.rol)}
          </li>`,
        )}</ul>`;

  const solicitudes = () =>
    semillero.solicitudes.length === 0
      ? html`<p class="text-ink-soft">No hay solicitudes pendientes.</p>`
      : html`<ul class="divide-y divide-line/60">${semillero.solicitudes.map(
          (s) => html`<li class="flex flex-wrap items-center gap-3 py-3">
            ${avatar(s.usuario)}
            <div class="min-w-0 grow"><p class="font-medium">${s.usuario}</p><p class="text-sm text-ink-soft">${s.programa}</p></div>
            ${button({ size: 'sm', icon: 'check-line', children: 'Aprobar', 'data-resolver': s.id, 'data-estado': 'activo' })}
            ${button({ size: 'sm', variant: 'secondary', icon: 'close-line', children: 'Rechazar', 'data-resolver': s.id, 'data-estado': 'rechazado' })}
          </li>`,
        )}</ul>`;

  const insignias = () =>
    semillero.insignias.length === 0
      ? html`<p class="text-ink-soft">El semillero aún no ha obtenido insignias.</p>`
      : html`<ul class="grid gap-3 sm:grid-cols-2">${semillero.insignias.map(insigniaCard)}</ul>`;

  const proyectos = () =>
    semillero.proyectos.length === 0
      ? html`<p class="text-ink-soft">Este semillero aún no tiene proyectos visibles.</p>`
      : html`<ul class="divide-y divide-line/60">${semillero.proyectos.map(
          (p) => html`<li class="flex items-center gap-3 py-3">
            <i class="ri-folder-3-line shrink-0 text-ink-soft" style="font-size:20px;line-height:1" aria-hidden="true"></i>
            <a href="/app/proyectos/${p.id}" class="grow font-medium hover:text-accent">${p.nombre}</a>${estadoBadge(p.estado)}
          </li>`,
        )}</ul>`;

  const dibujar = () => {
    const puedeGestionar = semillero.esLider;
    const pestanas = [
      { id: 'integrantes', label: 'Integrantes' },
      { id: 'proyectos', label: 'Proyectos' },
      { id: 'insignias', label: 'Insignias' },
      ...(puedeGestionar ? [{ id: 'solicitudes', label: 'Solicitudes', count: semillero.solicitudes.length }] : []),
    ];
    const contenido = { integrantes: () => integrantes(puedeGestionar), solicitudes, insignias, proyectos }[pestana]();

    mount(
      root,
      html`${pageHeader({
          title: semillero.nombre,
          description: `${semillero.facultad} · Líder: ${semillero.docenteLider}`,
          actions: puedeGestionar
            ? html`${button({ variant: 'secondary', icon: 'user-add-line', children: 'Agregar integrante', 'data-action': 'agregar' })}
                ${button({ icon: 'add-line', children: 'Registrar proyecto', 'data-action': 'proyecto' })}`
            : '',
        })}
        ${card({ className: 'mb-6' }, html`<p class="mb-4 text-ink-soft">${semillero.descripcion}</p>
          <div class="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">${levelStars(semillero.progreso.nivel)}${xpProgress(semillero.progreso)}</div>`)}
        <div class="mb-4">${tabs(pestanas, pestana)}</div>
        ${card({}, contenido)}`,
    );
  };

  const recargar = () =>
    cargar(root, () => semillerosApi.obtener(id), (datos) => {
      semillero = datos;
      if (pestana === 'solicitudes' && !semillero.esLider) pestana = 'integrantes';
      dibujar();
    });

  on(root, 'click', '[data-tab]', (tab) => {
    pestana = tab.dataset.tab;
    dibujar();
  });

  on(root, 'click', '[data-resolver]', (boton) =>
    intentar(async () => {
      await vinculacionesApi.resolver(boton.dataset.resolver, boton.dataset.estado);
      await recargar();
    }),
  );

  root.addEventListener('change', (event) => {
    const select = event.target.closest('[data-rol-integrante]');
    if (select) intentar(() => semillerosApi.cambiarRolIntegrante(select.dataset.rolIntegrante, select.value).then(recargar));
  });

  on(root, 'click', '[data-retirar]', async (boton) => {
    const acepta = await notify.confirm({
      title: `¿Retirar a ${boton.dataset.nombre}?`,
      text: 'Dejará de ser integrante del semillero.',
      confirmText: 'Retirar',
      danger: true,
    });
    if (acepta) await intentar(() => semillerosApi.quitarIntegrante(boton.dataset.retirar).then(recargar));
  });

  on(root, 'click', '[data-action="agregar"]', async () => {
    const estudiantes = (await intentar(() => usuariosApi.estudiantes())) ?? [];
    formModal({
      title: 'Agregar integrante',
      submitLabel: 'Agregar',
      body: html`${field({ label: 'Estudiante', name: 'idUsuario', type: 'select', options: estudiantes.map((e) => ({ value: e.id, label: e.nombre })), required: true })}
        ${field({ label: 'Rol en el semillero', name: 'rol', type: 'select', options: ROLES, required: true })}`,
      onSubmit: async (values) => {
        await semillerosApi.agregarIntegrante(id, values);
        recargar();
        return true;
      },
    });
  });

  on(root, 'click', '[data-action="proyecto"]', () =>
    formModal({
      title: 'Registrar proyecto',
      submitLabel: 'Registrar',
      body: html`${field({ label: 'Nombre del proyecto', name: 'nombre', required: true })}
        ${field({ label: 'Descripción', name: 'descripcion', type: 'textarea', required: true })}
        ${field({ label: 'Mostrar en la página pública', name: 'esPublico', type: 'checkbox', hint: 'Los visitantes podrán ver el nombre y la descripción del proyecto.' })}`,
      onSubmit: async (values) => {
        await proyectosApi.crear({ ...values, idSemillero: Number(id), esPublico: values.esPublico === 'on' });
        recargar();
        return true;
      },
    }),
  );

  recargar();
}
