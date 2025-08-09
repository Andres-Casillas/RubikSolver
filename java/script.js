import { rotarMatriz } from './utils.js';
import { conexionPython } from './utils.js';

let video = document.getElementById("videoInput");
let canvas = document.getElementById("canvasOutput");
let ctx = canvas.getContext("2d");
let streaming = false;
let src;
let cap;
let matriz = Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill('N'))
);
let colorGrid = Array.from({ length: 3 }, () => Array(3).fill('N'));
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

  const colorRanges = {
    R: [[0, 120, 70], [10, 255, 255], [170, 120, 70], [180, 255, 255]],
    G: [[36, 100, 100], [86, 255, 255]],
    B: [[94, 80, 2], [126, 255, 255]],
    Y: [[20, 50, 150], [35, 255, 255]],
    O: [[10, 100, 20], [25, 255, 255]],
    W: [[0, 0, 130], [180, 60, 255]]
  };

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

        let roi = hsv.roi(new cv.Rect(x1, y1, cellWidth, cellHeight));

        let maxColor = 'N';
        let maxPixels = 0;

        for (let colorName in colorRanges) {
          let ranges = colorRanges[colorName];
          let totalMask = new cv.Mat();
          for (let i = 0; i < ranges.length; i += 2) {
            let lower = new cv.Mat(roi.rows, roi.cols, roi.type(), new cv.Scalar(...ranges[i], 0));
            let upper = new cv.Mat(roi.rows, roi.cols, roi.type(), new cv.Scalar(...ranges[i + 1], 0));

            cv.inRange(roi, lower, upper, mask);
            let kernel = cv.Mat.ones(3, 3, cv.CV_8U);             //
            cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);   //  ELIMINAR RUIDO
            cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);  //
            kernel.delete();                                      //
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
        let porcentaje = maxPixels / totalPixels;
        if (porcentaje < DETECCION_UMBRAL) {
          maxColor = 'N';
        }
        colorGrid[row][col] = maxColor;

        let color = drawColors[maxColor];
        cv.rectangle(src, new cv.Point(x1, y1), new cv.Point(x2, y2), new cv.Scalar(...color, 255), 5);
        roi.delete();
      }
    }

    cv.imshow("canvasOutput", src);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

document.getElementById("siguiente").addEventListener("click", () => {
  const copia = colorGrid.map(fila => [...fila]);
  console.log(copia);

  matriz[caraActual] = copia;

  if (caraActual < 5) {
        caraActual++;
    } else { caraActual = 0; }
  actualizarCara();

  const existe = matriz.some(bloque => bloque.some(fila => fila.includes('N')));
  if (!existe) {
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

      cubo[0] = rotarMatriz(cubo[0], "horario");
      cubo[2] = rotarMatriz(cubo[2], "antihorario");
      cubo[3] = rotarMatriz(cubo[3], "espejo");

      conexionPython(cubo);
    });
  }
});

function actualizarCara() {
    switch (caraActual) {
        case 0:
            document.getElementById('cara').innerText = 'Cara Frontal';
            break;
        case 1:
            document.getElementById('cara').innerText = 'Cara Derecha';
            break;
        case 2:
            document.getElementById('cara').innerText = 'Cara Posterior';
            break;
        case 3:
            document.getElementById('cara').innerText = 'Cara Izquierda';
            break;
        case 4:
            document.getElementById('cara').innerText = 'Cara Superior';
            break;
        case 5:
            document.getElementById('cara').innerText = 'Cara Inferior';
            break;
    }
}

window.onOpenCvReady = onOpenCvReady;
actualizarCara();