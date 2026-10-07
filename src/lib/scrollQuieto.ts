/**
 * Espera a que el scroll se detenga (o a que pase `maxEspera`).
 *
 * Es la clave para que el arranque no se note: el trabajo pesado solo ocurre en las pausas,
 * nunca compitiendo con el desplazamiento. El tope evita quedarse esperando para siempre
 * si el usuario no para de moverse.
 */
export function esperarScrollQuieto(quietud = 160, maxEspera = 1200): Promise<void> {
  return new Promise((resolve) => {
    let t = 0;
    const tope = window.setTimeout(fin, maxEspera);
    function fin() {
      window.clearTimeout(t);
      window.clearTimeout(tope);
      window.removeEventListener("scroll", reiniciar);
      resolve();
    }
    function reiniciar() {
      window.clearTimeout(t);
      t = window.setTimeout(fin, quietud);
    }
    window.addEventListener("scroll", reiniciar, { passive: true });
    reiniciar();
  });
}
