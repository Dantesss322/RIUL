/**
 * Punto de entrada del navegador. Todas las paginas (plantillas) cargan este archivo.
 *
 * Lee del <body> el area (public | auth | app) y la pagina (data-page), prepara el marco de la
 * aplicacion si hace falta y ejecuta el modulo js/pages/<pagina>.js.
 */
import { initGlobalBehaviors } from './core/ui.js';
import { session } from './core/session.js';

initGlobalBehaviors();

const { area, page } = document.body.dataset;
const contexto = {
  root: document.getElementById('page'),
  params: { id: document.body.dataset.id, tipo: document.body.dataset.tipo },
  user: session.user(),
};

if (area === 'public') {
  // La cabecera publica muestra "Ir a mi panel" cuando ya hay sesion.
  const conSesion = Boolean(session.get());
  document.getElementById('auth-guest').hidden = conSesion;
  document.getElementById('auth-user').hidden = !conSesion;
}

if (area === 'app') {
  const { iniciarShell } = await import('./core/shell.js');
  contexto.user = iniciarShell();
}

// Sin usuario en el area privada, el marco ya redirigio al ingreso o al inicio.
if (page && (area !== 'app' || contexto.user)) {
  const modulo = await import(`./pages/${page}.js`);
  await modulo.default(contexto);
}
