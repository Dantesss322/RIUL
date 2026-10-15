/**
 * Solicitud de registro (RF-1.1, RF-1.3, RF-1.4).
 * La persona define su contrasena al solicitar; la cuenta queda pendiente hasta que un administrador
 * la apruebe. Sin correo institucional se pide una justificacion. El formulario y el mensaje de
 * "solicitud enviada" los escribe templates/registro.html.
 */
import { withLoading, intentar } from '../core/ui.js';
import { llenarSelect } from '../core/dom.js';
import { authApi, crud } from '../core/api.js';
import { formValues } from '../core/form.js';
import { notify } from '../core/notify.js';
import { session } from '../core/session.js';

const DOMINIO = '@unilibre.edu.co';

export default async function iniciar({ root }) {
  if (session.get()) {
    window.location.replace('/app');
    return;
  }

  const formulario = root.querySelector('[data-form="registro"]');
  const pista = root.querySelector('[data-pista-correo]');
  const bloque = root.querySelector('[data-bloque-justificacion]');
  const justificacion = bloque.querySelector('textarea');

  const programas = (await intentar(() => crud('programas').listar())) ?? [];
  llenarSelect(formulario.elements.idPrograma, programas.map((p) => ({ value: p.id, label: p.nombre })));

  // Sin correo institucional se muestra y exige la justificacion.
  formulario.elements.correo.addEventListener('input', (event) => {
    const correo = event.target.value.trim().toLowerCase();
    const institucional = correo.endsWith(DOMINIO);
    pista.hidden = !correo;
    pista.textContent = institucional ? 'Cuenta institucional detectada.' : 'No es institucional: cuéntanos el motivo abajo.';
    bloque.hidden = !correo || institucional;
    justificacion.required = !bloque.hidden;
  });

  formulario.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { confirmar, ...values } = formValues(formulario);
    if (values.password !== confirmar) {
      notify.warning('Las contraseñas no coinciden. Verifica que sean iguales.');
      return;
    }

    const enviada = await withLoading(formulario.querySelector('[type="submit"]'), () =>
      intentar(async () => {
        await authApi.registrar(values);
        return true;
      }),
    );
    if (enviada) {
      root.querySelector('[data-vista="formulario"]').hidden = true;
      root.querySelector('[data-vista="enviada"]').hidden = false;
    }
  });
}
