import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/ai/validate-prompt-viability
 * Checks if songs in general can possibly fit a round prompt theme.
 * Called at game creation time — warns the creator if the prompt is too niche.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 2) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "prompt is required", status: 400 } },
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

    const userPrompt = `Can music songs generally fit the theme "${prompt.trim()}"? yes/no`

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
      // Fail open — don't block game creation on AI outage
      return NextResponse.json({ viable: true }, { status: 200 })
    }

    const data = await openAIResponse.json()
    const responseText = data.choices?.[0]?.message?.content?.trim() || ""
    const viable = /^yes$/i.test(responseText)

    return NextResponse.json({ viable }, { status: 200 })
  } catch {
    // Fail open
    return NextResponse.json({ viable: true }, { status: 200 })
  }
}
