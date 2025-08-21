import { rotarMatriz } from './utils.js';
import { conexionPython } from './utils.js';

let video = document.getElementById("videoInput");
let canvas = document.getElementById("canvasOutput");
let ctx = canvas.getContext("2d");
let streaming = false;
let src;
let cap;

// Matriz global (6 caras × 3×3), inicia en gris 'N'
let matriz = Array.from({ length: 6 }, () =>
  Array.from({ length: 3 }, () => Array(3).fill('N'))
);

// Grid de la cara actual (3×3) detectada en tiempo real
let colorGrid = Array.from({ length: 3 }, () => Array(3).fill('N'));

// Estado lineal (9 celdas) de la cara actual (depuración)
let estadoCuboActual = Array(9).fill('N');

let caraActual = 0;

function onOpenCvReady() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function (stream) {
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        video.play();
        streaming = true;

        video.width = video.videoWidth;
        video.height = video.videoHeight;

        src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap = new cv.VideoCapture(video);

        processVideo();
      });
    })
    .catch(function (err) {
      console.error("Error al acceder a la cámara: " + err);
    });
}

function processVideo() {
  if (!streaming) return;

  let hsv = new cv.Mat();
  let mask = new cv.Mat();

  // Puedes bajar a 0.15 si tu luz es más baja
  const DETECCION_UMBRAL = 0.20;

  const drawColors = {
    R: [255, 0, 0],
    G: [0, 255, 0],
    B: [0, 0, 255],
    Y: [255, 255, 0],
    O: [255, 120, 0],
    W: [255, 255, 255],
    N: [50, 50, 50]
  };

  // Rango HSV (OpenCV: H:0..180, S:0..255, V:0..255)
  const colorRanges = {
    R: [[0, 120, 70], [10, 255, 255], [170, 120, 70], [180, 255, 255]],
    G: [[36, 100, 100], [86, 255, 255]],
    B: [[94, 80, 2], [126, 255, 255]],
    Y: [[20, 50, 150], [35, 255, 255]],
    O: [[10, 100, 20], [25, 255, 255]],
    W: [[0, 0, 130], [180, 60, 255]]
  };

  // Clasificador HSV de respaldo
  function hsvToLabel(h, s, v) {
    if (v >= 200 && s <= 40) return 'W';
    const H = h;
    if (H < 6 || H >= 170) return 'R';
    if (H < 20) return 'O';
    if (H < 33) return 'Y';
    if (H < 85) return 'G';
    if (H < 140) return 'B';
    return 'R';
  }

  const boxSize = 200;
  const gridRows = 3;
  const gridCols = 3;
  const cellMargin = 10;

  function draw() {
    cap.read(src);

    let blurred = new cv.Mat();
    cv.GaussianBlur(src, blurred, new cv.Size(5, 5), 0);
    cv.cvtColor(blurred, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    blurred.delete();

    let cx = src.cols / 2;
    let cy = src.rows / 2;
    let gridLeft = cx - boxSize / 2;
    let gridTop = cy - boxSize / 2;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        let x1 = Math.floor(gridLeft + cellMargin + col * ((boxSize - (gridCols + 1) * cellMargin) / gridCols + cellMargin));
        let y1 = Math.floor(gridTop + cellMargin + row * ((boxSize - (gridRows + 1) * cellMargin) / gridRows + cellMargin));
        let cellWidth = Math.floor((boxSize - (gridCols + 1) * cellMargin) / gridCols);
        let cellHeight = Math.floor((boxSize - (gridRows + 1) * cellMargin) / gridRows);
        let x2 = x1 + cellWidth;
        let y2 = y1 + cellHeight;

        if (x1 < 0 || y1 < 0 || x2 > src.cols || y2 > src.rows) continue;

        // ROI principal para detección por máscara
        let roi = hsv.roi(new cv.Rect(x1, y1, cellWidth, cellHeight));

        // ROI central para media HSV (evita bordes)
        const innerX = x1 + Math.floor(cellWidth * 0.2);
        const innerY = y1 + Math.floor(cellHeight * 0.2);
        const innerW = Math.max(2, Math.floor(cellWidth * 0.6));
        const innerH = Math.max(2, Math.floor(cellHeight * 0.6));
        const roiMean = hsv.roi(new cv.Rect(innerX, innerY, innerW, innerH));
        const mean = cv.mean(roiMean); // [H,S,V,A]
        roiMean.delete();

        let maxColor = 'N';
        let maxPixels = 0;

        // Detección por conteo de píxeles dentro de rangos
        for (let colorName in colorRanges) {
          let ranges = colorRanges[colorName];
          let totalMask = new cv.Mat();
          for (let i = 0; i < ranges.length; i += 2) {
            let lower = new cv.Mat(roi.rows, roi.cols, roi.type(), new cv.Scalar(...ranges[i], 0));
            let upper = new cv.Mat(roi.rows, roi.cols, roi.type(), new cv.Scalar(...ranges[i + 1], 0));

            cv.inRange(roi, lower, upper, mask);

            // Suaviza ruido
            let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
            cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
            cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
            kernel.delete();

            if (i === 0) {
              totalMask = mask.clone();
            } else {
              cv.bitwise_or(totalMask, mask, totalMask);
            }
            lower.delete(); upper.delete();
          }

          let count = cv.countNonZero(totalMask);
          if (count > maxPixels) {
            maxPixels = count;
            maxColor = colorName;
          }
          totalMask.delete();
        }

        let totalPixels = roi.rows * roi.cols;
        let porcentaje = totalPixels > 0 ? (maxPixels / totalPixels) : 0;

        // Fallback: si el porcentaje no supera el umbral, o es ambiguo (<0.30), usamos el clasificador HSV central
        if (porcentaje < DETECCION_UMBRAL || porcentaje < 0.30) {
          const h = mean[0], s = mean[1], v = mean[2];
          maxColor = hsvToLabel(h, s, v);
        }

        colorGrid[row][col] = maxColor || 'R';
        estadoCuboActual[row * 3 + col] = colorGrid[row][col];

        let c = drawColors[colorGrid[row][col]] || drawColors.N;
        cv.rectangle(src, new cv.Point(x1, y1), new cv.Point(x2, y2), new cv.Scalar(...c, 255), 5);

        roi.delete();
      }
    }

    cv.imshow("canvasOutput", src);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

// Convierte a [U,F,D,B,L,R]
function buildMatrix3DFromMatriz(m) {
  return [
    m[4], // U
    m[0], // F
    m[5], // D
    m[2], // B
    m[3], // L
    m[1], // R
  ];
}

// Sanea una cara: reemplaza 'N' por el color más frecuente de la cara
function sanitizeFace(face3x3) {
  const flat = face3x3.flat();
  const counts = {};
  for (const v of flat) { if (v !== 'N') counts[v] = (counts[v] || 0) + 1; }
  // Si todo fue 'N', usa 'W' como backup neutro (se puede cambiar por el centro)
  const mode = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'W';
  return face3x3.map(row => row.map(v => v === 'N' ? mode : v));
}

// Aplica al 3D embebido; si no está lista la API, usa localStorage
function actualizarModelo3D(matrix3D) {
  try {
    if (window && typeof window.applyMatrixTo3D === 'function') {
      window.applyMatrixTo3D(matrix3D);
    } else {
      localStorage.setItem('rubik.manualMatrix3D', JSON.stringify(matrix3D));
    }
  } catch (e) {
    console.warn('No se pudo aplicar la matriz al 3D:', e);
  }
}

// Depuración: cuenta 'N' en la matriz [U,F,D,B,L,R]
function logHuecos(matrix3D, tag='') {
  const faces = ['U','F','D','B','L','R'];
  const stats = faces.map((f,i)=>({ f, n: matrix3D[i].flat().filter(x=>x==='N').length }));
  const total = stats.reduce((s,a)=>s+a.n,0);
  console.log(`🔎 Huecos(N)${tag? ' '+tag:''}:`, stats, 'total=', total);
  return total;
}

// Guardar la cara actual detectada y reflejarla en el 3D (nunca enviamos 'N')
document.getElementById("guardarCara").addEventListener("click", () => {
  let copia = colorGrid.map(fila => [...fila]);
  // BLINDAJE: nunca 'N'
  if (copia.flat().includes('N')) {
    copia = sanitizeFace(copia);
  }
  matriz[caraActual] = copia;

  const matrix3D = buildMatrix3DFromMatriz(matriz);
  logHuecos(matrix3D, '(post-guardarCara)');
  actualizarModelo3D(matrix3D);

  console.log(`📸 Cara ${caraActual} guardada al 3D:`, copia);
});

document.getElementById("siguiente").addEventListener("click", () => {
  let copia = colorGrid.map(fila => [...fila]);
  if (copia.flat().includes('N')) {
    copia = sanitizeFace(copia);
  }
  matriz[caraActual] = copia;

  if (caraActual < 5) {
    caraActual++;
  } else {
    caraActual = 0;
  }
  actualizarCara();

  const matrix3D = buildMatrix3DFromMatriz(matriz);
  logHuecos(matrix3D, '(post-siguiente)');
  actualizarModelo3D(matrix3D);

  const existeN = matriz.some(bloque => bloque.some(fila => fila.includes('N')));
  if (!existeN) {
    alert("Cubo completo.");
    document.getElementById('guardar').classList.remove('deshabilitado');
    document.getElementById('guardar').addEventListener('click', () => {
      const cubo = [];
      cubo[0] = matriz[4];
      cubo[1] = matriz[0];
      cubo[2] = matriz[5];
      cubo[3] = matriz[2];
      cubo[4] = matriz[3];
      cubo[5] = matriz[1];

      // Rotaciones para el solver
      cubo[0] = rotarMatriz(cubo[0], "horario");
      cubo[2] = rotarMatriz(cubo[2], "antihorario");
      cubo[3] = rotarMatriz(cubo[3], "espejo");

      conexionPython(cubo);
    });
  }
});

function actualizarCara() {
  switch (caraActual) {
    case 0: document.getElementById('cara').innerText = 'Cara Frontal'; break;
    case 1: document.getElementById('cara').innerText = 'Cara Derecha'; break;
    case 2: document.getElementById('cara').innerText = 'Cara Posterior'; break;
    case 3: document.getElementById('cara').innerText = 'Cara Izquierda'; break;
    case 4: document.getElementById('cara').innerText = 'Cara Superior'; break;
    case 5: document.getElementById('cara').innerText = 'Cara Inferior'; break;
  }
}

window.onOpenCvReady = onOpenCvReady;
actualizarCara();