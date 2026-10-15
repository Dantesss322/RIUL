/**
 * Validaciones (RF-1.4, RF-2.7, RF-4.2, RF-5.2): bandejas segun el rol.
 * Administrador: logros en validacion y postulaciones. Docente lider: vinculaciones, publicaciones
 * por aprobar y logros registrados por estudiantes (los envia a validacion o los devuelve).
 * Las pestanas de cada rol y la tarjeta de la bandeja las escribe templates/validaciones.html.
 */
import { html, mount, button, cargar, emptyState, evidenceChip, intentar, on, withLoading } from '../core/ui.js';import { enlazar, iniciarTabs } from '../core/dom.js';
import { logrosApi, postulacionesApi, publicacionesApi, vinculacionesApi } from '../core/api.js';
import { formatRelative } from '../core/format.js';
import { notify } from '../core/notify.js';

/** Texto principal y secundario de una fila. */
const resumen = (titulo, detalle, extra = '') =>
  html`<div class="min-w-0 grow"><p class="font-medium">${titulo}</p><p class="text-sm text-ink-soft">${detalle}</p>${extra}</div>`;

/** Par de botones aprobar / rechazar con el id del elemento. */
const decision = (id, { aprobar = 'Aprobar', iconoAprobar = 'check-line' } = {}) =>
  html`${button({ size: 'sm', icon: iconoAprobar, children: aprobar, 'data-decision': 'aprobar', 'data-id': id })}
    ${button({ size: 'sm', variant: 'secondary', icon: 'close-line', children: 'Rechazar', 'data-decision': 'rechazar', 'data-id': id })}`;

const bandeja = (filas, fila) =>
  filas.length === 0
    ? emptyState({ icon: 'inbox-line', title: 'Todo al día', description: 'No hay elementos pendientes en esta bandeja.' })
    : html`<ul class="divide-y divide-line/60">${filas.map((f) => html`<li class="flex flex-wrap items-center gap-3 py-4">${fila(f)}</li>`)}</ul>`;

/**
 * Definicion de cada bandeja (el id coincide con el data-tab de la plantilla): como se carga,
 * como se dibuja una fila y que hacen sus decisiones.
 */
const BANDEJAS = {
  logros_admin: {
    cargar: () => logrosApi.listar({ estado: 'en_validacion' }),
    fila: (l) => html`${resumen(l.titulo, `${l.tipo} · ${l.usuario} · ${l.semillero} · +${l.xpPotencial} XP`, html`<div class="mt-2">${evidenceChip(l.evidencia)}</div>`)}${decision(l.id)}`,
    aprobar: (id) => logrosApi.aprobar(id),
    rechazar: (id, motivo) => logrosApi.rechazar(id, motivo),
    pideMotivo: 'Rechazar logro',
  },
  postulaciones: {
    cargar: () => postulacionesApi.listar({ estado: 'pendiente' }),
    fila: (p) => html`${resumen(p.usuario, `${p.convocatoria} · ${formatRelative(p.fecha)}`)}${decision(p.id)}`,
    aprobar: (id) => postulacionesApi.resolver(id, 'aprobada'),
    rechazar: (id) => postulacionesApi.resolver(id, 'rechazada'),
  },
  vinculaciones: {
    cargar: () => vinculacionesApi.listar({ estado: 'pendiente' }),
    fila: (s) => html`${resumen(s.usuario, `${s.programa} · quiere vincularse a ${s.semillero}`)}${decision(s.id)}`,
    aprobar: (id) => vinculacionesApi.resolver(id, 'activo'),
    rechazar: (id) => vinculacionesApi.resolver(id, 'rechazado'),
  },
  publicaciones: {
    cargar: () => publicacionesApi.listar({ estado: 'pendiente' }),
    fila: (p) => html`${resumen(p.autor, `${p.semillero} · ${p.categoria} · ${formatRelative(p.fecha)}`, html`<p class="mt-2 text-[15px]">${p.contenido}</p>`)}${decision(p.id)}`,
    aprobar: (id) => publicacionesApi.resolver(id, 'publicada'),
    rechazar: (id) => publicacionesApi.resolver(id, 'rechazada'),
  },
  logros_lider: {
    cargar: () => logrosApi.listar({ estado: 'registrado' }),
    fila: (l) => html`${resumen(l.titulo, `${l.tipo} · ${l.usuario} · +${l.xpPotencial} XP`, html`<div class="mt-2">${evidenceChip(l.evidencia)}</div>`)}${decision(l.id, { aprobar: 'Enviar a validación', iconoAprobar: 'send-plane-line' })}`,
    aprobar: (id) => logrosApi.enviarAValidacion(id),
    rechazar: (id, motivo) => logrosApi.rechazar(id, motivo),
    pideMotivo: 'Devolver logro',
  },
};

export default function iniciar({ root, user }) {
  const contenedor = root.querySelector('[data-region="bandeja"]');
  const pestanas = [...root.querySelectorAll('[role="tab"]')].map((tab) => tab.dataset.tab);
  let activa;

  enlazar(root, {
    descripcion: user.rol === 'administrador'
      ? 'Aprueba logros y postulaciones para mantener la información verificada.'
      : 'Gestiona las solicitudes de tu semillero antes de que lleguen al administrador.',
  });

  const tabs = iniciarTabs(root, {
    alCambiar: (id) => {
      activa = id;
      cargar(contenedor, BANDEJAS[id].cargar, (filas) => {
        tabs.contar(id, filas.length);
        mount(contenedor, bandeja(filas, BANDEJAS[id].fila));
      });
    },
  });

  /** Cuenta pendientes de todas las pestanas para mostrar el numero en cada una. */
  pestanas.forEach(async (id) => {
    const filas = (await intentar(() => BANDEJAS[id].cargar())) ?? [];
    tabs.contar(id, filas.length);
  });

  on(root, 'click', '[data-decision]', async (boton) => {
    const definicion = BANDEJAS[activa];
    const { decision: accion, id } = boton.dataset;

    let motivo;
    if (accion === 'rechazar' && definicion.pideMotivo) {
      motivo = await notify.askReason({ title: definicion.pideMotivo, label: 'Motivo del rechazo (se comunicará al autor)' });
      if (!motivo) return;
    }

    await withLoading(boton, () =>
      intentar(async () => {
        await (accion === 'aprobar' ? definicion.aprobar(id) : definicion.rechazar(id, motivo));
        tabs.seleccionar(activa);
      }),
    );
  });
}
