/**
 * Exportación de indicadores a CSV (abre directamente en Excel).
 * Se antepone el BOM UTF-8 para que las tildes se vean correctamente.
 */
const BOM = String.fromCharCode(0xfeff);
const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

/** Descarga un CSV a partir de filas [sección, indicador, valor]. */
export function descargarCsv(nombre, filas) {
  const contenido = [['Sección', 'Indicador', 'Valor'], ...filas].map((fila) => fila.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = Object.assign(document.createElement('a'), { href: url, download: `${nombre}.csv` });
  enlace.click();
  URL.revokeObjectURL(url);
}
