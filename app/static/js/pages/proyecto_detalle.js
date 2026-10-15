/**
 * Detalle de un proyecto (RF-2.4, RF-2.5): avances con evidencia y productos de investigacion
 * (articulos, ponencias y patentes registrados como logros del proyecto).
 * El marco y los formularios de los modales los escribe templates/proyecto_detalle.html.
 */
import { html, mount, cargarMarco, estadoBadge, evidenceChip, on } from '../core/ui.js';
import { enlazar, formModal, llenarSelect, modalDe } from '../core/dom.js';
import { logrosApi, proyectosApi, tiposLogroApi } from '../core/api.js';
import { formatDate } from '../core/format.js';

// Productos de investigacion permitidos en un proyecto.
const TIPOS_PRODUCTO = ['Artículo', 'Ponencia', 'Patente'];

export default function iniciar({ root, params }) {
  const id = params.id;
  let proyecto;

  const region = (nombre) => root.querySelector(`[data-region="${nombre}"]`);

  const dibujar = () => {
    enlazar(root, {
      nombre: proyecto.nombre,
      detalle: `${proyecto.semillero} · Iniciado el ${formatDate(proyecto.fechaInicio)}`,
      descripcion: proyecto.descripcion,
    });
    mount(region('estado'), estadoBadge(proyecto.estado));
    root.querySelector('[data-ver-semillero]').href = `/app/semilleros/${proyecto.idSemillero}`;
    root.querySelectorAll('[data-gestor]').forEach((boton) => {
      boton.hidden = !proyecto.puedeGestionar;
    });

    mount(
      region('avances'),
      proyecto.avances.length === 0
        ? html`<p class="text-ink-soft">Aún no se han publicado avances.</p>`
        : html`<ol class="space-y-5 border-l border-line pl-5">${proyecto.avances.map(
            (a) => html`<li class="relative">
              <span class="absolute top-1.5 -left-[1.7rem] size-2.5 rounded-full bg-accent" aria-hidden="true"></span>
              <p>${a.descripcion}</p>
              <p class="mt-1 text-sm text-ink-soft">${a.autor} · ${formatDate(a.fecha)}</p>
              ${a.evidencia ? html`<div class="mt-2">${evidenceChip(a.evidencia)}</div>` : ''}
            </li>`,
          )}</ol>`,
    );

    mount(
      region('productos'),
      proyecto.productos.length === 0
        ? html`<p class="text-ink-soft">Aún no hay productos registrados.</p>`
        : html`<ul class="divide-y divide-line/60">${proyecto.productos.map(
            (p) => html`<li class="flex flex-wrap items-center gap-3 py-3">
              <i class="ri-file-text-line shrink-0 text-ink-soft" style="font-size:20px;line-height:1" aria-hidden="true"></i>
              <div class="min-w-0 grow"><p class="font-medium">${p.titulo}</p><p class="text-sm text-ink-soft">${p.tipo} · ${formatDate(p.fechaRegistro)}</p></div>
              ${estadoBadge(p.estado)}${evidenceChip(p.evidencia)}
            </li>`,
          )}</ul>`,
    );
  };

  const recargar = () =>
    cargarMarco(root.querySelector('[data-carga]'), () => proyectosApi.obtener(id), (datos) => {
      proyecto = datos;
      dibujar();
    });

  on(root, 'click', '[data-action="avance"]', () =>
    formModal(modalDe('avance'), {
      alEnviar: async (values) => {
        await proyectosApi.publicarAvance(id, values);
        recargar();
        return true;
      },
    }),
  );

  on(root, 'click', '[data-action="producto"]', async () => {
    const tipos = (await tiposLogroApi.listar()).filter((t) => TIPOS_PRODUCTO.includes(t.nombre));
    formModal(modalDe('producto'), {
      alAbrir: (form) => llenarSelect(form.elements.idTipoLogro, tipos.map((t) => ({ value: t.id, label: t.nombre }))),
      alEnviar: async (values) => {
        await logrosApi.registrar({ ...values, idSemillero: proyecto.idSemillero, idProyecto: proyecto.id });
        recargar();
        return true;
      },
    });
  });

  recargar();
}
