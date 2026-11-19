// Descripciones para la tabla comparativa
const DESCRIPCIONES = {
  'FCFS': 'Atiende en estricto orden de llegada',
  'SSTF': 'El más cercano a la posición actual',
  'SCAN': 'Ascensor: va hasta el final (0 o Max) y rebota',
  'LOOK': 'Ascensor optimizado: frena en la última petición',
  'C-SCAN': 'Circular SCAN: atiende solo en una dirección',
  'C-LOOK': 'Circular LOOK: salta a la última petición sin llegar a los extremos'
};

// Obtener referencias del DOM
const elAlgoritmo = document.getElementById('algoritmo');
const elInicio = document.getElementById('inicio');
const elDireccion = document.getElementById('direccion');
const elTotalCilindros = document.getElementById('totalCilindros');
const elCola = document.getElementById('cola');
const canvas = document.getElementById('canvasTrayectoria');
const ctx = canvas.getContext('2d');

// 1. Lógica de los 6 algoritmos de planificación
function calcularRuta(algoritmo, cola, inicio, direccion, maxCil) {
  const maxPos = maxCil - 1;
  const peticiones = cola.filter(n => !isNaN(n) && n >= 0 && n <= maxPos);
  let ruta = [inicio];

  if (algoritmo === 'FCFS') {
    ruta = [inicio, ...peticiones];
  } 
  else if (algoritmo === 'SSTF') {
    let pendientes = [...peticiones];
    let actual = inicio;
    while (pendientes.length > 0) {
      let idxCercano = 0;
      let minDist = Math.abs(pendientes[0] - actual);
      for (let i = 1; i < pendientes.length; i++) {
        const dist = Math.abs(pendientes[i] - actual);
        if (dist < minDist) {
          minDist = dist;
          idxCercano = i;
        }
      }
      actual = pendientes[idxCercano];
      ruta.push(actual);
      pendientes.splice(idxCercano, 1);
    }
  } 
  else if (algoritmo === 'SCAN') {
    const menores = peticiones.filter(p => p < inicio).sort((a, b) => b - a);
    const mayores = peticiones.filter(p => p >= inicio).sort((a, b) => a - b);
    if (direccion === 'up') {
      ruta.push(...mayores);
      if (menores.length > 0) {
        if (ruta[ruta.length - 1] !== maxPos) ruta.push(maxPos);
        ruta.push(...menores);
      }
    } else {
      ruta.push(...menores);
      if (mayores.length > 0) {
        if (ruta[ruta.length - 1] !== 0) ruta.push(0);
        ruta.push(...mayores);
      }
    }
  } 
  else if (algoritmo === 'LOOK') {
    const menores = peticiones.filter(p => p < inicio).sort((a, b) => b - a);
    const mayores = peticiones.filter(p => p >= inicio).sort((a, b) => a - b);
    if (direccion === 'up') {
      ruta.push(...mayores, ...menores);
    } else {
      ruta.push(...menores, ...mayores);
    }
  } 
  else if (algoritmo === 'C-SCAN') {
    const menores = peticiones.filter(p => p < inicio).sort((a, b) => a - b);
    const mayores = peticiones.filter(p => p >= inicio).sort((a, b) => a - b);
    if (direccion === 'up') {
      ruta.push(...mayores);
      if (menores.length > 0) {
        if (ruta[ruta.length - 1] !== maxPos) ruta.push(maxPos);
        ruta.push(0);
        ruta.push(...menores);
      }
    } else {
      ruta.push(...menores.reverse());
      if (mayores.length > 0) {
        if (ruta[ruta.length - 1] !== 0) ruta.push(0);
        ruta.push(maxPos);
        ruta.push(...mayores.reverse());
      }
    }
  } 
  else if (algoritmo === 'C-LOOK') {
    const menores = peticiones.filter(p => p < inicio).sort((a, b) => a - b);
    const mayores = peticiones.filter(p => p >= inicio).sort((a, b) => a - b);
    if (direccion === 'up') {
      ruta.push(...mayores, ...menores);
    } else {
      ruta.push(...menores.reverse(), ...mayores.reverse());
    }
  }

  // Calcular distancia total recorrida
  let totalMovimiento = 0;
  for (let i = 1; i < ruta.length; i++) {
    totalMovimiento += Math.abs(ruta[i] - ruta[i - 1]);
  }

  return { ruta, totalMovimiento, cantidadPeticiones: peticiones.length };
}

