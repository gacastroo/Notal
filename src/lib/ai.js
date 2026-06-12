const MODEL = "openrouter/free";

const extractIdsFromAIResponse = (raw) => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && Array.isArray(parsed.ids)) {
      return parsed.ids;
    }

    return [];
  } catch {
    const objectMatch = raw.match(/\{[\s\S]*\}/);

    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        return Array.isArray(parsed.ids) ? parsed.ids : [];
      } catch {
        return [];
      }
    }

    const arrayMatch = raw.match(/\[[\s\S]*?\]/);

    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }
};

const callOpenRouter = async (query, notesContext, signal) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Falta VITE_OPENROUTER_API_KEY en el archivo .env");
  }

  console.log("Buscando con IA:", query);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-OpenRouter-Title": "Notala",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `Eres un buscador semántico de notas.

Tu tarea es leer la búsqueda del usuario y compararla con el contenido de las notas.

Debes asociar conceptos aunque la palabra exacta no aparezca.

Ejemplos:
- Si el usuario busca "deportes", pueden ser relevantes notas sobre fútbol, baloncesto, skate, tenis, natación, billar, gimnasio, correr, etc.
- Si busca "comida", pueden ser relevantes notas sobre pizza, helado, restaurante, receta, cena, etc.
- Si busca "trabajo", pueden ser relevantes notas sobre reunión, proyecto, cliente, informe, tarea, empresa, etc.

No busques solo coincidencias exactas.
Debes interpretar el significado.

Responde SIEMPRE con JSON válido.

Formato obligatorio:
{
  "ids": ["id1", "id2"]
}

Si no encuentras notas relacionadas:
{
  "ids": []
}

No expliques nada.
No escribas razonamientos.
No escribas markdown.
No escribas texto fuera del JSON.`,
        },
        {
          role: "user",
          content: `Búsqueda del usuario:
"${query}"

Notas disponibles:
${JSON.stringify(notesContext, null, 2)}

Devuelve solo los ids de las notas relacionadas en este formato:
{
  "ids": []
}`,
        },
      ],
      max_tokens: 200,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content?.trim() || "";

  console.log("Respuesta IA sin procesar:", raw);

  return extractIdsFromAIResponse(raw);
};

export const searchNotesWithAI = async (query, notes, options = {}) => {
  if (!query?.trim()) return [];

  if (!Array.isArray(notes) || notes.length === 0) {
    return [];
  }

  const notesContext = notes.map((note) => ({
    id: String(note.id),
    title: note.title || "Sin título",
    content: note.content || "",
    tags: note.tags || [],
  }));

  try {
    const ids = await callOpenRouter(query, notesContext, options.signal);

    if (!Array.isArray(ids)) {
      return [];
    }

    const idsSet = new Set(ids.map(String));

    return notes.filter((note) => idsSet.has(String(note.id)));
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.error("Error buscando con IA:", error);
    return [];
  }
};