import { useEffect, useRef, useState } from "react";
import { DrawingUtils, FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20]
];

export function useMediaPipe(enabled) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const frameRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [landmarks, setLandmarks] = useState(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    async function setup() {
      try {
        setStatus("loading");
        setError("");

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });

        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        setStatus("running");
        frameRef.current = requestAnimationFrame(predict);
      } catch (setupError) {
        setStatus("error");
        setError(setupError.message || "Impossibile avviare la webcam.");
      }
    }

    function predict() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker || cancelled) {
        return;
      }

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        const drawingUtils = new DrawingUtils(context);
        const results = landmarker.detectForVideo(video, performance.now());
        const hand = results.landmarks?.[0] || null;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (hand) {
          drawingUtils.drawConnectors(
            hand,
            HandLandmarker.HAND_CONNECTIONS || HAND_CONNECTIONS,
            {
              color: "#2dd4bf",
              lineWidth: 4
            }
          );
          drawingUtils.drawLandmarks(hand, {
            color: "#f97316",
            radius: 4
          });
        }

        setLandmarks(hand);
      }

      frameRef.current = requestAnimationFrame(predict);
    }

    setup();

    return () => {
      cancelled = true;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setLandmarks(null);
      setStatus("idle");
    };
  }, [enabled]);

  return { videoRef, canvasRef, status, error, landmarks };
}
