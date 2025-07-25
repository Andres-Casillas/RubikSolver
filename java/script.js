let video = document.getElementById("videoInput");
let canvas = document.getElementById("canvasOutput");
let ctx = canvas.getContext("2d");
let streaming = false;
let src;
let cap;
let cubo = [];
let colorGrid = Array.from({ length: 3 }, () => Array(3).fill('ninguno'));

function rotarMatriz(matriz, direccion) {
  if (direccion === "horario") {
    const transpuesta = matriz[0].map((_, i) => matriz.map(fila => fila[i]));
    const rotada = transpuesta.map(fila => fila.reverse());
    return rotada;
  }

  if (direccion === "antihorario") {
    const transpuesta = matriz[0].map((_, i) => matriz.map(fila => fila[i]));
    const rotada = transpuesta.reverse();
    return rotada;
  }

  if (direccion === "espejo") {
    const rotada = matriz.map(fila => fila.slice().reverse());
    return rotada;
  }

  if (direccion === "invertida") {
    const rotada = matriz.slice().reverse();
    return rotada;
  }

  return matriz;
}

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

document.getElementById("guardar").addEventListener("click", () => {
  const copia = colorGrid.map(fila => [...fila]);
  console.log(copia);

  cubo.push(copia);

  if (cubo.length === 6) {
    console.log("Cubo completo:", cubo);
    alert("Cubo completo.");
    cubo[5] = rotarMatriz(cubo[5], "antihorario");
    cubo[5] = rotarMatriz(cubo[5], "antihorario");
    cubo[4] = rotarMatriz(cubo[4], "antihorario");
    cubo[4] = rotarMatriz(cubo[4], "antihorario");
    cubo[3] = rotarMatriz(cubo[3], "invertida");

    fetch('http://localhost:5000/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ matriz: cubo })
    })
      .then(response => response.json())
      .then(data => {
        console.log('Respuesta del servidor:', data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
});