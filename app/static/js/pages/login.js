/**
 * Ingreso (RF-1.2): correo institucional y contrasena.
 * Una cuenta no aprobada recibe una advertencia (no un error): lo decide el servidor con un 403
 * y el cliente HTTP lo muestra como advertencia.
 */
import { html, mount, authPanel, button, field, withLoading, intentar } from '../core/ui.js';
import { authApi } from '../core/api.js';
import { formValues } from '../core/form.js';
import { session } from '../core/session.js';
import { usarSimulacion } from '../core/http.js';

/** Cuentas sembradas en js/mock/db.js (solo existen con el backend simulado). */
const CUENTAS_DEMO = [
  { rol: 'Administrador', correo: 'admin@unilibre.edu.co' },
  { rol: 'Docente líder', correo: 'marcela.quintero@unilibre.edu.co' },
  { rol: 'Estudiante', correo: 'camila.rojas@unilibre.edu.co' },
  { rol: 'Cuenta pendiente', correo: 'juliana.prieto@unilibre.edu.co' },
];

export default async function iniciar({ root }) {
  if (session.get()) {
    window.location.replace('/app');
    return;
  }

  const demo = usarSimulacion
    ? html`<div class="mt-5 rounded-2xl border border-dashed border-ink-soft/40 p-4">
        <p class="mb-3 text-center text-sm text-ink-soft">Demostración: entra con un clic</p>
        <div class="grid grid-cols-2 gap-2">${CUENTAS_DEMO.map((c) =>
          button({ variant: 'secondary', size: 'sm', children: c.rol, 'data-demo': c.correo }),
        )}</div>
      </div>`
    : '';

  mount(
    root,
    authPanel(html`
      <h1 class="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
      <p class="mt-1 mb-5 text-ink-soft">Ingresa con tu correo institucional para continuar.</p>
      <form class="space-y-4" data-form="login">
        ${field({ label: 'Correo institucional', name: 'correo', type: 'email', icon: 'mail-line', placeholder: 'nombre@unilibre.edu.co', autocomplete: 'username', required: true })}
        ${field({ label: 'Contraseña', name: 'password', type: 'password', icon: 'lock-line', placeholder: 'Ingresa tu contraseña', autocomplete: 'current-password', required: true })}
        ${button({ type: 'submit', size: 'lg', className: 'w-full', icon: 'arrow-right-line', children: 'Entrar' })}
      </form>
      <p class="mt-5 text-center text-[15px] text-ink-soft">¿Aún no tienes acceso? <a href="/registro" class="font-medium text-accent hover:underline">Solicitar registro</a></p>
      ${demo}`),
  );

  const entrar = (credenciales, boton) =>
    withLoading(boton, () =>
      intentar(async () => {
        const { accessToken, user } = await authApi.login(credenciales);
        session.set({ token: accessToken, user });
        window.location.assign('/app');
      }),
    );

  root.querySelector('[data-form="login"]').addEventListener('submit', (event) => {
    event.preventDefault();
    entrar(formValues(event.currentTarget), event.currentTarget.querySelector('[type="submit"]'));
  });

  if (usarSimulacion) {
    const { DEMO_PASSWORD } = await import('../mock/db.js');
    root.querySelectorAll('[data-demo]').forEach((boton) =>
      boton.addEventListener('click', () => entrar({ correo: boton.dataset.demo, password: DEMO_PASSWORD }, boton)),
    );
  }
}
