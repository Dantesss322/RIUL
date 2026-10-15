/**
 * Validaciones (RF-1.4, RF-2.7, RF-4.2, RF-5.2): bandejas segun el rol.
 * Administrador: logros en validacion y postulaciones. Docente lider: vinculaciones, publicaciones
 * por aprobar y logros registrados por estudiantes (los envia a validacion o los devuelve).
 */
import { html, mount, button, card, cargar, emptyState, evidenceChip, intentar, on, pageHeader, tabs, withLoading } from '../core/ui.js';
import { logrosApi, postulacionesApi, publicacionesApi, vinculacionesApi } from '../core/api.js';
import { formatRelative } from '../core/format.js';
import { notify } from '../core/notify.js';

/** Texto principal y secundario de una fila. */
const resumen = (titulo, detalle, extra = '') =>
  html`<div class="min-w-0 grow"><p class="font-medium">${titulo}</p><p class="text-sm text-ink-soft">${detalle}</p>${extra}</div>`;

/** Par de botones aprobar / rechazar con el tipo de elemento y su id. */
const decision = (tipo, id, { aprobar = 'Aprobar', iconoAprobar = 'check-line' } = {}) =>
  html`${button({ size: 'sm', icon: iconoAprobar, children: aprobar, 'data-decision': 'aprobar', 'data-tipo': tipo, 'data-id': id })}
    ${button({ size: 'sm', variant: 'secondary', icon: 'close-line', children: 'Rechazar', 'data-decision': 'rechazar', 'data-tipo': tipo, 'data-id': id })}`;

const bandeja = (filas, fila) =>
  filas.length === 0
    ? emptyState({ icon: 'inbox-line', title: 'Todo al día', description: 'No hay elementos pendientes en esta bandeja.' })
    : html`<ul class="divide-y divide-line/60">${filas.map((f) => html`<li class="flex flex-wrap items-center gap-3 py-4">${fila(f)}</li>`)}</ul>`;

/** Definicion de cada bandeja: como se carga, como se dibuja una fila y que hacen sus decisiones. */
const BANDEJAS = {
  logros_admin: {
    cargar: () => logrosApi.listar({ estado: 'en_validacion' }),
    fila: (l) => html`${resumen(l.titulo, `${l.tipo} · ${l.usuario} · ${l.semillero} · +${l.xpPotencial} XP`, html`<div class="mt-2">${evidenceChip(l.evidencia)}</div>`)}${decision('logro-admin', l.id)}`,
    aprobar: (id) => logrosApi.aprobar(id),
    rechazar: (id, motivo) => logrosApi.rechazar(id, motivo),
    pideMotivo: 'Rechazar logro',
  },
  postulaciones: {
    cargar: () => postulacionesApi.listar({ estado: 'pendiente' }),
    fila: (p) => html`${resumen(p.usuario, `${p.convocatoria} · ${formatRelative(p.fecha)}`)}${decision('postulacion', p.id)}`,
    aprobar: (id) => postulacionesApi.resolver(id, 'aprobada'),
    rechazar: (id) => postulacionesApi.resolver(id, 'rechazada'),
  },
  vinculaciones: {
    cargar: () => vinculacionesApi.listar({ estado: 'pendiente' }),
    fila: (s) => html`${resumen(s.usuario, `${s.programa} · quiere vincularse a ${s.semillero}`)}${decision('vinculacion', s.id)}`,
    aprobar: (id) => vinculacionesApi.resolver(id, 'activo'),
    rechazar: (id) => vinculacionesApi.resolver(id, 'rechazado'),
  },
  publicaciones: {
    cargar: () => publicacionesApi.listar({ estado: 'pendiente' }),
    fila: (p) => html`${resumen(p.autor, `${p.semillero} · ${p.categoria} · ${formatRelative(p.fecha)}`, html`<p class="mt-2 text-[15px]">${p.contenido}</p>`)}${decision('publicacion', p.id)}`,
    aprobar: (id) => publicacionesApi.resolver(id, 'publicada'),
    rechazar: (id) => publicacionesApi.resolver(id, 'rechazada'),
  },
  logros_lider: {
    cargar: () => logrosApi.listar({ estado: 'registrado' }),
    fila: (l) => html`${resumen(l.titulo, `${l.tipo} · ${l.usuario} · +${l.xpPotencial} XP`, html`<div class="mt-2">${evidenceChip(l.evidencia)}</div>`)}${decision('logro-lider', l.id, { aprobar: 'Enviar a validación', iconoAprobar: 'send-plane-line' })}`,
    aprobar: (id) => logrosApi.enviarAValidacion(id),
    rechazar: (id, motivo) => logrosApi.rechazar(id, motivo),
    pideMotivo: 'Devolver logro',
  },
};

const BANDEJA_DE = {
  'logro-admin': 'logros_admin',
  postulacion: 'postulaciones',
  vinculacion: 'vinculaciones',
  publicacion: 'publicaciones',
  'logro-lider': 'logros_lider',
};

const PESTANAS = {
  administrador: [
    { id: 'logros_admin', label: 'Logros' },
    { id: 'postulaciones', label: 'Postulaciones' },
  ],
  docente_lider: [
    { id: 'vinculaciones', label: 'Vinculaciones' },
    { id: 'publicaciones', label: 'Publicaciones' },
    { id: 'logros_lider', label: 'Logros' },
  ],
};

export default async function iniciar({ root, user }) {
  const pestanas = PESTANAS[user.rol];
  let activa = pestanas[0].id;
  const conteos = {};

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({
          title: 'Validaciones',
          description: user.rol === 'administrador'
            ? 'Aprueba logros y postulaciones para mantener la información verificada.'
            : 'Gestiona las solicitudes de tu semillero antes de que lleguen al administrador.',
        })}
        <div class="mb-4">${tabs(pestanas.map((p) => ({ ...p, count: conteos[p.id] })), activa)}</div>
        ${card({}, html`<div id="bandeja"></div>`)}`,
    );
    const contenedor = root.querySelector('#bandeja');
    const definicion = BANDEJAS[activa];
    cargar(contenedor, definicion.cargar, (filas) => {
      conteos[activa] = filas.length;
      mount(contenedor, bandeja(filas, definicion.fila));
    });
  };

  /** Cuenta pendientes de todas las pestanas para mostrar el numero en cada una. */
  await Promise.all(
    pestanas.map(async (p) => {
      conteos[p.id] = ((await intentar(() => BANDEJAS[p.id].cargar())) ?? []).length;
    }),
  );

  on(root, 'click', '[data-tab]', (tab) => {
    activa = tab.dataset.tab;
    dibujar();
  });

  on(root, 'click', '[data-decision]', async (boton) => {
    const definicion = BANDEJAS[BANDEJA_DE[boton.dataset.tipo]];
    const { decision: accion, id } = boton.dataset;

    let motivo;
    if (accion === 'rechazar' && definicion.pideMotivo) {
      motivo = await notify.askReason({ title: definicion.pideMotivo, label: 'Motivo del rechazo (se comunicará al autor)' });
      if (!motivo) return;
    }

    await withLoading(boton, () =>
      intentar(async () => {
        await (accion === 'aprobar' ? definicion.aprobar(id) : definicion.rechazar(id, motivo));
        conteos[activa] = Math.max((conteos[activa] ?? 1) - 1, 0);
        dibujar();
      }),
    );
  });

  dibujar();
}
