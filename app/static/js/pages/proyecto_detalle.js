/**
 * Detalle de un proyecto (RF-2.4, RF-2.5): avances con evidencia y productos de investigacion
 * (articulos, ponencias y patentes registrados como logros del proyecto).
 */
import { html, mount, button, card, cargar, estadoBadge, evidenceChip, field, formModal, on, pageHeader } from '../core/ui.js';
import { logrosApi, proyectosApi, tiposLogroApi } from '../core/api.js';
import { formatDate } from '../core/format.js';

// Productos de investigacion permitidos en un proyecto.
const TIPOS_PRODUCTO = ['Artículo', 'Ponencia', 'Patente'];

export default function iniciar({ root, params }) {
  const id = params.id;
  let proyecto;

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({
          title: proyecto.nombre,
          description: `${proyecto.semillero} · Iniciado el ${formatDate(proyecto.fechaInicio)}`,
          actions: html`${estadoBadge(proyecto.estado)}
            ${button({ variant: 'secondary', children: 'Ver semillero', 'data-ir': `/app/semilleros/${proyecto.idSemillero}` })}
            ${proyecto.puedeGestionar
              ? html`${button({ icon: 'add-line', children: 'Publicar avance', 'data-action': 'avance' })}
                  ${button({ variant: 'secondary', icon: 'add-line', children: 'Registrar producto', 'data-action': 'producto' })}`
              : ''}`,
        })}
        <p class="mb-6 max-w-3xl text-ink-soft">${proyecto.descripcion}</p>
        <div class="grid gap-6 lg:grid-cols-2">
          ${card({ title: 'Avances del proyecto' },
            proyecto.avances.length === 0
              ? html`<p class="text-ink-soft">Aún no se han publicado avances.</p>`
              : html`<ol class="space-y-5 border-l border-line pl-5">${proyecto.avances.map(
                  (a) => html`<li class="relative">
                    <span class="absolute top-1.5 -left-[1.7rem] size-2.5 rounded-full bg-accent" aria-hidden="true"></span>
                    <p>${a.descripcion}</p>
                    <p class="mt-1 text-sm text-ink-soft">${a.autor} · ${formatDate(a.fecha)}</p>
                    ${a.evidencia ? html`<div class="mt-2">${evidenceChip(a.evidencia)}</div>` : ''}
                  </li>`,
                )}</ol>`)}
          ${card({ title: 'Productos de investigación' },
            proyecto.productos.length === 0
              ? html`<p class="text-ink-soft">Aún no hay productos registrados.</p>`
              : html`<ul class="divide-y divide-line/60">${proyecto.productos.map(
                  (p) => html`<li class="flex flex-wrap items-center gap-3 py-3">
                    <i class="ri-file-text-line shrink-0 text-ink-soft" style="font-size:20px;line-height:1" aria-hidden="true"></i>
                    <div class="min-w-0 grow"><p class="font-medium">${p.titulo}</p><p class="text-sm text-ink-soft">${p.tipo} · ${formatDate(p.fechaRegistro)}</p></div>
                    ${estadoBadge(p.estado)}${evidenceChip(p.evidencia)}
                  </li>`,
                )}</ul>`)}
        </div>`,
    );
  };

  const recargar = () =>
    cargar(root, () => proyectosApi.obtener(id), (datos) => {
      proyecto = datos;
      dibujar();
    });

  on(root, 'click', '[data-ir]', (boton) => window.location.assign(boton.dataset.ir));

  on(root, 'click', '[data-action="avance"]', () =>
    formModal({
      title: 'Publicar avance',
      submitLabel: 'Publicar',
      body: html`${field({ label: '¿Qué se avanzó?', name: 'descripcion', type: 'textarea', required: true })}
        ${field({ label: 'Evidencia (opcional)', name: 'evidencia', type: 'file' })}`,
      onSubmit: async (values) => {
        await proyectosApi.publicarAvance(id, values);
        recargar();
        return true;
      },
    }),
  );

  on(root, 'click', '[data-action="producto"]', async () => {
    const tipos = (await tiposLogroApi.listar()).filter((t) => TIPOS_PRODUCTO.includes(t.nombre));
    formModal({
      title: 'Registrar producto de investigación',
      submitLabel: 'Registrar',
      body: html`${field({ label: 'Tipo de producto', name: 'idTipoLogro', type: 'select', options: tipos.map((t) => ({ value: t.id, label: t.nombre })), required: true })}
        ${field({ label: 'Título', name: 'titulo', required: true })}
        ${field({ label: 'Evidencia', name: 'evidencia', type: 'file', hint: 'El producto se enviará a validación del administrador.', required: true })}`,
      onSubmit: async (values) => {
        await logrosApi.registrar({ ...values, idSemillero: proyecto.idSemillero, idProyecto: proyecto.id });
        recargar();
        return true;
      },
    });
  });

  recargar();
}