// 2. Dibujar la trayectoria en Canvas
function dibujarGrafica(ruta, maxCil) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (ruta.length === 0) return;

  const padX = 50;
  const padY = 40;
  const anchoUtil = canvas.width - padX * 2;
  const altoUtil = canvas.height - padY * 2;
  const maxPos = Math.max(1, maxCil - 1);

  // Líneas guía verticales de fondo
  ctx.strokeStyle = '#111b2e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = padX + (i / 10) * anchoUtil;
    ctx.beginPath();
    ctx.moveTo(x, padY - 15);
    ctx.lineTo(x, canvas.height - 15);
    ctx.stroke();
  }

  // Calcular coordenadas (x, y) de cada paso
  const puntos = ruta.map((cilindro, idx) => {
    const x = padX + (cilindro / maxPos) * anchoUtil;
    const pasoY = ruta.length > 1 ? (idx / (ruta.length - 1)) * altoUtil : altoUtil / 2;
    const y = padY + pasoY;
    return { x, y, cilindro };
  });

  // Dibujar líneas de trayectoria
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  puntos.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Dibujar nodos y etiquetas numéricas
  puntos.forEach((p, idx) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, idx === 0 ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = idx === 0 ? '#f59e0b' : '#38bdf8';
    ctx.fill();

    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillStyle = idx === 0 ? '#fbbf24' : '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(p.cilindro, p.x, p.y - 10);
  });
}

// 3. Actualizar toda la interfaz
function ejecutarSimulacion() {
  const algoSeleccionado = elAlgoritmo.value;
  const totalCil = parseInt(elTotalCilindros.value) || 200;
  const inicio = Math.min(totalCil - 1, Math.max(0, parseInt(elInicio.value) || 0));
  const direccion = elDireccion.value;
  const cola = elCola.value
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n >= 0 && n < totalCil);

  // Calcular algoritmo seleccionado
  const resultado = calcularRuta(algoSeleccionado, cola, inicio, direccion, totalCil);
  const promedio = resultado.cantidadPeticiones > 0
    ? (resultado.totalMovimiento / resultado.cantidadPeticiones).toFixed(1)
    : '0.0';

  // Actualizar métricas
  document.getElementById('metricTotal').textContent = `${resultado.totalMovimiento} cil.`;
  document.getElementById('metricPromedio').textContent = promedio;

  const elInanicion = document.getElementById('metricInanicion');
  if (algoSeleccionado === 'SSTF') {
    elInanicion.textContent = 'Alto';
    elInanicion.className = 'metric-value text-red';
  } else {
    elInanicion.textContent = 'Bajo';
    elInanicion.className = 'metric-value text-green';
  }

  // Llenar Log Paso a Paso
  const logContainer = document.getElementById('logContainer');
  logContainer.innerHTML = '';
  let acumulado = 0;
  for (let i = 1; i < resultado.ruta.length; i++) {
    const desde = resultado.ruta[i - 1];
    const hasta = resultado.ruta[i];
    const salto = Math.abs(hasta - desde);
    acumulado += salto;
    const linea = document.createElement('div');
    linea.textContent = `Paso ${i}: Cabezal pasa de cilindro ${desde} a ${hasta} → Desplazamiento: +${salto} (Acumulado: ${acumulado} cilindros)`;
    logContainer.appendChild(linea);
  }

  // Dibujar Canvas
  dibujarGrafica(resultado.ruta, totalCil);

  // Actualizar Tabla Comparativa
  const algoritmos = ['FCFS', 'SSTF', 'SCAN', 'LOOK', 'C-SCAN', 'C-LOOK'];
  const comparativas = algoritmos.map(alg => {
    const res = calcularRuta(alg, cola, inicio, direccion, totalCil);
    return { alg, total: res.totalMovimiento, cant: res.cantidadPeticiones };
  });

  const minCilindros = Math.min(...comparativas.map(c => c.total));
  const tbody = document.getElementById('tablaComparativa');
  tbody.innerHTML = '';

  comparativas.forEach(item => {
    const esMejor = item.total === minCilindros;
    const prom = item.cant > 0 ? (item.total / item.cant).toFixed(1) : '0.0';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.alg}</strong></td>
      <td class="${esMejor ? 'text-green' : ''}"><strong>${item.total} cilindros</strong></td>
      <td>${prom} cil./req</td>
      <td>${DESCRIPCIONES[item.alg]}</td>
      <td>${esMejor
        ? '<span class="badge-best">🏆 MENOR MOVIMIENTO</span>'
        : '<span class="badge-std">Estándar</span>'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Eventos de botones e inputs
document.getElementById('btnClasico').addEventListener('click', () => {
  elTotalCilindros.value = 200;
  elInicio.value = 53;
  elDireccion.value = 'up';
  elCola.value = '98, 183, 37, 122, 14, 124, 65, 67';
  ejecutarSimulacion();
});

document.getElementById('btnAleatorio').addEventListener('click', () => {
  const max = parseInt(elTotalCilindros.value) || 200;
  const aleatorios = Array.from({ length: 8 }, () => Math.floor(Math.random() * max));
  elInicio.value = Math.floor(Math.random() * max);
  elCola.value = aleatorios.join(', ');
  ejecutarSimulacion();
});

[elAlgoritmo, elInicio, elDireccion, elTotalCilindros, elCola].forEach(el => {
  el.addEventListener('input', ejecutarSimulacion);
});

// Ejecución inicial al cargar la página
ejecutarSimulacion();