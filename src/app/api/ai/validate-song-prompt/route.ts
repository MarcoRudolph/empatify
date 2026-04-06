import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/ai/validate-song-prompt
 * Checks if a song fits a round prompt theme.
 * Uses the same ultra-cheap yes/no pattern as validate-song-category (~12 tokens/call).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { songName, prompt } = body

    if (!songName || !prompt) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "songName and prompt are required", status: 400 } },
        { status: 400 }
      )
    }

    const apiKey = process.env.CHATGPT_APIKEY
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: "CONFIG_ERROR", message: "AI service not configured", status: 500 } },
        { status: 500 }
      )
    }

    const userPrompt = `Fits theme "${prompt}"? yes/no\n${songName}`

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 1,
        temperature: 0,
      }),
    })

    if (!openAIResponse.ok) {
      return NextResponse.json(
        { error: { code: "OPENAI_API_ERROR", message: "Failed to validate song prompt", status: openAIResponse.status } },
        { status: openAIResponse.status }
      )
    }

    const data = await openAIResponse.json()
    const responseText = data.choices?.[0]?.message?.content?.trim() || ""
    const fits = /^yes$/i.test(responseText)

    return NextResponse.json({ fits, tokensUsed: data.usage?.prompt_tokens ?? 12 }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error?.message || "Failed to validate", status: 500 } },
      { status: 500 }
    )
  }
}
