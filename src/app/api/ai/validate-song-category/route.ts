import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/ai/validate-song-category
 * Validates if a song matches a given music category using OpenAI ChatGPT API
 * 
 * @param songName - Name of the song (e.g., "Bohemian Rhapsody")
 * @param category - Music category (e.g., "Rock", "Pop", "Jazz")
 * @returns { valid: boolean } - true if song matches category, false otherwise
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { songName, category } = body

    if (!songName || !category) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "songName and category are required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Check if API key is configured
    const apiKey = process.env.CHATGPT_APIKEY
    if (!apiKey) {
      console.error("CHATGPT_APIKEY environment variable is not set")
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "AI validation service is not configured",
            status: 500,
          },
        },
        { status: 500 }
      )
    }

    // Use cost-effective model (gpt-4o-mini or gpt-3.5-turbo)
    const model = "gpt-4o-mini"
    
    // Improved prompt with context and more tolerance for genre overlaps
    const systemPrompt = `Du bist ein Musik-Experte für ein Musikrate-Spiel. 
Deine Aufgabe ist es zu bewerten, ob ein Song zur gewählten Spielkategorie passt.
Wichtig: 
- Genre-Überschneidungen und Subgenres sind normal und sollten akzeptiert werden
- Wenn ein Song hauptsächlich oder teilweise zur Kategorie gehört, ist das ausreichend
- Nur wenn der Song offensichtlich NICHT zur Kategorie passt, solltest du "Nein" sagen
- Sei großzügig bei der Bewertung

Antworte NUR mit "Ja" oder "Nein".`

    const userPrompt = `Song: "${songName}"
Kategorie: "${category}"

Passt dieser Song zur Kategorie?`

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 10, // Minimal tokens since we only expect "Ja" or "Nein"
        temperature: 0.2, // Slightly less deterministic for better genre understanding
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error("OpenAI API error:", errorText)
      
      // Handle specific error cases
      if (openAIResponse.status === 401) {
        return NextResponse.json(
          {
            error: {
              code: "AUTH_ERROR",
              message: "Invalid API key",
              status: 401,
            },
          },
          { status: 401 }
        )
      }
      
      if (openAIResponse.status === 429) {
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMIT_ERROR",
              message: "Rate limit exceeded. Please try again later.",
              status: 429,
            },
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: {
            code: "OPENAI_API_ERROR",
            message: "Failed to validate song category",
            status: openAIResponse.status,
          },
        },
        { status: openAIResponse.status }
      )
    }

    const data = await openAIResponse.json()
    const responseText = data.choices?.[0]?.message?.content?.trim() || ""

    // Parse response: "Ja" = valid, "Nein" = invalid
    // Handle variations: "Ja", "ja", "Yes", "yes", etc.
    const isValid = /^(ja|yes)$/i.test(responseText)

    return NextResponse.json(
      {
        valid: isValid,
        response: responseText,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error validating song category:", error)
    
    // Handle timeout errors
    if (error.name === "AbortError" || error.message?.includes("timeout")) {
      return NextResponse.json(
        {
          error: {
            code: "TIMEOUT_ERROR",
            message: "Validation request timed out. Please try again.",
            status: 504,
          },
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to validate song category",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
