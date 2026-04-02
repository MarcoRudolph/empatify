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

    // gpt-4o-mini: ~$0.15/1M input tokens — single-message format minimises cost
    const model = "gpt-4o-mini"

    // Minimal prompt: ~12 input tokens, 1 output token
    // "yes" and "no" are reliable single tokens; avoids German "Nein" (2 tokens)
    const userPrompt = `${category}? yes/no\n${songName}`

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 1,
        temperature: 0,
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

    const isValid = /^yes$/i.test(responseText)

    return NextResponse.json(
      {
        valid: isValid,
        response: responseText,
        tokensUsed: data.usage?.prompt_tokens ?? 12,
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
