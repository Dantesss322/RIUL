/**
 * Detalle de un semillero (RF-2.1, RF-2.2, RF-2.6, RF-2.7): integrantes, proyectos, insignias y,
 * para su lider, las solicitudes de vinculacion. El id llega por la URL (/app/semilleros/<id>).
 * El marco (encabezado, pestanas, paneles y formularios de los modales) lo escribe
 * templates/semillero_detalle.html; aqui se completan los datos.
 */
import { html, mount, avatar, badge, button, cargarMarco, estadoBadge, insigniaCard, intentar, levelStars, on, xpProgress } from '../core/ui.js';
import { enlazar, formModal, iniciarTabs, llenarSelect, modalDe } from '../core/dom.js';
import { proyectosApi, semillerosApi, usuariosApi, vinculacionesApi } from '../core/api.js';
import { ROLES_INTEGRANTE, toOptions } from '../core/dominio.js';
import { formatDate } from '../core/format.js';
import { notify } from '../core/notify.js';

const ROLES = toOptions(ROLES_INTEGRANTE);

export default function iniciar({ root, params }) {
  const id = params.id;
  let semillero;

  const region = (nombre) => root.querySelector(`[data-region="${nombre}"]`);
  const tabs = iniciarTabs(root);

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

    enlazar(root, {
      nombre: semillero.nombre,
      detalle: `${semillero.facultad} · Líder: ${semillero.docenteLider}`,
      descripcion: semillero.descripcion,
    });
    mount(region('progreso'), html`${levelStars(semillero.progreso.nivel)}${xpProgress(semillero.progreso)}`);

    // Acciones y pestana de solicitudes: solo para el lider de este semillero.
    root.querySelectorAll('[data-lider]').forEach((elemento) => {
      elemento.hidden = !puedeGestionar;
    });
    root.querySelector('[data-tab="solicitudes"]').hidden = !puedeGestionar;
    tabs.contar('solicitudes', puedeGestionar ? semillero.solicitudes.length : 0);
    if (!puedeGestionar && tabs.activa() === 'solicitudes') tabs.seleccionar('integrantes');

    mount(region('integrantes'), integrantes(puedeGestionar));
    mount(region('proyectos'), proyectos());
    mount(region('insignias'), insignias());
    mount(region('solicitudes'), solicitudes());
  };

  const recargar = () =>
    cargarMarco(root.querySelector('[data-carga]'), () => semillerosApi.obtener(id), (datos) => {
      semillero = datos;
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
    formModal(modalDe('agregar-integrante'), {
      alAbrir: (form) => llenarSelect(form.elements.idUsuario, estudiantes.map((e) => ({ value: e.id, label: e.nombre }))),
      alEnviar: async (values) => {
        await semillerosApi.agregarIntegrante(id, values);
        recargar();
        return true;
      },
    });
  });

  on(root, 'click', '[data-action="proyecto"]', () =>
    formModal(modalDe('registrar-proyecto'), {
      alEnviar: async (values) => {
        await proyectosApi.crear({ ...values, idSemillero: Number(id), esPublico: values.esPublico === 'on' });
        recargar();
        return true;
      },
    }),
  );

  recargar();
}
