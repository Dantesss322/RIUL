/**
 * Sesion del usuario: { token, user }.
 * Vive en localStorage para sobrevivir a recargas y se lee desde cualquier modulo.
 */
const KEY = 'riul.session';

const restaurar = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

let actual = restaurar();

const guardar = (valor) => {
  actual = valor;
  try {
    if (valor) localStorage.setItem(KEY, JSON.stringify(valor));
    else localStorage.removeItem(KEY);
  } catch {
    // El almacenamiento puede estar bloqueado (modo privado): la sesion sigue en memoria.
  }
};

export const session = {
  get: () => actual,
  user: () => actual?.user ?? null,
  set: guardar,
  clear: () => guardar(null),
};
