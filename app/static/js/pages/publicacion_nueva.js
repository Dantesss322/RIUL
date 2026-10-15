/**
 * Crear publicacion (RF-3.1, RNF-3): crear -> evidencia -> categoria -> publicar (4 pasos).
 * Los campos de cada paso los escribe templates/publicacion_nueva.html; aqui se valida y se envia.
 */
import { mount, evidenceChip, intentar } from '../core/ui.js';
import { enlazar, iniciarAsistente, llenarSelect } from '../core/dom.js';
import { publicacionesApi, semillerosApi } from '../core/api.js';

export default async function iniciar({ root }) {
  const semilleros = (await intentar(() => semillerosApi.listar({ mios: true }))) ?? [];
  llenarSelect(root.querySelector('select[name="idSemillero"]'), semilleros.map((s) => ({ value: s.id, label: s.nombre })));

  iniciarAsistente(root.querySelector('[data-wizard]'), {
    // Un validador por paso (en orden): Crear, Evidencia, Categoria y Publicar.
    validar: [
      ({ contenido }) => contenido.trim().length >= 10,
      null,
      ({ categoria, idSemillero }) => Boolean(categoria && idSemillero),
    ],
    // Resumen del ultimo paso.
    alMostrar: ({ categoria, contenido, evidencia }) => {
      enlazar(root, { categoria, contenido });
      mount(root.querySelector('[data-region="evidencia"]'), evidencia ? evidenceChip({ nombre: evidencia.name }) : '');
    },
    alEnviar: async (values) => {
      await intentar(async () => {
        await publicacionesApi.crear(values);
        window.location.assign('/app/publicaciones');
      });
    },
  });
}
