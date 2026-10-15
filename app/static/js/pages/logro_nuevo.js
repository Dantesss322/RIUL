/**
 * Registrar logro (RF-4.1, RNF-3): tipo -> evidencia -> detalles -> confirmacion (4 pasos).
 * Los campos de cada paso los escribe templates/logro_nuevo.html; aqui se cargan las opciones,
 * se valida y se envia.
 */
import { mount, evidenceChip, intentar } from '../core/ui.js';
import { enlazar, iniciarAsistente, llenarSelect } from '../core/dom.js';
import { logrosApi, semillerosApi, tiposLogroApi } from '../core/api.js';

export default async function iniciar({ root }) {
  const [tiposLogro, semillerosPropios] = await Promise.all([
    intentar(() => tiposLogroApi.listar()),
    intentar(() => semillerosApi.listar({ mios: true })),
  ]);
  const selectTipo = root.querySelector('select[name="idTipoLogro"]');
  const selectSemillero = root.querySelector('select[name="idSemillero"]');

  llenarSelect(selectTipo, (tiposLogro ?? []).map((t) => ({ value: t.id, label: `${t.nombre} · ${t.xp} XP` })));
  llenarSelect(selectSemillero, (semillerosPropios ?? []).map((s) => ({ value: s.id, label: s.nombre })));

  const etiqueta = (select) => select.selectedOptions[0]?.textContent ?? '';

  iniciarAsistente(root.querySelector('[data-wizard]'), {
    // Un validador por paso (en orden): Tipo, Evidencia, Detalles y Confirmar.
    validar: [
      ({ idTipoLogro }) => Boolean(idTipoLogro),
      ({ evidencia }) => Boolean(evidencia),
      ({ titulo, idSemillero }) => Boolean(titulo.trim() && idSemillero),
    ],
    // Resumen del ultimo paso.
    alMostrar: ({ titulo, evidencia }) => {
      enlazar(root, { tipo: etiqueta(selectTipo), semillero: etiqueta(selectSemillero), titulo });
      mount(root.querySelector('[data-region="evidencia"]'), evidencia ? evidenceChip({ nombre: evidencia.name }) : '');
    },
    alEnviar: async (values) => {
      await intentar(async () => {
        await logrosApi.registrar(values);
        window.location.assign('/app/logros');
      });
    },
  });
}
