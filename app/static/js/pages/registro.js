/**
 * Solicitud de registro (RF-1.1, RF-1.3, RF-1.4).
 * La persona define su contrasena al solicitar; la cuenta queda pendiente hasta que un administrador
 * la apruebe. Sin correo institucional se pide una justificacion.
 */
import { html, mount, authPanel, button, field, linkButton, withLoading, intentar } from '../core/ui.js';
import { authApi, crud } from '../core/api.js';
import { formValues } from '../core/form.js';
import { notify } from '../core/notify.js';
import { session } from '../core/session.js';

const DOMINIO = '@unilibre.edu.co';

function solicitudEnviada(root) {
  mount(
    root,
    authPanel(html`<div class="text-center">
      <span class="text-success"><i class="ri-checkbox-circle-line" style="font-size:48px;line-height:1" aria-hidden="true"></i></span>
      <h1 class="mt-4 text-3xl font-semibold tracking-tight">Solicitud enviada</h1>
      <p class="mt-2 text-ink-soft">
        Estado de la solicitud: <strong class="text-ink">pendiente de revisión</strong>. Un administrador
        validará tu información y podrás iniciar sesión cuando tu cuenta sea aprobada.
      </p>
      <div class="mt-6">${linkButton({ href: '/login', size: 'lg', children: 'Ir a iniciar sesión' })}</div>
    </div>`),
  );
}

export default async function iniciar({ root }) {
  if (session.get()) {
    window.location.replace('/app');
    return;
  }

  const programas = (await intentar(() => crud('programas').listar())) ?? [];
  const opciones = programas.map((p) => ({ value: p.id, label: p.nombre }));

  mount(
    root,
    authPanel(
      html`<h1 class="text-3xl font-semibold tracking-tight">Solicitar registro</h1>
        <p class="mt-1 mb-4 text-ink-soft">Crea tu cuenta; un administrador la aprobará antes de que ingreses.</p>
        <form class="grid gap-3 sm:grid-cols-2" data-form="registro" novalidate>
          ${field({ label: 'Nombre completo', name: 'nombre', icon: 'user-3-line', autocomplete: 'name', required: true })}
          ${field({ label: 'Programa académico', name: 'idPrograma', type: 'select', icon: 'graduation-cap-line', options: opciones, required: true })}
          ${field({ label: 'Correo electrónico', name: 'correo', type: 'email', icon: 'mail-line', placeholder: `nombre${DOMINIO}`, autocomplete: 'email', className: 'sm:col-span-2', required: true })}
          <p id="pista-correo" class="-mt-2 text-sm text-ink-soft sm:col-span-2" hidden></p>
          ${field({ label: 'Contraseña', name: 'password', type: 'password', icon: 'lock-line', minlength: 8, autocomplete: 'new-password', placeholder: 'Mínimo 8 caracteres', required: true })}
          ${field({ label: 'Confirmar contraseña', name: 'confirmar', type: 'password', icon: 'lock-line', minlength: 8, autocomplete: 'new-password', required: true })}
          <div id="bloque-justificacion" class="sm:col-span-2" hidden>
            ${field({ label: 'Justificación de la solicitud', name: 'justificacion', type: 'textarea', rows: 2, placeholder: 'Explica por qué necesitas acceso a la plataforma.' })}
          </div>
          ${button({ type: 'submit', size: 'lg', className: 'w-full sm:col-span-2', icon: 'arrow-right-line', children: 'Enviar solicitud' })}
        </form>
        <p class="mt-5 text-center text-[15px] text-ink-soft">¿Ya tienes cuenta? <a href="/login" class="font-medium text-accent hover:underline">Inicia sesión</a></p>`,
      { wide: true },
    ),
  );

  const formulario = root.querySelector('[data-form="registro"]');
  const pista = root.querySelector('#pista-correo');
  const bloque = root.querySelector('#bloque-justificacion');
  const justificacion = bloque.querySelector('textarea');

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
    if (enviada) solicitudEnviada(root);
  });
}
