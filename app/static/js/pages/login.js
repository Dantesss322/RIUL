/**
 * Ingreso (RF-1.2): correo institucional y contrasena.
 * Una cuenta no aprobada recibe una advertencia (no un error): lo decide el servidor con un 403
 * y el cliente HTTP lo muestra como advertencia. El formulario lo escribe templates/login.html.
 */
import { withLoading, intentar } from '../core/ui.js';
import { authApi } from '../core/api.js';
import { formValues } from '../core/form.js';
import { session } from '../core/session.js';
import { usarSimulacion } from '../core/http.js';

export default async function iniciar({ root }) {
  if (session.get()) {
    window.location.replace('/app');
    return;
  }

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
