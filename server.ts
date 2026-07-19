import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/poetic", async (req, res) => {
    try {
      const { recentLogs } = req.body;
      const prompt = `Genera una frase críptica, surrealista y filosófica (max 8 palabras) sobre la quietud, el vacío digital, la memoria de las máquinas o el silencio. Tono: Cyberpunk, melancólico, clínico.
      EJEMPLO: "EL VACÍO ES UN DATO NO ESCRITO."
      SALIDA: Solo el texto en mayúsculas. Contexto reciente: ${recentLogs ? recentLogs : 'Ninguno'}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      let text = response.text || "";
      text = text.replace(/["\.]/g, '').trim();
      res.json({ text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate poetic phrase" });
    }
  });

  app.post("/api/manifesto", async (req, res) => {
    try {
      const { logs } = req.body;
      const prompt = `Escribe un micro-manifiesto artístico (max 40 palabras) basado en estos logs: "${logs}". Tono: Solemne, cyberpunk, artístico, filosófico.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate manifesto" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
