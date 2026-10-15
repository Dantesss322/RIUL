/** Lee un <form> como objeto plano. Los archivos llegan como File. */
export const formValues = (form) => Object.fromEntries(new FormData(form));

/**
 * Arma el cuerpo multipart para endpoints que reciben evidencias.
 * Omite valores vacíos y archivos sin seleccionar.
 */
export function toFormData(values) {
  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    const empty = value == null || value === '' || (value instanceof File && value.size === 0);
    if (!empty) body.append(key, value);
  });
  return body;
}
